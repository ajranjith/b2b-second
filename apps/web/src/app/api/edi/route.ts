import { NextRequest, NextResponse } from 'next/server';
import { orderEngine } from '@/services/OrderEngine';

/**
 * EDI Endpoint: POST /api/edi
 * 
 * Secure REST interface for bulk order ingestion from EDI providers.
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // In real EDI, you'd map from their format (X12/EDIFACT) to our OrderInput
        // Here we assume a normalized JSON for simulation
        const { dealerAccountId, dealerUserId, items } = body;

        if (!dealerAccountId || !items || !Array.isArray(items)) {
            return NextResponse.json(
                { error: 'Invalid EDI payload structural check failed' },
                { status: 400 }
            );
        }

        const result = await orderEngine.createOrder({
            dealerAccountId,
            dealerUserId,
            source: 'EDI',
            items
        });

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('💥 [EDI API] Ingestion failed:', error.message);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
