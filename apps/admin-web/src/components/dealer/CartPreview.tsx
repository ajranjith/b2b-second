"use client";

import { useRouter } from "next/navigation";
import { ShoppingCart, X } from "lucide-react";
import type { CartItem } from "@repo/lib";
import { Button } from "@repo/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui";
import { Separator } from "@repo/ui";
import { ScrollArea } from "@repo/ui";
import { cn } from "@/lib/utils";

interface CartPreviewProps {
  items: CartItem[];
  subtotal: number;
  onRemoveItem?: (itemId: string) => void;
  className?: string;
}

/**
 * Cart Preview Component
 *
 * Sticky right-side panel showing:
 * - Last 5 items added to cart
 * - Subtotal
 * - View Cart button
 * - Checkout button
 */
export function CartPreview({ items, subtotal, onRemoveItem, className }: CartPreviewProps) {
  const router = useRouter();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
    }).format(amount);
  };

  // Show last 5 items
  const recentItems = items.slice(-5).reverse();
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  if (items.length === 0) {
    return (
      <Card className={cn("sticky top-[200px]", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Cart
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <ShoppingCart className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">Your cart is empty</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("sticky top-[200px]", className)}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Cart
          </span>
          <span className="text-sm font-normal text-slate-600">
            {totalItems} {totalItems === 1 ? "item" : "items"}
          </span>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Recent Items */}
        <div>
          <p className="text-xs text-slate-500 mb-2 uppercase tracking-wide">Recently Added</p>
          <ScrollArea className="h-[280px]">
            <div className="space-y-3">
              {recentItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {item.product.lrNo}
                    </p>
                    <p className="text-xs text-slate-600 line-clamp-1 mb-1">
                      {item.product.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">Qty: {item.quantity}</span>
                      <span className="text-sm font-semibold text-slate-900">
                        {formatCurrency(item.lineTotal)}
                      </span>
                    </div>
                  </div>

                  {onRemoveItem && (
                    <button
                      onClick={() => onRemoveItem(item.id)}
                      className="flex-shrink-0 p-1 hover:bg-slate-200 rounded transition-colors"
                      aria-label="Remove item"
                    >
                      <X className="w-4 h-4 text-slate-500" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>

          {items.length > 5 && (
            <p className="text-xs text-slate-500 mt-2 text-center">
              +{items.length - 5} more {items.length - 5 === 1 ? "item" : "items"} in cart
            </p>
          )}
        </div>

        <Separator />

        {/* Subtotal */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">Subtotal</span>
            <span className="text-lg font-bold text-slate-900">{formatCurrency(subtotal)}</span>
          </div>
          <p className="text-xs text-slate-500">Excluding VAT and delivery charges</p>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <Button size="lg" className="w-full" onClick={() => router.push("/dealer/checkout")}>
            Checkout
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="w-full"
            onClick={() => router.push("/dealer/cart")}
          >
            View Cart
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
