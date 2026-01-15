import { Suspense } from 'react';
import db from 'db';
import { Card, CardContent, Badge, Button } from '@/ui';
import { Loader2, Package, AlertCircle, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import { RefreshButton } from '@/components/dealer/RefreshButton';

/**
 * SERVER-SIDE RENDERING: Direct database access for backorders
 * 
 * Queries the active backorder dataset directly from the database.
 * No API routes, no client-side fetching.
 */

interface BackorderLine {
    id: string;
    accountNo: string;
    customerName: string | null;
    yourOrderNo: string | null;
    ourNo: string;
    itemNo: string;
    part: string;
    description: string | null;
    qtyOrdered: number;
    qtyOutstanding: number;
    inWh: number;
}

// Loading skeleton
function BackorderSkeleton() {
    return (
        <Card className="shadow-sm border-slate-200 overflow-hidden animate-pulse">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
                        <tr>
                            <th className="px-6 py-3">Part Details</th>
                            <th className="px-6 py-3">Reference</th>
                            <th className="px-6 py-3">Order Info</th>
                            <th className="px-6 py-3 text-center">Qty Ordered</th>
                            <th className="px-6 py-3 text-center">Outstanding</th>
                            <th className="px-6 py-3 text-center">In Warehouse</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {[...Array(5)].map((_, i) => (
                            <tr key={i}>
                                <td className="px-6 py-4">
                                    <div className="h-4 bg-slate-200 rounded w-32 mb-2" />
                                    <div className="h-3 bg-slate-100 rounded w-48" />
                                </td>
                                <td className="px-6 py-4">
                                    <div className="h-4 bg-slate-200 rounded w-24" />
                                </td>
                                <td className="px-6 py-4">
                                    <div className="h-3 bg-slate-100 rounded w-16" />
                                </td>
                                <td className="px-6 py-4">
                                    <div className="h-4 bg-slate-100 rounded w-12 mx-auto" />
                                </td>
                                <td className="px-6 py-4">
                                    <div className="h-4 bg-slate-100 rounded w-12 mx-auto" />
                                </td>
                                <td className="px-6 py-4">
                                    <div className="h-4 bg-slate-100 rounded w-16 mx-auto" />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
    );
}

// Server component that fetches backorders
async function BackorderList({ dealerAccountNo }: { dealerAccountNo: string }) {
    // Query the active backorder dataset
    const activeDataset = await db.backorderDataset.findFirst({
        where: { isActive: true },
        include: {
            lines: {
                where: { accountNo: dealerAccountNo },
                orderBy: { part: 'asc' },
            },
            batch: {
                select: {
                    completedAt: true,
                },
            },
        },
    });

    const backorders = activeDataset?.lines || [];
    const lastUpdated = activeDataset?.batch?.completedAt
        ? format(new Date(activeDataset.batch.completedAt), 'PPP p')
        : 'Unknown';

    if (backorders.length === 0) {
        return (
            <Card className="border-dashed">
                <CardContent className="py-16 text-center">
                    <Package className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900">No active backorders</h3>
                    <p className="text-slate-500 mt-2">You have no items on backorder at this time.</p>
                    <Link href="/dealer/search" className="inline-block mt-6">
                        <Button>Browse Parts</Button>
                    </Link>
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            {activeDataset?.batch?.completedAt && (
                <div className="flex items-center gap-2 text-sm text-slate-600 bg-blue-50 px-4 py-2 rounded-md border border-blue-100">
                    <AlertCircle className="h-4 w-4 text-blue-500" />
                    <span>
                        Data last updated: <span className="font-medium text-slate-900">{lastUpdated}</span>
                    </span>
                </div>
            )}

            <Card className="shadow-sm border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
                            <tr>
                                <th className="px-6 py-3">Part Details</th>
                                <th className="px-6 py-3">Reference</th>
                                <th className="px-6 py-3">Order Info</th>
                                <th className="px-6 py-3 text-center">Qty Ordered</th>
                                <th className="px-6 py-3 text-center">Outstanding</th>
                                <th className="px-6 py-3 text-center">In Warehouse</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {backorders.map((item: BackorderLine) => (
                                <tr key={item.id} className="hover:bg-slate-50/50">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-slate-900">{item.part}</div>
                                        <div
                                            className="text-slate-500 text-xs truncate max-w-xs"
                                            title={item.description || ''}
                                        >
                                            {item.description}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-slate-600">
                                            Your Ref: <span className="font-medium text-slate-900">{item.yourOrderNo || '-'}</span>
                                        </div>
                                        <div className="text-slate-500 text-xs">Our Ref: {item.ourNo}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-slate-500 text-xs">Line: {item.itemNo}</div>
                                    </td>
                                    <td className="px-6 py-4 text-center text-slate-600">{item.qtyOrdered}</td>
                                    <td className="px-6 py-4 text-center font-medium text-amber-600">
                                        {item.qtyOutstanding}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {item.inWh > 0 ? (
                                            <Badge
                                                variant="outline"
                                                className="bg-green-100 text-green-700 border-green-200"
                                            >
                                                {item.inWh} Available
                                            </Badge>
                                        ) : (
                                            <span className="text-slate-400">-</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </>
    );
}

// Main page component (Server Component)
export default async function DealerBackordersPage() {
    // TODO: Get actual dealer account number from session/auth
    // For now, using a placeholder - you'll need to integrate with your auth system
    const dealerAccountNo = 'placeholder-account-no';

    return (
        <div className="min-h-screen bg-slate-50 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Backorders</h1>
                        <p className="text-slate-500 mt-1">Track pending items and warehouse availability</p>
                    </div>
                    <RefreshButton />
                </div>

                <Suspense fallback={<BackorderSkeleton />}>
                    <BackorderList dealerAccountNo={dealerAccountNo} />
                </Suspense>
            </div>
        </div>
    );
}
