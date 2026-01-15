import { Suspense } from 'react';
import db from 'db';
import { Card, CardContent, Badge, Button } from '@/ui';
import { Loader2, Package, FileText, Calendar, ChevronRight, ChevronLeft } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';

/**
 * SERVER-SIDE RENDERING: Direct database access, no API routes
 * 
 * This page queries the database directly from the server component.
 * Benefits:
 * - No client-side data fetching
 * - Faster initial page load
 * - SEO-friendly
 * - Reduced JavaScript bundle size
 */

interface SearchParams {
    page?: string;
}

const statusColors: Record<string, string> = {
    SUSPENDED: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    PROCESSING: 'bg-blue-100 text-blue-700 border-blue-200',
    SHIPPED: 'bg-green-100 text-green-700 border-green-200',
    CANCELLED: 'bg-red-100 text-red-700 border-red-200',
};

// Loading skeleton component
function OrderListSkeleton() {
    return (
        <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
                <Card key={i} className="overflow-hidden animate-pulse">
                    <div className="border-b bg-slate-50/50 p-4 flex gap-4 items-center justify-between">
                        <div className="h-6 bg-slate-200 rounded w-1/3" />
                        <div className="h-6 bg-slate-200 rounded w-1/4" />
                    </div>
                    <CardContent className="p-4">
                        <div className="space-y-3">
                            <div className="h-4 bg-slate-100 rounded w-full" />
                            <div className="h-4 bg-slate-100 rounded w-3/4" />
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

// Server component that fetches orders from database
async function OrderList({ page, dealerUserId }: { page: number; dealerUserId: string }) {
    const pageSize = 20;
    const skip = (page - 1) * pageSize;

    // Get dealer account from user
    const dealerUser = await db.dealerUser.findUnique({
        where: { userId: dealerUserId },
        select: { dealerAccountId: true },
    });

    if (!dealerUser) {
        return (
            <Card className="border-dashed">
                <CardContent className="py-16 text-center">
                    <p className="text-red-500">Unable to load dealer account information.</p>
                </CardContent>
            </Card>
        );
    }

    // Query orders directly from database
    const [orders, totalCount] = await Promise.all([
        db.orderHeader.findMany({
            where: { dealerAccountId: dealerUser.dealerAccountId },
            include: { lines: true },
            orderBy: { createdAt: 'desc' },
            skip,
            take: pageSize,
        }),
        db.orderHeader.count({ where: { dealerAccountId: dealerUser.dealerAccountId } }),
    ]);

    const totalPages = Math.ceil(totalCount / pageSize);

    if (orders.length === 0) {
        return (
            <Card className="border-dashed">
                <CardContent className="py-16 text-center">
                    <Package className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900">No orders yet</h3>
                    <p className="text-slate-500 mt-2">
                        You haven&apos;t placed any orders yet. Start searching for parts!
                    </p>
                    <Link href="/dealer/search" className="inline-block mt-6">
                        <Button>Browse Parts</Button>
                    </Link>
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            <div className="space-y-4">
                {orders.map((order: any) => (
                    <Card key={order.id} className="overflow-hidden hover:shadow-md transition-shadow">
                        <div className="border-b bg-slate-50/50 p-4 flex flex-wrap gap-4 items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-slate-400" />
                                    <span className="font-semibold text-slate-900">{order.orderNo}</span>
                                </div>
                                <Badge variant="outline" className={statusColors[order.status] || 'bg-slate-100'}>
                                    {order.status}
                                </Badge>
                            </div>
                            <div className="flex items-center gap-6 text-sm text-slate-600">
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-slate-400" />
                                    <span>{format(new Date(order.createdAt), 'MMM d, yyyy')}</span>
                                </div>
                                <div>
                                    <span className="text-slate-400 mr-2">PO Ref:</span>
                                    <span className="font-medium text-slate-900">{order.poRef || '-'}</span>
                                </div>
                                <div>
                                    <span className="text-slate-400 mr-2">Total:</span>
                                    <span className="font-bold text-slate-900">£{Number(order.total).toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                        <CardContent className="p-4">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-slate-500 uppercase bg-slate-50/50 border-b">
                                        <tr>
                                            <th className="px-4 py-2">Product Info</th>
                                            <th className="px-4 py-2 text-right">Qty</th>
                                            <th className="px-4 py-2 text-right">Unit Price</th>
                                            <th className="px-4 py-2 text-right">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {order.lines.map((line: any) => (
                                            <tr key={line.id} className="hover:bg-slate-50/50">
                                                <td className="px-4 py-3">
                                                    <div className="font-medium text-slate-900">
                                                        {line.productCodeSnapshot}
                                                    </div>
                                                    <div className="text-slate-500 text-xs truncate max-w-md">
                                                        {line.descriptionSnapshot}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-right font-medium">{line.qty}</td>
                                                <td className="px-4 py-3 text-right text-slate-600">
                                                    £{Number(line.unitPriceSnapshot).toFixed(2)}
                                                </td>
                                                <td className="px-4 py-3 text-right font-medium text-slate-900">
                                                    £{(Number(line.unitPriceSnapshot) * line.qty).toFixed(2)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="mt-4 flex justify-end">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                >
                                    View Details <ChevronRight className="h-4 w-4 ml-1" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between py-4">
                    <div className="text-sm text-slate-500">
                        Showing <span className="font-semibold text-slate-900">{skip + 1}</span> to{' '}
                        <span className="font-semibold text-slate-900">
                            {Math.min(skip + pageSize, totalCount)}
                        </span>{' '}
                        of <span className="font-semibold text-slate-900">{totalCount}</span> orders
                    </div>
                    <div className="flex gap-2">
                        <Link
                            href={`/dealer/orders?page=${page - 1}`}
                            className={`inline-flex items-center px-3 py-2 border border-slate-300 rounded-lg text-sm font-medium bg-white text-slate-700 hover:bg-slate-50 transition-all shadow-sm ${page <= 1 ? 'opacity-50 pointer-events-none' : ''
                                }`}
                        >
                            <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                        </Link>
                        <Link
                            href={`/dealer/orders?page=${page + 1}`}
                            className={`inline-flex items-center px-3 py-2 border border-slate-300 rounded-lg text-sm font-medium bg-white text-slate-700 hover:bg-slate-50 transition-all shadow-sm ${page >= totalPages ? 'opacity-50 pointer-events-none' : ''
                                }`}
                        >
                            Next <ChevronRight className="w-4 h-4 ml-1" />
                        </Link>
                    </div>
                </div>
            )}
        </>
    );
}

// Main page component (Server Component)
export default async function DealerOrdersPage({
    searchParams,
}: {
    searchParams: Promise<SearchParams>;
}) {
    const params = await searchParams;
    const page = Number(params?.page) || 1;

    // TODO: Get actual user ID from session/auth
    // For now, using a placeholder - you'll need to integrate with your auth system
    const dealerUserId = 'placeholder-user-id';

    return (
        <div className="min-h-screen bg-slate-50 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">My Orders</h1>
                        <p className="text-slate-500 mt-1">View and track your recent orders</p>
                    </div>
                </div>

                <Suspense key={page} fallback={<OrderListSkeleton />}>
                    <OrderList page={page} dealerUserId={dealerUserId} />
                </Suspense>
            </div>
        </div>
    );
}
