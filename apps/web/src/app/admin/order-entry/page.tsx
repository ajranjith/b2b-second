'use client';

import { useState } from 'react';
import { Button, Input, Label, Card, CardHeader, CardTitle, CardContent } from '@/ui';
import { submitOrderAction } from './actions';
import { toast } from 'sonner';

export default function AdminOrderEntry() {
    const [dealerId, setDealerId] = useState('');
    const [sku, setSku] = useState('');
    const [qty, setQty] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleManualEntry = async () => {
        setIsSubmitting(true);
        const result = await submitOrderAction({
            dealerAccountId: dealerId,
            dealerUserId: 'ADMIN-PORTAL', // Simulated admin user
            source: 'ADMIN',
            items: [{ productCode: sku, qty }]
        });

        if (result.success) {
            toast.success(`Order created: ${result.data?.orderNo}. ERP Ref: ${result.data?.erpReference}`);
            setSku('');
            setQty(1);
        } else {
            toast.error(`Failed: ${result.error}`);
        }
        setIsSubmitting(false);
    };

    return (
        <div className="p-8 max-w-2xl mx-auto">
            <Card>
                <CardHeader>
                    <CardTitle>Manual Order Entry (Hotbray Hub)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Dealer Account ID</Label>
                        <Input
                            placeholder="e.g. DEAL001"
                            value={dealerId}
                            onChange={e => setDealerId(e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>SKU</Label>
                            <Input
                                placeholder="LR071485-0"
                                value={sku}
                                onChange={e => setSku(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Quantity</Label>
                            <Input
                                type="number"
                                value={qty}
                                onChange={e => setQty(parseInt(e.target.value))}
                            />
                        </div>
                    </div>

                    <Button
                        className="w-full"
                        onClick={handleManualEntry}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Syncing with ERP...' : 'Create Order and Push to ERP'}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
