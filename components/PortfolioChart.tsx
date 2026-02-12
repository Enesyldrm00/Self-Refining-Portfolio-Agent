'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

// Generate mock portfolio history data based on 143 transactions
const generateMockData = () => {
    const data = [];
    const baseScore = 7.5;
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;

    // Generate 30 days of history
    for (let i = 30; i >= 0; i--) {
        const date = new Date(now - (i * dayMs));
        const variance = Math.sin(i / 3) * 1.2 + Math.random() * 0.5;
        const score = Math.max(6, Math.min(10, baseScore + variance));

        data.push({
            date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            score: Number(score.toFixed(2)),
            transactions: Math.floor(143 * (1 - i / 30)) + Math.floor(Math.random() * 5)
        });
    }

    return data;
};

const mockData = generateMockData();

export default function PortfolioChart() {
    return (
        <div className="border-glow bg-cyber-dark/50 backdrop-blur-lg rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-cyber-blue">Portfolio Performance</h3>
                <span className="text-sm text-gray-400 italic">
                    Based on {mockData[mockData.length - 1].transactions} transactions
                </span>
            </div>

            <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={mockData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#00D9FF" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#00D9FF" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1a1a2e" />
                    <XAxis
                        dataKey="date"
                        stroke="#6b7280"
                        tick={{ fill: '#9ca3af' }}
                        tickLine={{ stroke: '#4b5563' }}
                    />
                    <YAxis
                        domain={[6, 10]}
                        stroke="#6b7280"
                        tick={{ fill: '#9ca3af' }}
                        tickLine={{ stroke: '#4b5563' }}
                        label={{ value: 'Strategy Score', angle: -90, position: 'insideLeft', fill: '#9ca3af' }}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#0a0a0f',
                            border: '1px solid #00D9FF',
                            borderRadius: '8px',
                            color: '#fff'
                        }}
                        formatter={(value: number, name: string) => {
                            if (name === 'score') return [value.toFixed(2), 'Score'];
                            return [value, 'Transactions'];
                        }}
                    />
                    <Area
                        type="monotone"
                        dataKey="score"
                        stroke="#00D9FF"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorScore)"
                    />
                </AreaChart>
            </ResponsiveContainer>

            <div className="mt-4 grid grid-cols-3 gap-4">
                <div className="text-center">
                    <div className="text-2xl font-bold text-cyber-green">
                        {mockData[mockData.length - 1].score}
                    </div>
                    <div className="text-xs text-gray-400">Current Score</div>
                </div>
                <div className="text-center">
                    <div className="text-2xl font-bold text-cyber-purple">
                        {((mockData[mockData.length - 1].score - mockData[0].score) * 100 / mockData[0].score).toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-400">30-Day Growth</div>
                </div>
                <div className="text-center">
                    <div className="text-2xl font-bold text-cyber-blue">
                        {mockData[mockData.length - 1].transactions}
                    </div>
                    <div className="text-xs text-gray-400">Total Trades</div>
                </div>
            </div>
        </div>
    );
}
