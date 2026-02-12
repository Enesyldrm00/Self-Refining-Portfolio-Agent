'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@/context/WalletContext';

// Contract stats interface
interface ContractStats {
    score: number;
    transactions: number;
    source: 'blockchain' | 'fallback';
    timestamp?: string;
}

export default function PortfolioMetrics() {
    const [timeframe, setTimeframe] = useState<'24h' | '7d' | '30d' | 'all'>('7d');
    const { balance, isLoading, address, isAuthorized, error, isWalletLocked, refreshConnection } = useWallet();

    // Contract stats state
    const [contractStats, setContractStats] = useState<ContractStats | null>(null);
    const [statsLoading, setStatsLoading] = useState(true);
    const [statsError, setStatsError] = useState<string | null>(null);

    // Fetch contract stats on mount
    useEffect(() => {
        fetchContractStats();
    }, []);

    // Fetch contract stats with retry logic
    const fetchContractStats = async (retries = 3, delay = 1000) => {
        try {
            setStatsLoading(true);
            setStatsError(null);

            const response = await fetch('/api/portfolio/stats');
            const result = await response.json();

            if (result.success && result.data) {
                setContractStats(result.data);
                console.log('[PortfolioMetrics] Contract stats loaded:', result.data);
                setStatsLoading(false);
            } else {
                throw new Error(result.message || 'Failed to load stats');
            }
        } catch (err) {
            console.error(`[PortfolioMetrics] Fetch error (Attempts left: ${retries}):`, err);
            if (retries > 0) {
                setTimeout(() => fetchContractStats(retries - 1, delay * 2), delay);
            } else {
                setStatsError('Failed to load contract statistics after multiple attempts');
                setStatsLoading(false);
            }
        }
    };

    // XLM to USD conversion rate
    const XLM_TO_USD = 0.15;

    // Parse balance
    const xlmBalance = balance ? parseFloat(balance) : 0;
    const usdValue = xlmBalance * XLM_TO_USD;

    // Determine what to show - SIMPLIFIED LOGIC
    const hasAddress = !!address && address.trim() !== '';
    const hasBalance = balance !== null;

    const shouldShowConnectMessage = !hasAddress && !isWalletLocked;
    const shouldShowLocked = isWalletLocked || (!hasAddress && error?.includes('locked'));
    const shouldShowLoading = hasAddress && !hasBalance && isLoading;
    const shouldShowBalance = hasAddress && hasBalance;

    // Debug logging
    console.log('[PortfolioMetrics] State:', {
        address,
        balance,
        isAuthorized,
        isLoading,
        isWalletLocked,
        hasAddress,
        hasBalance,
        shouldShowConnectMessage,
        shouldShowLocked,
        shouldShowLoading,
        shouldShowBalance,
    });

    return (
        <div className="border-glow bg-cyber-dark/50 backdrop-blur-lg rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-cyber-blue">Portfolio Metrics</h3>

                {/* Timeframe Selector */}
                <div className="flex space-x-2 bg-cyber-darker/50 rounded-lg p-1">
                    {(['24h', '7d', '30d', 'all'] as const).map((tf) => (
                        <button
                            key={tf}
                            onClick={() => setTimeframe(tf)}
                            className={`px-4 py-1 rounded text-sm font-semibold transition-all ${timeframe === tf
                                ? 'bg-cyber-blue text-white shadow-neon-blue'
                                : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            {tf.toUpperCase()}
                        </button>
                    ))}
                </div>
            </div>

            {/* Total Portfolio Value */}
            <div className="mb-8">
                <p className="text-gray-400 text-sm mb-2">Total Portfolio Value</p>

                {/* LOCKED WALLET STATE */}
                {shouldShowLocked && (
                    <div className="flex flex-col items-center justify-center h-32 bg-yellow-500/10 rounded-lg border border-yellow-500/30">
                        <div className="text-center mb-4">
                            <div className="text-4xl mb-2">🔒</div>
                            <p className="text-yellow-300 text-lg font-semibold">Wallet Locked</p>
                            <p className="text-gray-400 text-sm mt-1">
                                Please unlock your Freighter extension
                            </p>
                        </div>
                        <button
                            onClick={refreshConnection}
                            className="bg-gradient-to-r from-cyber-blue to-cyber-purple hover:shadow-neon-blue transition-all duration-300 text-white font-semibold py-2 px-6 rounded-lg text-sm"
                        >
                            🔓 Unlock Wallet
                        </button>
                    </div>
                )}

                {/* DISCONNECTED STATE */}
                {shouldShowConnectMessage && !shouldShowLocked && (
                    <div className="flex items-center justify-center h-24 bg-cyber-darker/30 rounded-lg border border-cyber-blue/20">
                        <div className="text-center">
                            <p className="text-gray-400 text-lg">Connect wallet to view balance</p>
                            <p className="text-gray-600 text-sm mt-1">Click "Connect Freighter" in the header</p>
                        </div>
                    </div>
                )}

                {/* LOADING STATE */}
                {shouldShowLoading && (
                    <div className="flex items-baseline space-x-4">
                        <div className="h-14 w-64 bg-gradient-to-r from-cyber-blue/20 via-cyber-purple/20 to-cyber-blue/20 rounded-lg animate-pulse"></div>
                        <p className="text-gray-400 text-sm">Fetching balance...</p>
                    </div>
                )}

                {/* BALANCE DISPLAY */}
                {shouldShowBalance && (
                    <div>
                        <div className="flex items-baseline space-x-4 mb-3">
                            <h2 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-neon">
                                {xlmBalance.toLocaleString('en-US', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 7,
                                })}{' '}
                                XLM
                            </h2>
                            <span className="text-2xl text-gray-400">
                                (${usdValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
                            </span>
                        </div>

                        {/* Zero Balance Warning */}
                        {xlmBalance === 0 && (
                            <div className="bg-cyber-purple/10 border border-cyber-purple/30 rounded-lg p-4 mt-4">
                                <div className="flex items-start space-x-3">
                                    <span className="text-2xl">💰</span>
                                    <div>
                                        <p className="text-cyber-purple font-semibold mb-1">Account not funded</p>
                                        <p className="text-gray-400 text-sm mb-2">
                                            Your testnet account needs XLM to get started.
                                        </p>
                                        <a
                                            href="https://laboratory.stellar.org/#account-creator"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-block bg-cyber-purple hover:bg-cyber-purple/80 text-white font-semibold py-2 px-4 rounded-lg text-sm transition-all duration-300"
                                        >
                                            Fund with Friendbot →
                                        </a>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Contract Statistics from Soroban */}
            <div className="mb-8">
                <h4 className="text-sm font-semibold text-gray-400 mb-4 flex items-center justify-between">
                    <span>Smart Contract Stats</span>
                    {contractStats && (
                        <span className={`text-xs px-2 py-1 rounded-full ${contractStats.source === 'blockchain'
                            ? 'bg-cyber-green/20 text-cyber-green'
                            : 'bg-yellow-500/20 text-yellow-400'
                            }`}>
                            {contractStats.source === 'blockchain' ? '🔗 Blockchain' : '💾 Fallback'}
                        </span>
                    )}
                </h4>

                {statsLoading && (
                    <div className="flex items-center justify-center h-32 bg-cyber-darker/30 rounded-lg">
                        <div className="text-center">
                            <div className="animate-spin text-4xl mb-2">⚙️</div>
                            <p className="text-gray-400 text-sm">Loading contract stats...</p>
                        </div>
                    </div>
                )}

                {statsError && !contractStats && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                        <p className="text-red-400 text-sm">Failed to load contract statistics</p>
                    </div>
                )}

                {contractStats && !statsLoading && (
                    <div className="grid grid-cols-2 gap-4">
                        {/* Portfolio Score */}
                        <div className="group relative bg-gradient-to-br from-cyber-blue/20 to-cyber-purple/20 rounded-lg p-6 border border-cyber-blue/30 hover:border-cyber-blue/50 transition-all cursor-help">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-gray-400 text-sm border-b border-dotted border-gray-500">Portfolio Score</span>
                                <span className="text-2xl">⭐</span>
                            </div>
                            <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-neon">
                                {contractStats.score.toFixed(1)}
                            </div>
                            <div className="mt-2 text-xs text-gray-500">
                                {contractStats.timestamp && new Date(contractStats.timestamp).toLocaleString('tr-TR')}
                            </div>

                            {/* Tooltip */}
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 bg-black/90 border border-cyber-blue/50 text-white text-xs rounded p-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-xl">
                                Cumulative average of {contractStats.transactions} trades executed by the agent.
                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 border-4 border-transparent border-t-black/90"></div>
                            </div>
                        </div>

                        {/* Transaction Count */}
                        <div className="group relative bg-gradient-to-br from-cyber-purple/20 to-cyber-pink/20 rounded-lg p-6 border border-cyber-purple/30 hover:border-cyber-purple/50 transition-all cursor-help">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-gray-400 text-sm border-b border-dotted border-gray-500">Transactions</span>
                                <span className="text-2xl">📊</span>
                            </div>
                            <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-neon">
                                {contractStats.transactions}
                            </div>
                            <div className="mt-2 text-xs text-gray-500">
                                Total on-chain
                            </div>

                            {/* Tooltip */}
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-40 bg-black/90 border border-cyber-purple/50 text-white text-xs rounded p-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-xl">
                                Total number of successful trades executed on the blockchain.
                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 border-4 border-transparent border-t-black/90"></div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Asset Breakdown */}
            {shouldShowBalance && xlmBalance > 0 && (
                <div>
                    <h4 className="text-sm font-semibold text-gray-400 mb-4">Asset Allocation</h4>

                    <div className="space-y-3">
                        <div className="bg-cyber-darker/50 rounded-lg p-4 border border-cyber-blue/10 hover:border-cyber-blue/30 transition-all">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                    <div className="w-3 h-3 bg-cyber-blue rounded-full"></div>
                                    <div>
                                        <p className="font-bold text-white">XLM</p>
                                        <p className="text-sm text-gray-400">
                                            {xlmBalance.toLocaleString('en-US', {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 7,
                                            })}{' '}
                                            XLM
                                        </p>
                                    </div>
                                </div>

                                <div className="text-right">
                                    <p className="font-bold text-white">
                                        ${usdValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </p>
                                    <p className="text-sm text-gray-400">@${XLM_TO_USD.toFixed(2)} USD</p>
                                </div>

                                <div className="text-right min-w-[60px]">
                                    <p className="text-lg font-bold text-cyber-blue">100%</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-cyber-darker/30 rounded-lg p-4 border border-cyber-blue/10 text-center">
                            <p className="text-gray-500 text-sm">💼 Multi-asset support coming soon</p>
                            <p className="text-gray-600 text-xs mt-1">Track USDC, BTC, ETH and other Stellar assets</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Performance Chart Placeholder */}
            {shouldShowBalance && (
                <div className="mt-6 bg-cyber-darker/30 rounded-lg p-4 border border-cyber-blue/10">
                    <div className="flex items-center justify-center h-48 text-gray-500">
                        <div className="text-center">
                            <p className="text-4xl mb-2">📊</p>
                            <p className="text-sm">Performance chart coming soon</p>
                            <p className="text-xs text-gray-600 mt-1">Will integrate with backend analytics</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
