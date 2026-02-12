/**
 * Refine Strategy API Route
 * 
 * POST /api/portfolio/refine
 * 
 * Refines the portfolio strategy by submitting a transaction to the Soroban smart contract.
 * Requires user's wallet address and uses Freighter for signing.
 */

import { NextRequest, NextResponse } from 'next/server';
import { refineStrategy, getCooldownRemaining } from '@/lib/stellarService';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * POST handler for refining strategy
 * 
 * Body:
 * - walletAddress: string - User's Stellar wallet address
 * - performanceMetric: number (optional) - Performance indicator (default: 10)
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { walletAddress, performanceMetric = 10 } = body;

        console.log('[API /portfolio/refine] Refining strategy for wallet:', walletAddress);

        // Validate wallet address
        if (!walletAddress || typeof walletAddress !== 'string') {
            return NextResponse.json({
                success: false,
                error: 'Wallet address is required',
            }, { status: 400 });
        }

        // Call the refine strategy function
        const result = await refineStrategy(walletAddress, performanceMetric);

        console.log('[API /portfolio/refine] Result:', result);

        // Check if the error is COOLDOWN_ACTIVE from the service
        if (!result.success && result.error === 'COOLDOWN_ACTIVE') {
            // Already handled by stellarService, just return it
            return NextResponse.json(result, {
                status: 400,
                headers: {
                    'Cache-Control': 'no-store, max-age=0',
                },
            });
        }

        // Check if simulation failed - might be a cooldown panic
        if (!result.success && result.error === 'SIMULATION_FAILED') {
            const errorMessage = result.message.toLowerCase();

            // Check for UnreachableCodeReached or VM trap (cooldown panic)
            if (errorMessage.includes('unreachablecodereached') ||
                errorMessage.includes('vm call trapped') ||
                errorMessage.includes('unreachable')) {

                console.log('[API /portfolio/refine] Detected cooldown panic, fetching remaining time...');

                // Fetch the actual cooldown remaining time
                const cooldownSeconds = await getCooldownRemaining();

                console.log('[API /portfolio/refine] Cooldown remaining:', cooldownSeconds, 'seconds');

                return NextResponse.json({
                    success: false,
                    error: 'COOLDOWN_ACTIVE',
                    cooldownRemaining: cooldownSeconds,
                    message: 'Strategy optimization is recharging'
                }, {
                    status: 400,
                    headers: {
                        'Cache-Control': 'no-store, max-age=0',
                    },
                });
            }
        }

        // Return the result as-is for other cases
        return NextResponse.json(result, {
            status: result.success ? 200 : 400,
            headers: {
                'Cache-Control': 'no-store, max-age=0',
            },
        });

    } catch (error) {
        console.error('[API /portfolio/refine] Error:', error);

        return NextResponse.json({
            success: false,
            message: 'Failed to process refinement request',
            error: error instanceof Error ? error.message : 'UNKNOWN_ERROR',
        }, {
            status: 500,
            headers: {
                'Cache-Control': 'no-store, max-age=0',
            },
        });
    }
}
