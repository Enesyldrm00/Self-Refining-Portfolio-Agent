/**
 * Stellar Service - Soroban Smart Contract Integration
 * 
 * This service handles communication with the deployed Soroban smart contract
 * on the Stellar testnet. It provides methods to fetch portfolio statistics
 * from the blockchain with error handling and timeout mechanisms.
 */

import * as StellarSdk from '@stellar/stellar-sdk';

// Destructure the necessary modules from StellarSdk
const { rpc, Networks, Contract, Keypair, TransactionBuilder, BASE_FEE, scValToNative } = StellarSdk;

// Environment variables - using process.env directly for Next.js compatibility
const CONTRACT_ID = process.env.SOROBAN_CONTRACT_ID || '';
const RPC_URL = process.env.SOROBAN_RPC_URL || 'https://soroban-testnet.stellar.org';
const NETWORK_PASSPHRASE = Networks.TESTNET;

// Timeout configuration (10 seconds)
const REQUEST_TIMEOUT = 10000;

/**
 * Portfolio statistics interface matching contract response
 */
export interface PortfolioStats {
    score: number;
    transactions: number;
    timestamp?: string;
    source: 'blockchain' | 'fallback';
}

/**
 * Fallback data when blockchain is unavailable
 */
const FALLBACK_DATA: PortfolioStats = {
    score: 8.7,
    transactions: 142,
    timestamp: new Date().toISOString(),
    source: 'fallback'
};

/**
 * Initialize Soroban RPC server connection using the rpc namespace
 */
function getSorobanServer(): InstanceType<typeof rpc.Server> {
    if (!RPC_URL) {
        throw new Error('SOROBAN_RPC_URL environment variable is not set');
    }
    return new rpc.Server(RPC_URL, {
        allowHttp: RPC_URL.startsWith('http://'),
    });
}

/**
 * Call the get_stats function on the smart contract
 * 
 * @returns Portfolio statistics from the contract or fallback data
 */
export async function getContractStats(): Promise<PortfolioStats> {
    try {
        // Validate contract ID
        if (!CONTRACT_ID || CONTRACT_ID.trim() === '') {
            console.error('[StellarService] Contract ID not configured');
            return FALLBACK_DATA;
        }

        console.log('[StellarService] Fetching stats from contract:', CONTRACT_ID);
        console.log('[StellarService] Using RPC URL:', RPC_URL);

        const server = getSorobanServer();

        // Create a source account (can be any valid account for read-only operations)
        const sourceKeypair = Keypair.random();

        // For simulation, we don't need a real account
        let sourceAccount;
        try {
            sourceAccount = await server.getAccount(sourceKeypair.publicKey());
        } catch (err) {
            // If account doesn't exist, create a mock account for simulation
            sourceAccount = new StellarSdk.Account(sourceKeypair.publicKey(), '0');
        }

        // Build the contract transaction
        const contract = new Contract(CONTRACT_ID);

        // Build transaction to call get_metrics function (correct function name in contract)
        const transaction = new TransactionBuilder(sourceAccount, {
            fee: BASE_FEE,
            networkPassphrase: NETWORK_PASSPHRASE,
        })
            .addOperation(contract.call('get_metrics'))
            .setTimeout(30)
            .build();

        console.log('[StellarService] Simulating transaction...');

        // Simulate the transaction to get the result without submitting
        const simulationResult = await Promise.race([
            server.simulateTransaction(transaction),
            new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error('Request timeout')), REQUEST_TIMEOUT)
            )
        ]);

        console.log('[StellarService] Simulation result:', simulationResult);

        // Check if simulation was successful using rpc.Api
        if (rpc.Api.isSimulationSuccess(simulationResult)) {
            const resultValue = simulationResult.result?.retval;

            if (resultValue) {
                // Parse the contract response using scValToNative for proper conversion
                const stats = parseContractResult(resultValue);

                console.log('[StellarService] Successfully fetched stats:', stats);

                return {
                    ...stats,
                    timestamp: new Date().toISOString(),
                    source: 'blockchain'
                };
            } else {
                console.warn('[StellarService] No return value from contract');
            }
        } else {
            // Log simulation error details
            console.warn('[StellarService] Simulation failed:', simulationResult);
        }

        // If simulation failed, log and return fallback
        console.warn('[StellarService] Using fallback data');
        return FALLBACK_DATA;

    } catch (error) {
        // Handle specific errors gracefully
        if (error instanceof Error) {
            console.error('[StellarService] Error details:', {
                message: error.message,
                name: error.name,
                stack: error.stack
            });

            // Handle common errors
            if (error.message.includes('UnknownIssuer') ||
                error.message.includes('timeout') ||
                error.message.includes('network')) {
                console.warn('[StellarService] Blockchain unreachable, using fallback');
            }
        } else {
            console.error('[StellarService] Unknown error:', error);
        }

        return FALLBACK_DATA;
    }
}

/**
 * Parse the contract result value into PortfolioStats
 * Contract returns tuple: (score: u32, trades: u32, last_refinement: u64, admin: Address)
 * Uses scValToNative for proper data conversion (u32 -> number)
 * 
 * @param resultValue - ScVal from contract response
 * @returns Parsed portfolio statistics
 */
function parseContractResult(resultValue: StellarSdk.xdr.ScVal): Omit<PortfolioStats, 'timestamp' | 'source'> {
    try {
        // Use scValToNative to convert ScVal to native JavaScript types
        // Contract returns tuple: (score: u32, trades: u32, last_refinement: u64, admin: Address)
        const nativeValue = scValToNative(resultValue);

        console.log('[StellarService] Native value:', nativeValue);

        // Contract returns an array (tuple) with 4 elements: [score, trades, last_refinement, admin]
        if (Array.isArray(nativeValue) && nativeValue.length >= 2) {
            const score = nativeValue[0]; // u32 -> number
            const trades = nativeValue[1]; // u32 -> number
            // Note: nativeValue[2] = last_refinement (u64)
            // Note: nativeValue[3] = admin (Address)

            // Convert score from contract format (87) to display format (8.7)
            // Contract stores score * 10 (e.g., 87 = 8.7/10)
            const displayScore = typeof score === 'number' ? score / 10 : 8.7;
            const transactions = typeof trades === 'number' ? trades : 142;

            console.log('[StellarService] Parsed tuple - score:', score, '-> display:', displayScore, 'trades:', transactions);

            return {
                score: displayScore,
                transactions
            };
        }

        // Fallback: Check if it's a Map (shouldn't happen with get_metrics, but keep as safety)
        if (nativeValue instanceof Map) {
            const score = nativeValue.get('score') ?? 87;
            const transactions = nativeValue.get('transactions') ?? 142;

            return {
                score: typeof score === 'number' ? score / 10 : 8.7,
                transactions: typeof transactions === 'number' ? transactions : 142
            };
        }

        // Default fallback values if parsing fails
        console.warn('[StellarService] Unknown native value format, using defaults');
        return { score: 8.7, transactions: 142 };

    } catch (error) {
        console.error('[StellarService] Error parsing contract result with scValToNative:', error);

        // Fallback to manual parsing if scValToNative fails
        return parseContractResultManual(resultValue);
    }
}

/**
 * Manual fallback parser for contract results
 * 
 * @param resultValue - ScVal from contract response
 * @returns Parsed portfolio statistics
 */
function parseContractResultManual(resultValue: StellarSdk.xdr.ScVal): Omit<PortfolioStats, 'timestamp' | 'source'> {
    try {
        // The contract likely returns a map or struct
        // For map type: { score: ScVal, transactions: ScVal }
        if (resultValue.switch().name === 'scvMap') {
            const map = resultValue.map();
            let score = 8.7;
            let transactions = 142;

            if (map) {
                map.forEach((entry) => {
                    const key = entry.key();
                    const val = entry.val();

                    // Convert key to string
                    const keyStr = key.switch().name === 'scvSymbol'
                        ? key.sym().toString()
                        : '';

                    if (keyStr === 'score') {
                        // Parse score (might be U64, I64, or U32)
                        score = parseScValNumber(val);
                    } else if (keyStr === 'transactions') {
                        // Parse transactions count (should be u32)
                        transactions = Math.floor(parseScValNumber(val));
                    }
                });
            }

            return { score, transactions };
        }

        // Default fallback values
        console.warn('[StellarService] Unknown contract result format');
        return { score: 8.7, transactions: 142 };

    } catch (error) {
        console.error('[StellarService] Error in manual parsing:', error);
        return { score: 8.7, transactions: 142 };
    }
}

/**
 * Parse a ScVal number into a JavaScript number
 * Handles u32, i32, u64, i64, and u128 types
 * 
 * @param val - ScVal to parse
 * @returns Parsed number
 */
function parseScValNumber(val: StellarSdk.xdr.ScVal): number {
    const switchName = val.switch().name;

    switch (switchName) {
        case 'scvU32':
            return val.u32();
        case 'scvI32':
            return val.i32();
        case 'scvU64':
            return Number(val.u64());
        case 'scvI64':
            return Number(val.i64());
        case 'scvU128': {
            const u128 = val.u128();
            // For simplicity, just use the low part
            return Number(u128.lo());
        }
        default:
            console.warn('[StellarService] Unknown number type:', switchName);
            return 0;
    }
}

/**
 * Test connection to Soroban RPC server
 * 
 * @returns True if connection is successful
 */
export async function testConnection(): Promise<boolean> {
    try {
        const server = getSorobanServer();
        const health = await server.getHealth();
        console.log('[StellarService] RPC Health:', health);
        return health.status === 'healthy';
    } catch (error) {
        console.error('[StellarService] Connection test failed:', error);
        return false;
    }
}

/**
 * Response interface for refine strategy operation
 */
export interface RefineStrategyResponse {
    success: boolean;
    newScore?: number;
    message: string;
    error?: string;
    cooldownRemaining?: number;
    transactionXDR?: string;
}

/**
 * Refine the portfolio strategy on the blockchain
 * 
 * @param walletAddress - User's wallet address from Freighter
 * @param performanceMetric - Performance indicator (default: 10)
 * @returns Result of the refinement operation
 */
export async function refineStrategy(
    walletAddress: string,
    performanceMetric: number = 10
): Promise<RefineStrategyResponse> {
    try {
        console.log('[StellarService] Refining strategy with metric:', performanceMetric);

        // 1. Safety: Check cooldown first before doing anything else
        const cooldownRemaining = await getCooldownRemaining();
        if (cooldownRemaining > 0) {
            console.warn(`[StellarService] Safety check: Cooldown active (${cooldownRemaining}s)`);
            return {
                success: false,
                message: `Strategy refinement is on cooldown. Please wait ${cooldownRemaining} seconds.`,
                error: 'COOLDOWN_ACTIVE',
                cooldownRemaining
            };
        }

        if (!CONTRACT_ID || CONTRACT_ID.trim() === '') {
            return {
                success: false,
                message: 'Contract ID not configured',
                error: 'UNKNOWN_ERROR' // Using generic error code as per interface
            };
        }

        const server = getSorobanServer();

        // 2. Get Account using clean try-catch
        let sourceAccount;
        try {
            sourceAccount = await server.getAccount(walletAddress);
        } catch (error) {
            console.error('[StellarService] Failed to load source account:', error);
            return {
                success: false,
                message: 'Failed to load wallet account. Please ensure it is funded on Testnet.',
                error: 'UNKNOWN_ERROR'
            };
        }

        const contract = new Contract(CONTRACT_ID);

        // Build transaction
        const transaction = new TransactionBuilder(sourceAccount, {
            fee: BASE_FEE,
            networkPassphrase: NETWORK_PASSPHRASE,
        })
            .addOperation(
                contract.call(
                    'refine_strategy',
                    StellarSdk.Address.fromString(walletAddress).toScVal(),
                    StellarSdk.nativeToScVal(performanceMetric, { type: 'i32' })
                )
            )
            .setTimeout(30)
            .build();

        console.log('[StellarService] Simulating transaction...');

        // Simulate
        const simulationResult = await server.simulateTransaction(transaction);

        // Check simulation success
        if (rpc.Api.isSimulationSuccess(simulationResult)) {
            // Prepare the transaction for signing
            const preparedTransaction = rpc.assembleTransaction(
                transaction,
                simulationResult
            ).build();

            // Return XDR for signing
            return {
                success: true,
                message: 'Transaction simulated successfully. Signing required.',
                // @ts-ignore - Adding extra field for XDR
                transactionXDR: preparedTransaction.toXDR()
            };
        } else {
            // Simulation Failed
            console.error('[StellarService] Simulation failed:', simulationResult);

            // Check for UnreachableCodeReached (Cooldown panic) or specific error strings
            // The simulation result error string usually is in simulationResult.error
            const simError = simulationResult.error || '';

            // Also check the generic error message created by JSON.stringify in previous code
            const errorString = JSON.stringify(simulationResult).toLowerCase();

            if (errorString.includes('unreachablecodereached') ||
                errorString.includes('vm call trapped') ||
                errorString.includes('unreachable')) {

                // Double check cooldown remaining just to be sure and get exact time
                const remaining = await getCooldownRemaining();
                return {
                    success: false,
                    message: `Strategy refinement is on cooldown. Please wait ${remaining} seconds.`,
                    error: 'COOLDOWN_ACTIVE',
                    cooldownRemaining: remaining
                };
            }

            return {
                success: false,
                message: `Simulation failed: ${simError}`,
                error: 'SIMULATION_FAILED'
            };
        }

    } catch (error) {
        console.error('[StellarService] Error refining strategy:', error);

        if (error instanceof Error) {
            // Check for UnreachableCodeReached in the exception if it was thrown there (unlikely for simulation but possible)
            if (error.message.includes('UnreachableCodeReached')) {
                const remaining = await getCooldownRemaining();
                return {
                    success: false,
                    message: `Strategy refinement is on cooldown. Please wait ${remaining} seconds.`,
                    error: 'COOLDOWN_ACTIVE',
                    cooldownRemaining: remaining
                };
            }

            return {
                success: false,
                message: error.message,
                error: 'UNKNOWN_ERROR'
            };
        }

        return {
            success: false,
            message: 'An unknown error occurred',
            error: 'UNKNOWN_ERROR'
        };
    }
}

/**
 * Get cooldown remaining time from contract
 * 
 * @returns Number of seconds remaining in cooldown (0 if ready)
 */
export async function getCooldownRemaining(): Promise<number> {
    try {
        console.log('[getCooldownRemaining] Fetching cooldown from contract...');

        const server = getSorobanServer();
        const contract = new Contract(CONTRACT_ID);

        // Create a random keypair for read-only simulation
        const sourceKeypair = Keypair.random();

        // Use clean try-catch for getAccount
        let sourceAccount;
        try {
            sourceAccount = await server.getAccount(sourceKeypair.publicKey());
        } catch (e) {
            // Account doesn't exist (expected for random keypair), create mock
            sourceAccount = new StellarSdk.Account(sourceKeypair.publicKey(), '0');
        }

        // Build transaction to call get_cooldown_remaining
        const transaction = new TransactionBuilder(sourceAccount, {
            fee: BASE_FEE,
            networkPassphrase: NETWORK_PASSPHRASE,
        })
            .addOperation(contract.call('get_cooldown_remaining'))
            .setTimeout(30)
            .build();

        // Simulate the transaction
        const simulationResult = await server.simulateTransaction(transaction);

        if (rpc.Api.isSimulationSuccess(simulationResult)) {
            const resultValue = simulationResult.result?.retval;

            if (resultValue) {
                // Convert ScVal to native JavaScript value
                const cooldownSeconds = scValToNative(resultValue);
                // Ensure it returns a number
                return typeof cooldownSeconds === 'number' ? cooldownSeconds : 0;
            }
        }

        return 0;

    } catch (error) {
        console.error('[getCooldownRemaining] Error fetching cooldown:', error);
        return 0; // Return 0 on error (assume ready to avoid blocking if just a read error)
    }
}

/**
 * Submit a signed transaction to the Stellar network
 * 
 * @param signedXDR - The signed transaction XDR from Freighter
 * @returns Submission result
 */
export async function submitSignedTransaction(signedXDR: string): Promise<any> {
    try {
        console.log('[StellarService] Submitting signed transaction...');

        // 1. Strict Validation: Ensure input is a string
        if (typeof signedXDR !== 'string') {
            throw new Error(`Invalid signedXDR: Expected string, got ${typeof signedXDR}`);
        }

        const cleanXDR = signedXDR.trim();
        if (!cleanXDR) {
            throw new Error('Invalid signedXDR: Empty string');
        }

        console.log(`[StellarService] XDR Length: ${cleanXDR.length}, Preview: ${cleanXDR.substring(0, 20)}...`);

        const server = getSorobanServer();

        // Deserialize the transaction
        const transaction = StellarSdk.TransactionBuilder.fromXDR(
            cleanXDR,
            NETWORK_PASSPHRASE
        );

        // Submit the transaction
        const result = await server.sendTransaction(transaction);

        console.log('[StellarService] Submission result:', result);

        // Check for success (status might be PENDING, SUCCESS, etc.)
        // For Soroban, we might need to wait for confirmation or check status
        // But for this simple implementation, we return the result directly
        return result;

    } catch (error) {
        console.error('[StellarService] Error submitting transaction:', error);
        throw error;
    }
}
