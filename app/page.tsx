'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import AgentStatus from '@/components/AgentStatus';
import PortfolioMetrics from '@/components/PortfolioMetrics';
import TransactionHistory from '@/components/TransactionHistory';
import PortfolioChart from '@/components/PortfolioChart';
import { useWallet } from '@/context/WalletContext';
import { signTransaction } from '@stellar/freighter-api';
import * as StellarSdk from '@stellar/stellar-sdk';

export default function Home() {
    const [mounted, setMounted] = useState(false);
    const [isRefining, setIsRefining] = useState(false);
    const [refineMessage, setRefineMessage] = useState<{ type: 'success' | 'error' | 'cooldown', text: string, countdown?: number } | null>(null);
    const { address, isAuthorized } = useWallet();
    const [cooldownSeconds, setCooldownSeconds] = useState<number | null>(null);

    // System Logs State
    const [logs, setLogs] = useState<{ time: string, msg: string }[]>([]);

    // Helper to add logs with auto-clear limit
    const addLog = (msg: string) => {
        const time = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setLogs(prev => {
            const newLogs = [{ time, msg }, ...prev];
            return newLogs.slice(0, 50); // Keep only latest 50
        });
    };

    useEffect(() => {
        setMounted(true);
    }, []);

    // Cooldown countdown effect
    // Cooldown countdown effect with 100ms precision
    useEffect(() => {
        if (cooldownSeconds !== null && cooldownSeconds > 0) {
            const interval = setInterval(() => {
                setCooldownSeconds(prev => {
                    if (prev === null || prev <= 0) {
                        setRefineMessage(null);
                        return null;
                    }
                    return Math.max(0, prev - 0.1);
                });
            }, 100);

            return () => clearInterval(interval);
        } else if (cooldownSeconds !== null && cooldownSeconds <= 0) {
            setCooldownSeconds(null);
            setRefineMessage(null);
        }
    }, [cooldownSeconds !== null]); // Only restart if active state changes

    // Format seconds to MM:SS.s
    const formatCountdown = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        const ms = Math.floor((seconds % 1) * 10);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms}`;
    };

    // Handle refine strategy button click
    const handleRefineStrategy = async () => {
        setRefineMessage(null);
        setCooldownSeconds(null);

        if (!isAuthorized || !address) {
            setRefineMessage({
                type: 'error',
                text: 'Please connect your wallet first'
            });
            addLog("Error: Wallet not connected");
            return;
        }

        setIsRefining(true);
        addLog("Initiating Strategy Refinement Protocol...");

        try {
            console.log('[RefineStrategy] Calling API with wallet:', address);
            addLog(`Requesting analysis for wallet: ${address.substring(0, 4)}...${address.substring(address.length - 4)}`);

            // 1. Simulate and get Transaction XDR
            const response = await fetch('/api/portfolio/refine', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    walletAddress: address,
                    performanceMetric: 10,
                }),
            });

            const result = await response.json();
            console.log('[RefineStrategy] Response:', result);

            if (result.success && result.transactionXDR) {
                try {
                    // 2. Re-instantiate XDR to ensure it's valid and clean
                    const transaction = StellarSdk.TransactionBuilder.fromXDR(
                        result.transactionXDR,
                        StellarSdk.Networks.TESTNET
                    );

                    // 3. Request Signature from Freighter using the clean XDR string
                    setRefineMessage({
                        type: 'success',
                        text: 'Please sign the transaction in your wallet...'
                    });
                    addLog("Simulation successful. Waiting for user signature...");

                    // Use networkPassphrase consistent with Freighter API
                    // signTransaction can return an object { signedXdr: string } or string depending on version
                    const signedResult = await signTransaction(transaction.toXDR(), {
                        networkPassphrase: 'Test SDF Network ; September 2015',
                    });

                    console.log("[RefineStrategy] Raw wallet response:", signedResult);

                    // Robust Type Extraction for Wallet Response
                    // Handles string, object with signedTxXdr (Freighter specific), signedXdr, or signedXDR
                    const finalXdr = typeof signedResult === 'string'
                        ? signedResult
                        : (signedResult as any)?.signedTxXdr || (signedResult as any)?.signedXdr || (signedResult as any)?.signedXDR;

                    console.log("[RefineStrategy] Extracted XDR:", finalXdr);

                    if (!finalXdr) {
                        throw new Error("Wallet returned an empty signature");
                    }

                    if (finalXdr) {
                        addLog("Signature received. Submitting to network...");
                        // 4. Submit Signed Transaction
                        setRefineMessage({
                            type: 'success',
                            text: 'Submitting transaction to network...'
                        });

                        // Explicit Body Mapping: Use 'signedXdr' (lowercase d) exactly as requested
                        const submitResponse = await fetch('/api/transaction/submit', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ signedXdr: finalXdr }),
                        });

                        const submitResult = await submitResponse.json();
                        console.log('[RefineStrategy] Submit Result:', submitResult);

                        // Success State: Reload only if fully successful
                        if (submitResponse.ok && submitResult.success) {
                            setRefineMessage({
                                type: 'success',
                                text: 'Strategy refined successfully! Transaction verified.'
                            });
                            // Reload page to reflect new transaction count
                            setTimeout(() => window.location.reload(), 2000);
                        } else {
                            // Detailed Error Catching: Show backend message
                            const errorMessage = submitResult.message || `Error: ${submitResponse.status} ${submitResponse.statusText}`;
                            addLog(`Submission failed: ${errorMessage}`);
                            setRefineMessage({
                                type: 'error',
                                text: errorMessage
                            });
                        }
                    } else {
                        addLog("Error: Empty signature from wallet");
                        throw new Error("Wallet returned an empty signature");
                    }
                } catch (innerError: any) {
                    console.error('[RefineStrategy] Signing/Submission Error:', innerError);
                    addLog(`Error during signing/submission: ${innerError.message}`);
                    setRefineMessage({
                        type: 'error',
                        text: innerError.message || 'Failed to sign or processing transaction'
                    });
                }
            } else if (result.success) {
                addLog("Refinement complete (No transaction needed).");
                // Fallback for cases without XDR
                setRefineMessage({
                    type: 'success',
                    text: result.message || 'Strategy refined successfully!'
                });
                setTimeout(() => window.location.reload(), 2000);
            } else {
                // Handle Errors / Cooldown
                if (result.error === 'COOLDOWN_ACTIVE') {
                    const remaining = result.cooldownRemaining || 0;

                    // Log Sanitization: Only log if not already tracking this specific cooldown
                    if (cooldownSeconds === null) {
                        addLog(`Cooldown active. System recharging for ${remaining}s...`);
                    }

                    if (remaining > 0) {
                        setCooldownSeconds(remaining);
                        setRefineMessage({
                            type: 'cooldown',
                            text: 'Strategy optimization is recharging',
                            countdown: remaining
                        });


                    } else {
                        // If 0s but error active, give a small buffer
                        setCooldownSeconds(2.0);
                        setRefineMessage({
                            type: 'cooldown',
                            text: 'Strategy stabilizing...',
                            countdown: 2.0
                        });
                    }
                } else {
                    addLog(`Strategy refinement failed: ${result.message}`);
                    setRefineMessage({
                        type: 'error',
                        text: result.message || 'Failed to refine strategy'
                    });
                }
            }
        } catch (error) {
            console.error('[RefineStrategy] Error:', error);
            addLog("Network communication error.");
            setRefineMessage({
                type: 'error',
                text: 'Network error. Please try again.'
            });
        } finally {
            setIsRefining(false);
        }
    };

    if (!mounted) return null;

    return (
        <main className="min-h-screen bg-cyber-darker">
            <Header />

            <div className="container mx-auto px-4 py-8">
                {/* Hero Section with AI Status Badge */}
                <div className="mb-12 text-center">
                    <div className="flex items-center justify-center gap-4 mb-4">
                        <h1 className="text-6xl font-bold glow-text text-transparent bg-clip-text bg-gradient-neon animate-pulse-slow">
                            Self-Refining Portfolio Agent
                        </h1>

                        {/* AI Status Badge */}
                        <div className="flex items-center gap-2 px-4 py-2 bg-cyber-green/10 border border-cyber-green/30 rounded-full">
                            <div className="relative">
                                <div className="w-3 h-3 bg-cyber-green rounded-full animate-pulse"></div>
                                <div className="absolute inset-0 w-3 h-3 bg-cyber-green rounded-full animate-ping"></div>
                            </div>
                            <span className="text-sm text-cyber-green font-semibold">
                                AI Logic: Active & Monitoring
                            </span>
                        </div>
                    </div>
                    <p className="text-xl text-gray-400">
                        AI-Powered Cryptocurrency Portfolio Management on Stellar
                    </p>
                </div>

                {/* Agent Status Card */}
                <div className="mb-8">
                    <AgentStatus />
                </div>

                {/* Main Dashboard Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                    {/* Portfolio Metrics - Takes 2 columns */}
                    <div className="lg:col-span-2">
                        <PortfolioMetrics />
                    </div>

                    {/* Quick Actions Panel */}
                    <div className="flex flex-col gap-6">
                        <div className="border-glow bg-cyber-dark/50 backdrop-blur-lg rounded-xl p-6">
                            <h3 className="text-2xl font-bold mb-6 text-cyber-blue">Quick Actions</h3>

                            {/* Refine Message / Cooldown Timer */}
                            {refineMessage && (
                                <div className={`mb-4 p-4 rounded-lg ${refineMessage.type === 'success'
                                    ? 'bg-cyber-green/20 text-cyber-green border border-cyber-green/30'
                                    : refineMessage.type === 'cooldown'
                                        ? 'bg-cyber-blue/20 text-cyber-blue border border-cyber-blue/30'
                                        : 'bg-red-500/20 text-red-400 border border-red-500/30'
                                    }`}>
                                    {refineMessage.type === 'cooldown' && cooldownSeconds ? (
                                        <div className="text-center">
                                            <div className="text-sm mb-2">{refineMessage.text}</div>
                                            <div className="text-3xl font-bold font-mono">
                                                Next Optimization in: {formatCountdown(cooldownSeconds)}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-sm">{refineMessage.text}</div>
                                    )}
                                </div>
                            )}

                            <div className="space-y-4">
                                {/* Deploy Agent - Coming Soon */}
                                <div className="relative group">
                                    <button disabled className="w-full bg-gradient-to-r from-cyber-blue to-cyber-purple opacity-40 cursor-not-allowed transition-all duration-300 text-white font-semibold py-3 px-6 rounded-lg">
                                        Deploy Agent
                                    </button>
                                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                        🚀 Coming Soon - Phase 2
                                    </div>
                                </div>

                                {/* Refine Strategy - Active */}
                                <button
                                    className={`w-full bg-gradient-to-r from-cyber-purple to-cyber-pink hover:shadow-neon-purple transition-all duration-300 text-white font-semibold py-3 px-6 rounded-lg ${isRefining || !isAuthorized || cooldownSeconds !== null ? 'opacity-50 cursor-not-allowed' : ''
                                        }`}
                                    onClick={handleRefineStrategy}
                                    disabled={isRefining || !isAuthorized || cooldownSeconds !== null}
                                >
                                    {isRefining ? 'Refining...' : cooldownSeconds !== null ? `Recharging (${Math.ceil(cooldownSeconds)}s)` : 'Refine Strategy'}
                                </button>

                                {/* View Analytics - Coming Soon */}
                                <div className="relative group">
                                    <button disabled className="w-full bg-gradient-to-r from-cyber-green to-cyber-blue opacity-40 cursor-not-allowed transition-all duration-300 text-white font-semibold py-3 px-6 rounded-lg">
                                        View Analytics
                                    </button>
                                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                        📊 Preview Available Below
                                    </div>
                                </div>

                                {/* Settings - Coming Soon */}
                                <div className="relative group">
                                    <button disabled className="w-full border-2 border-cyber-blue opacity-40 cursor-not-allowed transition-all duration-300 text-cyber-blue font-semibold py-3 px-6 rounded-lg">
                                        Settings
                                    </button>
                                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                        ⚙️ Planned Feature - Phase 3
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* System Live Log */}
                        <div className="border-glow bg-black/60 backdrop-blur-lg rounded-xl p-4 font-mono text-xs overflow-hidden flex flex-col h-[200px]">
                            <div className="flex items-center gap-2 mb-3 border-b border-gray-800 pb-2">
                                <span className="w-2 h-2 rounded-full bg-cyber-green animate-pulse"></span>
                                <h3 className="text-cyber-green font-bold uppercase tracking-wider">System Live Log</h3>
                            </div>
                            <div className="flex-1 overflow-y-auto space-y-1 pr-2 custom-scrollbar">
                                {logs.length === 0 && (
                                    <div className="text-gray-600 italic">System ready. Waiting for events...</div>
                                )}
                                {logs.map((log, i) => (
                                    <div key={i} className="flex gap-3 animate-fade-in-up">
                                        <span className="text-gray-500 whitespace-nowrap">[{log.time}]</span>
                                        <span className="text-cyan-400">{log.msg}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Portfolio Chart - Mock Analytics */}
                <div className="mb-8">
                    <PortfolioChart />
                </div>

                {/* Transaction History */}
                <div>
                    <TransactionHistory />
                </div>
            </div>

            {/* Animated Background Elements */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyber-blue/10 rounded-full filter blur-3xl animate-pulse-slow"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyber-purple/10 rounded-full filter blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
                <div className="absolute top-1/2 right-1/3 w-96 h-96 bg-cyber-pink/10 rounded-full filter blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
            </div>
        </main>
    );
}
