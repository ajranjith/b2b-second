"use client";

import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface OrderSummaryProps {
  subtotal: number;
  vat?: number;
  total: number;
  itemCount: number;
  onCheckout?: () => void;
  isSticky?: boolean;
  showVAT?: boolean;
  className?: string;
}

/**
 * Order Summary Component
 *
 * Displays order totals with:
 * - Subtotal
 * - VAT (optional, 20%)
 * - Total
 * - Item count
 * - Checkout CTA
 */
export function OrderSummary({
  subtotal,
  vat,
  total,
  itemCount,
  onCheckout,
  isSticky = true,
  showVAT = true,
  className,
}: OrderSummaryProps) {
  const router = useRouter();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
    }).format(amount);
  };

  const calculateVAT = () => {
    if (vat !== undefined) return vat;
    return showVAT ? subtotal * 0.2 : 0;
  };

  const calculateTotal = () => {
    return subtotal + calculateVAT();
  };

  const handleCheckout = () => {
    if (onCheckout) {
      onCheckout();
    } else {
      router.push("/dealer/checkout");
    }
  };

  return (
    <Card className={cn(isSticky && "sticky top-[200px]", "shadow-lg", className)}>
      <CardHeader>
        <CardTitle>Order Summary</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Item Count */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-600">Items in cart</span>
          <span className="font-medium text-slate-900">{itemCount}</span>
        </div>

        <Separator />

        {/* Subtotal */}
        <div className="flex items-center justify-between">
          <span className="text-slate-600">Subtotal</span>
          <span className="font-medium text-slate-900">{formatCurrency(subtotal)}</span>
        </div>

        {/* VAT */}
        {showVAT && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">VAT (20%)</span>
            <span className="font-medium text-slate-900">{formatCurrency(calculateVAT())}</span>
          </div>
        )}

        <Separator />

        {/* Total */}
        <div className="flex items-center justify-between">
          <span className="text-lg font-semibold text-slate-900">Total</span>
          <span className="text-2xl font-bold text-slate-900">
            {formatCurrency(calculateTotal())}
          </span>
        </div>

        {/* Delivery Note */}
        <p className="text-xs text-slate-500">Delivery charges will be calculated at checkout</p>

        <Separator />

        {/* Checkout Button */}
        <Button size="lg" className="w-full" onClick={handleCheckout} disabled={itemCount === 0}>
          Proceed to Checkout
          <ArrowRight className="ml-2 w-4 h-4" />
        </Button>

        {/* Continue Shopping Link */}
        <Button
          variant="ghost"
          size="sm"
          className="w-full"
          onClick={() => router.push("/dealer/search")}
        >
          Continue Shopping
        </Button>
      </CardContent>
    </Card>
  );
}
