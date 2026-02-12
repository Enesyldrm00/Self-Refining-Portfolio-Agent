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
 * Response from refine strategy operation
 */
export interface RefineStrategyResponse {
    success: boolean;
    message: string;
    transactionHash?: string;
    error?: 'COOLDOWN_ACTIVE' | 'NOT_AUTHORIZED' | 'SIMULATION_FAILED' | 'SIGNATURE_REQUIRED' | 'SUBMISSION_FAILED' | 'UNKNOWN_ERROR';
    cooldownRemaining?: number;
}

// ... [REST OF THE FILE CONTENT - keeping existing functions]
