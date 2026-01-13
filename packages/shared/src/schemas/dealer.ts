import { z } from 'zod'

export const DealerCreateSchema = z.object({
    accountNo: z.string().min(1).max(50).regex(/^[A-Z0-9]+$/),
    companyName: z.string().min(1).max(200),
    firstName: z.string().min(1).max(100),
    lastName: z.string().min(1).max(100),
    email: z.string().email(),
    entitlement: z.enum(['GENUINE_ONLY', 'AFTERMARKET_ONLY', 'SHOW_ALL']),
    status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']),
    bands: z.object({
        genuine: z.string().regex(/^[1-4]$/).optional(),
        aftermarket: z.string().regex(/^[1-4]$/).optional(),
        branded: z.string().regex(/^[1-4]$/).optional(),
    }),
})

export const CheckoutSchema = z.object({
    dispatchMethod: z.string().max(50).optional(),
    poRef: z.string().max(100).optional(),
    notes: z.string().max(500).optional(),
})

export const CartItemSchema = z.object({
    productId: z.string().uuid(),
    qty: z.number().int().positive().max(9999),
})
