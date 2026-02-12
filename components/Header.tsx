'use client';

import { useWallet } from '@/context/WalletContext';

export default function Header() {
    const { address, isAuthorized, isLoading, error, balance, connect, disconnect } = useWallet();

    // DEBUG: Log wallet state in Header
    console.log('[Header] Wallet State:', {
        address,
        isAuthorized,
        balance,
        hasAddress: !!address,
        addressLength: address?.length
    });

    // Truncate address for display (e.g., GA3X...4Y5Z)
    const truncateAddress = (addr: string): string => {
        if (addr.length <= 12) return addr;
        return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
    };

    return (
        <header className="border-b border-cyber-blue/30 bg-cyber-dark/80 backdrop-blur-lg sticky top-0 z-50">
            <div className="container mx-auto px-4 py-4">
                <div className="flex items-center justify-between">
                    {/* Logo */}
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-neon rounded-lg flex items-center justify-center animate-glow">
                            <span className="text-2xl">🤖</span>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-cyber-blue">Portfolio Agent</h2>
                            <p className="text-xs text-gray-500">Stellar Blockchain</p>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="hidden md:flex items-center space-x-8">
                        <a href="#" className="text-gray-300 hover:text-cyber-blue transition-colors">Dashboard</a>
                        <a href="#" className="text-gray-300 hover:text-cyber-blue transition-colors">Analytics</a>
                        <a href="#" className="text-gray-300 hover:text-cyber-blue transition-colors">Strategy</a>
                        <a href="#" className="text-gray-300 hover:text-cyber-blue transition-colors">History</a>
                    </nav>

                    {/* Wallet Connection */}
                    <div className="flex flex-col items-end space-y-1">
                        {!isAuthorized ? (
                            // Disconnected State
                            <button
                                onClick={connect}
                                disabled={isLoading}
                                className="bg-gradient-to-r from-cyber-blue to-cyber-purple hover:shadow-neon-blue transition-all duration-300 text-white font-semibold py-2 px-6 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <span className="flex items-center space-x-2">
                                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        <span>Connecting...</span>
                                    </span>
                                ) : (
                                    'Connect Freighter'
                                )}
                            </button>
                        ) : (
                            // Connected State
                            <div className="flex flex-col items-end space-y-2">
                                <div className="flex items-center space-x-3">
                                    <div className="flex items-center space-x-2 bg-cyber-darker/50 px-4 py-2 rounded-lg border border-cyber-blue/30">
                                        <div className="w-2 h-2 bg-cyber-green rounded-full animate-pulse"></div>
                                        <span className="text-sm font-mono text-cyber-blue">{truncateAddress(address!)}</span>
                                        <span className="text-xs text-gray-500">TESTNET</span>
                                    </div>
                                    <button
                                        onClick={disconnect}
                                        className="bg-cyber-darker/50 hover:bg-red-500/20 hover:border-red-500/50 text-gray-300 hover:text-red-400 font-semibold py-2 px-4 rounded-lg text-sm border border-cyber-blue/20 transition-all duration-300"
                                    >
                                        Disconnect
                                    </button>
                                </div>
                                {/* Balance Display */}
                                {balance !== null && (
                                    <div className="text-sm font-mono text-cyber-green bg-cyber-green/10 px-3 py-1 rounded border border-cyber-green/30">
                                        {parseFloat(balance).toFixed(2)} XLM
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Error Message */}
                        {error && (
                            <div className={`text-xs px-3 py-2 rounded border ${error.includes('locked')
                                    ? 'bg-yellow-500/20 border-yellow-500/40'
                                    : 'bg-red-500/10 border-red-500/20'
                                }`}>
                                {error.includes('locked') ? (
                                    <div className="flex items-center space-x-2">
                                        <span className="text-lg">🔒</span>
                                        <div>
                                            <p className="font-semibold text-yellow-300">Wallet Locked</p>
                                            <p className="text-xs opacity-80 text-yellow-200">
                                                Please unlock your Freighter extension by entering your password
                                            </p>
                                        </div>
                                    </div>
                                ) : error.includes('not installed') ? (
                                    <span className="text-red-400">
                                        {error}{' '}
                                        <a
                                            href="https://www.freighter.app/"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="underline hover:text-red-300"
                                        >
                                            Install here
                                        </a>
                                    </span>
                                ) : (
                                    <span className="text-red-400">{error}</span>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
