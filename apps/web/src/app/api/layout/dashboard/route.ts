import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    try {
        const role = req.headers.get('x-user-role') || 'DEALER';

        if (role === 'ADMIN') {
            return NextResponse.json({
                widgets: [
                    { type: 'stats', title: 'Total Dealers', value: '56', change: '+12%', trend: 'up', color: 'blue' },
                    { type: 'stats', title: 'Total Products', value: '110', change: '+5%', trend: 'up', color: 'green' },
                    { type: 'stats', title: 'Orders Today', value: '45', change: '-3%', trend: 'down', color: 'orange' },
                    { type: 'recent-orders', title: 'Recent Orders', limit: 5 }
                ]
            });
        }

        return NextResponse.json({
            widgets: [
                { type: 'stats', title: 'Your Backorders', value: '5', color: 'blue' },
                { type: 'product-search', title: 'Quick Search' }
            ]
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
