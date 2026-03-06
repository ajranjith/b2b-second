import type { CartItem, DispatchMethod } from "@repo/lib";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui";
import { Separator } from "@repo/ui";
import { Badge } from "@repo/ui";
import { Truck } from "lucide-react";

interface OrderReviewProps {
  items: CartItem[];
  dispatchMethod: DispatchMethod;
  subtotal: number;
  deliveryCharge: number;
  vat: number;
  total: number;
  className?: string;
}

const dispatchLabels: Record<DispatchMethod, string> = {
  standard: "Standard Delivery (3-5 days)",
  express: "Express Delivery (Next day)",
  collection: "Click & Collect",
};

/**
 * Order Review Component
 *
 * Read-only summary of order before confirmation:
 * - Line items table
 * - Dispatch method
 * - Price breakdown
 * - Total amount
 */
export function OrderReview({
  items,
  dispatchMethod,
  subtotal,
  deliveryCharge,
  vat,
  total,
  className,
}: OrderReviewProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
    }).format(amount);
  };

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle>Review Your Order</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Line Items */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-3">
              Order Items ({items.length})
            </h3>
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start justify-between gap-4 pb-3 border-b border-slate-100 last:border-0"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-slate-900">{item.product.lrNo}</span>
                      {item.product.jagAlt && (
                        <Badge variant="outline" className="text-xs">
                          {item.product.jagAlt}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-slate-600 line-clamp-1">
                      {item.product.description}
                    </p>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-sm text-slate-500">Qty: {item.quantity}</span>
                      <span className="text-sm text-slate-500">
                        @ {formatCurrency(item.product.dealerPrice)}
                      </span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="font-semibold text-slate-900">
                      {formatCurrency(item.lineTotal)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Dispatch Method */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Delivery Method</h3>
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Truck className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-slate-900">{dispatchLabels[dispatchMethod]}</div>
                {deliveryCharge > 0 ? (
                  <div className="text-sm text-slate-600">
                    Delivery charge: {formatCurrency(deliveryCharge)}
                  </div>
                ) : (
                  <div className="text-sm text-green-600 font-medium">Free</div>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Price Breakdown */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Subtotal</span>
              <span className="font-medium text-slate-900">{formatCurrency(subtotal)}</span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Delivery</span>
              <span className="font-medium text-slate-900">
                {deliveryCharge > 0 ? formatCurrency(deliveryCharge) : "Free"}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">VAT (20%)</span>
              <span className="font-medium text-slate-900">{formatCurrency(vat)}</span>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold text-slate-900">Total</span>
              <span className="text-2xl font-bold text-slate-900">{formatCurrency(total)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
