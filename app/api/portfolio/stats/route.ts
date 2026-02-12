/**
 * Portfolio Statistics API Route
 * 
 * GET /api/portfolio/stats
 * 
 * Fetches portfolio statistics from the Soroban smart contract.
 * Returns fallback data if blockchain connection fails.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getContractStats } from '@/lib/stellarService';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET handler for portfolio statistics
 */
export async function GET(request: NextRequest) {
    try {
        console.log('[API /portfolio/stats] Fetching statistics...');

        // Fetch stats from smart contract (with automatic fallback)
        const stats = await getContractStats();

        console.log('[API /portfolio/stats] Stats retrieved:', stats);

        // Return successful response
        return NextResponse.json({
            success: true,
            data: stats,
        }, {
            status: 200,
            headers: {
                'Cache-Control': 'no-store, max-age=0',
            },
        });

    } catch (error) {
        console.error('[API /portfolio/stats] Error:', error);

        // Return error response with fallback data
        return NextResponse.json({
            success: false,
            error: 'Failed to fetch portfolio statistics',
            data: {
                score: 8.7,
                transactions: 142,
                timestamp: new Date().toISOString(),
                source: 'fallback',
            },
        }, {
            status: 200, // Still return 200 to avoid breaking the UI
            headers: {
                'Cache-Control': 'no-store, max-age=0',
            },
        });
    }
}
