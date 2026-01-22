import { z } from 'zod'

const TierCodeSchema = z.enum(['NET1', 'NET2', 'NET3', 'NET4', 'NET5', 'NET6', 'NET7']);

export const DealerCreateSchema = z.object({
    accountNo: z.string().min(1).max(50).regex(/^[A-Za-z0-9]+$/),
    companyName: z.string().max(200).optional(),
    firstName: z.string().min(1).max(100),
    lastName: z.string().min(1).max(100),
    email: z.string().email(),
    tempPassword: z.string().min(8),
    status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']),
    defaultShippingMethod: z.enum(['Air', 'Sea', 'FedEx', 'DHL', 'Others']).optional(),
    shippingNotes: z.string().max(500).optional(),
    entitlement: z.enum(['GENUINE_ONLY', 'AFTERMARKET_ONLY', 'SHOW_ALL']).optional(),
    tiers: z.object({
        genuine: TierCodeSchema,
        aftermarketEs: TierCodeSchema,
        aftermarketBr: TierCodeSchema,
    })
}).refine((data) => {
    if (data.defaultShippingMethod === 'Others') {
        return !!data.shippingNotes && data.shippingNotes.trim().length > 0;
    }
    return true;
}, {
    message: 'Notes are required when shipping method is Others',
    path: ['shippingNotes']
});

export const CheckoutSchema = z.object({
    dispatchMethod: z.string().max(50).optional(),
    poRef: z.string().max(100).optional(),
    notes: z.string().max(500).optional(),
})

export const CartItemSchema = z.object({
    productId: z.string().uuid(),
    qty: z.number().int().positive().max(9999),
})
