import prisma from '@/lib/prisma';
import { Card, CardHeader, CardTitle, CardContent, Badge } from '@/ui';
import { format } from 'date-fns';

export default async function CustomerOrdersPage() {
    // Direct DB fetch - zero network hops as this runs on the server
    const orders = await prisma.orderHeader.findMany({
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: {
            dealerAccount: true,
            lines: true
        }
    });

    return (
        <div className="p-8 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Order History</h1>
                <Badge variant="outline">{orders.length} Recent Orders</Badge>
            </div>

            <div className="grid gap-4">
                {orders.map((order) => (
                    <Card key={order.id} className="hover:border-blue-500 transition-colors">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-xl">{order.orderNo}</CardTitle>
                                <p className="text-sm text-gray-500">
                                    {format(new Date(order.createdAt), 'PPpp')}
                                </p>
                            </div>
                            <Badge variant={order.status === 'COMPLETED' ? 'default' : 'secondary'}>
                                {order.status}
                            </Badge>
                        </CardHeader>
                        <CardContent>
                            <div className="flex justify-between items-center">
                                <div className="text-sm">
                                    <span className="font-semibold">{order.lines.length} items</span>
                                    <span className="mx-2">for</span>
                                    <span className="font-semibold">{order.dealerAccount.companyName}</span>
                                </div>
                                <div className="text-lg font-bold">
                                    £{order.total.toFixed(2)}
                                </div>
                            </div>
                            {order.comments && (
                                <div className="mt-2 p-2 bg-slate-50 rounded text-xs text-slate-600 font-mono">
                                    {order.comments}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
