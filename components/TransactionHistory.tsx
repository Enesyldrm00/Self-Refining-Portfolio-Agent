'use client';

export default function TransactionHistory() {
    const transactions = [
        {
            id: 1,
            type: 'swap',
            from: 'USDC',
            to: 'XLM',
            fromAmount: 100,
            toAmount: 150,
            timestamp: '2 minutes ago',
            status: 'completed',
            hash: '0x1a2b3c...',
        },
        {
            id: 2,
            type: 'swap',
            from: 'XLM',
            to: 'ETH',
            fromAmount: 500,
            toAmount: 0.15,
            timestamp: '34 minutes ago',
            status: 'completed',
            hash: '0x4d5e6f...',
        },
        {
            id: 3,
            type: 'deposit',
            from: 'External',
            to: 'USDC',
            fromAmount: 0,
            toAmount: 5000,
            timestamp: '2 hours ago',
            status: 'completed',
            hash: '0x7g8h9i...',
        },
        {
            id: 4,
            type: 'swap',
            from: 'BTC',
            to: 'XLM',
            fromAmount: 0.05,
            toAmount: 750,
            timestamp: '5 hours ago',
            status: 'completed',
            hash: '0xaj1k2l...',
        },
        {
            id: 5,
            type: 'refinement',
            from: 'Strategy V2.1',
            to: 'Strategy V2.2',
            fromAmount: 0,
            toAmount: 0,
            timestamp: '1 day ago',
            status: 'completed',
            hash: '0xm3n4o5...',
        },
    ];

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'swap': return '🔄';
            case 'deposit': return '📥';
            case 'refinement': return '🧠';
            default: return '•';
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'swap': return 'text-cyber-blue';
            case 'deposit': return 'text-cyber-green';
            case 'refinement': return 'text-cyber-purple';
            default: return 'text-gray-400';
        }
    };

    return (
        <div className="border-glow bg-cyber-dark/50 backdrop-blur-lg rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-cyber-blue">Transaction History</h3>
                <button className="text-sm text-cyber-blue hover:text-cyber-purple transition-colors">
                    View All →
                </button>
            </div>

            <div className="space-y-3">
                {transactions.map((tx) => (
                    <div
                        key={tx.id}
                        className="bg-cyber-darker/50 rounded-lg p-4 border border-cyber-blue/10 hover:border-cyber-blue/30 transition-all group"
                    >
                        <div className="flex items-center justify-between">
                            {/* Left: Type & Details */}
                            <div className="flex items-center space-x-4 flex-1">
                                <div className={`text-2xl ${getTypeColor(tx.type)}`}>
                                    {getTypeIcon(tx.type)}
                                </div>

                                <div className="flex-1">
                                    <div className="flex items-center space-x-2 mb-1">
                                        <span className="font-bold text-white capitalize">{tx.type}</span>
                                        {tx.type !== 'refinement' && (
                                            <>
                                                <span className="text-gray-500">•</span>
                                                <span className="text-gray-300">{tx.fromAmount > 0 && `${tx.fromAmount} ${tx.from} →`} {tx.toAmount} {tx.to}</span>
                                            </>
                                        )}
                                        {tx.type === 'refinement' && (
                                            <>
                                                <span className="text-gray-500">•</span>
                                                <span className="text-gray-300">{tx.from} → {tx.to}</span>
                                            </>
                                        )}
                                    </div>

                                    <div className="flex items-center space-x-3 text-sm">
                                        <span className="text-gray-500">{tx.timestamp}</span>
                                        <span className="text-gray-600">•</span>
                                        <span className="text-gray-400 font-mono text-xs">{tx.hash}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Right: Status */}
                            <div className="flex items-center space-x-3">
                                <div className="bg-cyber-green/20 border border-cyber-green text-cyber-green px-3 py-1 rounded-full text-xs font-semibold flex items-center space-x-1">
                                    <div className="w-1.5 h-1.5 bg-cyber-green rounded-full animate-pulse"></div>
                                    <span>Completed</span>
                                </div>

                                <button className="text-gray-500 hover:text-cyber-blue transition-colors opacity-0 group-hover:opacity-100">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Load More */}
            <div className="mt-6 text-center">
                <button className="text-cyber-blue hover:text-cyber-purple transition-colors text-sm font-semibold">
                    Load More Transactions
                </button>
            </div>
        </div>
    );
}
