import { NextRequest, NextResponse } from 'next/server';
import { submitSignedTransaction } from '@/lib/stellarService';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        // Allow both camelCase and pascalCase to be robust
        const signedXDR = body.signedXDR || body.signedXdr;

        if (!signedXDR || typeof signedXDR !== 'string') {
            return NextResponse.json(
                { success: false, message: 'Missing or invalid signedXdr (must be a string)' },
                { status: 400 }
            );
        }

        console.log('[API] Submitting signed transaction...');
        const result = await submitSignedTransaction(signedXDR);

        // Check if submission was successful
        // Soroban sendTransaction returns { status, ... }
        // status can be "PENDING", "SUCCESS", "ERROR"

        if (result.status === 'ERROR') {
            return NextResponse.json({
                success: false,
                message: 'Transaction submission failed',
                error: result.errorResultXdr || 'Unknown error',
                details: result
            }, { status: 400 });
        }

        return NextResponse.json({
            success: true,
            message: 'Transaction submitted successfully',
            result
        });

    } catch (error) {
        console.error('[API] Error submitting transaction:', error);
        return NextResponse.json(
            {
                success: false,
                message: error instanceof Error ? error.message : 'Internal Server Error'
            },
            { status: 500 }
        );
    }
}
