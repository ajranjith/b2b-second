'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import api from '@/lib/api';

const dealerSchema = z.object({
    companyName: z.string().min(1, 'Company name is required'),
    erpAccountNo: z.string().optional(),
    accountNo: z.string().min(1, 'Account number is required'),
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    email: z.string().email('Invalid email address'),
    phone: z.string().optional(),
    entitlement: z.enum(['GENUINE_ONLY', 'AFTERMARKET_ONLY', 'SHOW_ALL']),
    genuineBand: z.string().optional(),
    aftermarketBand: z.string().optional(),
    brandedBand: z.string().optional(),
    status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']),
    billingLine1: z.string().optional(),
    billingLine2: z.string().optional(),
    billingCity: z.string().optional(),
    billingPostcode: z.string().optional(),
    billingCountry: z.string().optional(),
});

type DealerFormData = z.infer<typeof dealerSchema>;

interface DealerDialogProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
    dealer?: any;
}

export default function DealerDialog({ open, onClose, onSuccess, dealer }: DealerDialogProps) {
    const isEdit = !!dealer;

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<DealerFormData>({
        resolver: zodResolver(dealerSchema),
        defaultValues: {
            entitlement: 'SHOW_ALL',
            status: 'ACTIVE',
            billingCountry: 'United Kingdom',
        },
    });

    const entitlement = watch('entitlement');

    useEffect(() => {
        if (dealer) {
            reset({
                companyName: dealer.companyName,
                erpAccountNo: dealer.erpAccountNo || '',
                accountNo: dealer.accountNo,
                firstName: dealer.users[0]?.firstName || '',
                lastName: dealer.users[0]?.lastName || '',
                email: dealer.users[0]?.appUser?.email || '',
                phone: dealer.phone || '',
                entitlement: dealer.entitlement,
                genuineBand: dealer.genuineBand || '',
                aftermarketBand: dealer.aftermarketBand || '',
                brandedBand: dealer.brandedBand || '',
                status: dealer.status,
                billingLine1: dealer.billingLine1 || '',
                billingLine2: dealer.billingLine2 || '',
                billingCity: dealer.billingCity || '',
                billingPostcode: dealer.billingPostcode || '',
                billingCountry: dealer.billingCountry || 'United Kingdom',
            });
        } else {
            reset({
                entitlement: 'SHOW_ALL',
                status: 'ACTIVE',
                billingCountry: 'United Kingdom',
            });
        }
    }, [dealer, reset]);

    const onSubmit = async (data: DealerFormData) => {
        try {
            const payload = {
                companyName: data.companyName,
                erpAccountNo: data.erpAccountNo,
                accountNo: data.accountNo,
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
                phone: data.phone,
                entitlement: data.entitlement,
                status: data.status,
                bands: {
                    genuine: data.genuineBand,
                    aftermarket: data.aftermarketBand,
                    branded: data.brandedBand,
                },
                billingAddress: {
                    line1: data.billingLine1,
                    line2: data.billingLine2,
                    city: data.billingCity,
                    postcode: data.billingPostcode,
                    country: data.billingCountry,
                },
            };

            if (isEdit) {
                await api.patch(`/admin/dealers/${dealer.id}`, payload);
                toast.success('Dealer updated successfully');
            } else {
                await api.post('/admin/dealers', payload);
                toast.success('Dealer created successfully. Welcome email sent to user.');
            }

            onSuccess();
            onClose();
        } catch (error: any) {
            const message = error.response?.data?.message || 'Failed to save dealer';
            toast.error(message);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{isEdit ? 'Edit Dealer' : 'Create New Dealer'}</DialogTitle>
                    <DialogDescription>
                        {isEdit
                            ? 'Update dealer information and settings'
                            : 'Add a new dealer to the system. A welcome email will be sent automatically.'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                    {/* Section 1: Company Details */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold border-b pb-2">Company Details</h3>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="companyName">
                                    Company Name <span className="text-red-500">*</span>
                                </Label>
                                <Input id="companyName" {...register('companyName')} />
                                {errors.companyName && (
                                    <p className="text-sm text-red-500">{errors.companyName.message}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="erpAccountNo">ERP Account Number</Label>
                                <Input id="erpAccountNo" {...register('erpAccountNo')} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="accountNo">
                                    Account Number <span className="text-red-500">*</span>
                                </Label>
                                <Input id="accountNo" {...register('accountNo')} />
                                {errors.accountNo && (
                                    <p className="text-sm text-red-500">{errors.accountNo.message}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Contact Information */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold border-b pb-2">Contact Information</h3>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="firstName">
                                    First Name <span className="text-red-500">*</span>
                                </Label>
                                <Input id="firstName" {...register('firstName')} />
                                {errors.firstName && (
                                    <p className="text-sm text-red-500">{errors.firstName.message}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="lastName">
                                    Last Name <span className="text-red-500">*</span>
                                </Label>
                                <Input id="lastName" {...register('lastName')} />
                                {errors.lastName && (
                                    <p className="text-sm text-red-500">{errors.lastName.message}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">
                                    Email <span className="text-red-500">*</span>
                                </Label>
                                <Input id="email" type="email" {...register('email')} />
                                {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone</Label>
                                <Input id="phone" {...register('phone')} />
                            </div>
                        </div>
                    </div>

                    {/* Section 3: Entitlement */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold border-b pb-2">Entitlement</h3>
                        <div className="space-y-3">
                            <label className="flex items-center space-x-3 cursor-pointer">
                                <input
                                    type="radio"
                                    value="GENUINE_ONLY"
                                    {...register('entitlement')}
                                    className="h-4 w-4 text-blue-600"
                                />
                                <span>Genuine Parts Only</span>
                            </label>
                            <label className="flex items-center space-x-3 cursor-pointer">
                                <input
                                    type="radio"
                                    value="AFTERMARKET_ONLY"
                                    {...register('entitlement')}
                                    className="h-4 w-4 text-blue-600"
                                />
                                <span>Aftermarket Parts Only</span>
                            </label>
                            <label className="flex items-center space-x-3 cursor-pointer">
                                <input
                                    type="radio"
                                    value="SHOW_ALL"
                                    {...register('entitlement')}
                                    className="h-4 w-4 text-blue-600"
                                />
                                <span>Show All</span>
                            </label>
                        </div>
                    </div>

                    {/* Section 4: Pricing Bands (Conditional) */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold border-b pb-2">Pricing Bands</h3>
                        <div className="grid gap-4 md:grid-cols-3">
                            {(entitlement === 'GENUINE_ONLY' || entitlement === 'SHOW_ALL') && (
                                <div className="space-y-2">
                                    <Label htmlFor="genuineBand">Genuine Band</Label>
                                    <select
                                        id="genuineBand"
                                        {...register('genuineBand')}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-md"
                                    >
                                        <option value="">Select band</option>
                                        <option value="1">Band 1</option>
                                        <option value="2">Band 2</option>
                                        <option value="3">Band 3</option>
                                        <option value="4">Band 4</option>
                                    </select>
                                </div>
                            )}
                            {(entitlement === 'AFTERMARKET_ONLY' || entitlement === 'SHOW_ALL') && (
                                <>
                                    <div className="space-y-2">
                                        <Label htmlFor="aftermarketBand">Aftermarket Band</Label>
                                        <select
                                            id="aftermarketBand"
                                            {...register('aftermarketBand')}
                                            className="w-full px-3 py-2 border border-slate-200 rounded-md"
                                        >
                                            <option value="">Select band</option>
                                            <option value="1">Band 1</option>
                                            <option value="2">Band 2</option>
                                            <option value="3">Band 3</option>
                                            <option value="4">Band 4</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="brandedBand">Branded Band</Label>
                                        <select
                                            id="brandedBand"
                                            {...register('brandedBand')}
                                            className="w-full px-3 py-2 border border-slate-200 rounded-md"
                                        >
                                            <option value="">Select band</option>
                                            <option value="1">Band 1</option>
                                            <option value="2">Band 2</option>
                                            <option value="3">Band 3</option>
                                            <option value="4">Band 4</option>
                                        </select>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Section 5: Status */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold border-b pb-2">Status</h3>
                        <div className="space-y-3">
                            <label className="flex items-center space-x-3 cursor-pointer">
                                <input
                                    type="radio"
                                    value="ACTIVE"
                                    {...register('status')}
                                    className="h-4 w-4 text-green-600"
                                />
                                <span className="text-green-700 font-medium">Active</span>
                            </label>
                            <label className="flex items-center space-x-3 cursor-pointer">
                                <input
                                    type="radio"
                                    value="INACTIVE"
                                    {...register('status')}
                                    className="h-4 w-4 text-slate-600"
                                />
                                <span className="text-slate-600">Inactive</span>
                            </label>
                            <label className="flex items-center space-x-3 cursor-pointer">
                                <input
                                    type="radio"
                                    value="SUSPENDED"
                                    {...register('status')}
                                    className="h-4 w-4 text-amber-600"
                                />
                                <span className="text-amber-700 font-medium">Suspended</span>
                            </label>
                        </div>
                    </div>

                    {/* Section 6: Billing Address */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold border-b pb-2">Billing Address (Optional)</h3>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="billingLine1">Address Line 1</Label>
                                <Input id="billingLine1" {...register('billingLine1')} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="billingLine2">Address Line 2</Label>
                                <Input id="billingLine2" {...register('billingLine2')} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="billingCity">City</Label>
                                <Input id="billingCity" {...register('billingCity')} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="billingPostcode">Postcode</Label>
                                <Input id="billingPostcode" {...register('billingPostcode')} />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="billingCountry">Country</Label>
                                <select
                                    id="billingCountry"
                                    {...register('billingCountry')}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-md"
                                >
                                    <option value="United Kingdom">United Kingdom</option>
                                    <option value="Ireland">Ireland</option>
                                    <option value="France">France</option>
                                    <option value="Germany">Germany</option>
                                    <option value="Spain">Spain</option>
                                    <option value="Italy">Italy</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                            Cancel
                        </Button>
                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={isSubmitting}>
                            {isSubmitting ? 'Saving...' : isEdit ? 'Update Dealer' : 'Create Dealer'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
