'use client';

import { useState, useEffect } from 'react';

export default function AgentStatus() {
    const [status, setStatus] = useState<'active' | 'idle' | 'learning'>('active');

    useEffect(() => {
        // Simulate status changes
        const interval = setInterval(() => {
            const statuses: ('active' | 'idle' | 'learning')[] = ['active', 'idle', 'learning'];
            setStatus(statuses[Math.floor(Math.random() * statuses.length)]);
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    const statusConfig: Record<'active' | 'idle' | 'learning', {
        color: string;
        bgColor: string;
        borderColor: string;
        dotColor: string;
        label: string;
        icon: string;
    }> = {
        active: {
            color: 'text-cyber-green',
            bgColor: 'bg-cyber-green/20',
            borderColor: 'border-cyber-green',
            dotColor: 'bg-cyber-green',
            label: 'Active Trading',
            icon: '⚡'
        },
        idle: {
            color: 'text-cyber-yellow',
            bgColor: 'bg-cyber-yellow/20',
            borderColor: 'border-cyber-yellow',
            dotColor: 'bg-cyber-yellow',
            label: 'Monitoring',
            icon: '👁️'
        },
        learning: {
            color: 'text-cyber-purple',
            bgColor: 'bg-cyber-purple/20',
            borderColor: 'border-cyber-purple',
            dotColor: 'bg-cyber-purple',
            label: 'Self-Refining',
            icon: '🧠'
        }
    };

    const currentStatus = statusConfig[status];

    return (
        <div className="border-glow bg-cyber-dark/50 backdrop-blur-lg rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-cyber-blue">Agent Status</h3>
                <div className={`flex items-center space-x-2 ${currentStatus.bgColor} ${currentStatus.borderColor} border px-4 py-2 rounded-full`}>
                    <span className="text-xl">{currentStatus.icon}</span>
                    <span className={`font-semibold ${currentStatus.color}`}>{currentStatus.label}</span>
                    <div className={`w-2 h-2 ${currentStatus.dotColor} rounded-full animate-pulse`}></div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Performance Metrics */}
                <div className="bg-cyber-darker/50 rounded-lg p-4 border border-cyber-blue/20">
                    <p className="text-gray-400 text-sm mb-1">Success Rate</p>
                    <p className="text-3xl font-bold text-cyber-green">94.2%</p>
                    <p className="text-xs text-gray-500 mt-1">↑ 2.3% this week</p>
                </div>

                <div className="bg-cyber-darker/50 rounded-lg p-4 border border-cyber-purple/20">
                    <p className="text-gray-400 text-sm mb-1">Total Trades</p>
                    <p className="text-3xl font-bold text-cyber-purple">1,247</p>
                    <p className="text-xs text-gray-500 mt-1">Last 30 days</p>
                </div>

                <div className="bg-cyber-darker/50 rounded-lg p-4 border border-cyber-pink/20">
                    <p className="text-gray-400 text-sm mb-1">Avg. ROI</p>
                    <p className="text-3xl font-bold text-cyber-pink">+12.4%</p>
                    <p className="text-xs text-gray-500 mt-1">Per trade</p>
                </div>

                <div className="bg-cyber-darker/50 rounded-lg p-4 border border-cyber-green/20">
                    <p className="text-gray-400 text-sm mb-1">Learning Score</p>
                    <p className="text-3xl font-bold text-cyber-green">8.7/10</p>
                    <p className="text-xs text-gray-500 mt-1">Continuously improving</p>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="mt-6 bg-cyber-darker/30 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-400 mb-3">Recent Activity</h4>
                <div className="space-y-2 text-sm">
                    <div className="flex items-center space-x-2 text-gray-300">
                        <span className="text-cyber-green">✓</span>
                        <span>Executed swap: 100 USDC → XLM at optimal rate</span>
                        <span className="text-gray-500 ml-auto">2m ago</span>
                    </div>
                    <div className="flex items-center space-x-2 text-gray-300">
                        <span className="text-cyber-purple">⟳</span>
                        <span>Strategy refinement completed - 3.2% efficiency gain</span>
                        <span className="text-gray-500 ml-auto">15m ago</span>
                    </div>
                    <div className="flex items-center space-x-2 text-gray-300">
                        <span className="text-cyber-blue">◉</span>
                        <span>Market analysis: Detected arbitrage opportunity</span>
                        <span className="text-gray-500 ml-auto">28m ago</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
