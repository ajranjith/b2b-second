import { useRouter } from "next/navigation";
import { CheckCircle, Download, Eye, ShoppingBag } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface OrderConfirmationProps {
  orderNumber: string;
  orderDate: string;
  total: number;
  estimatedDelivery?: string;
  onDownloadInvoice?: () => void;
  className?: string;
}

/**
 * Order Confirmation Component
 *
 * Success page after order placement:
 * - Success icon and message
 * - Order number
 * - Order summary
 * - Action buttons (Download invoice, View order, Continue shopping)
 */
export function OrderConfirmation({
  orderNumber,
  orderDate,
  total,
  estimatedDelivery,
  onDownloadInvoice,
  className,
}: OrderConfirmationProps) {
  const router = useRouter();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className={className}>
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-6">
          {/* Success Icon */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Order Placed Successfully!</h2>
            <p className="text-slate-600">
              Thank you for your order. {"We'll"} send you a confirmation email shortly.
            </p>
          </div>

          <Separator className="my-6" />

          {/* Order Details */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Order Number</span>
              <span className="font-semibold text-slate-900">{orderNumber}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Order Date</span>
              <span className="font-medium text-slate-900">{formatDate(orderDate)}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Order Total</span>
              <span className="text-lg font-bold text-slate-900">{formatCurrency(total)}</span>
            </div>

            {estimatedDelivery && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Estimated Delivery</span>
                <span className="font-medium text-slate-900">{estimatedDelivery}</span>
              </div>
            )}
          </div>

          <Separator className="my-6" />

          {/* What Happens Next */}
          <div className="bg-white rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-slate-900 mb-3">What happens next?</h3>
            <ul className="space-y-2 text-sm text-slate-600">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span>{"You'll"} receive an email confirmation shortly</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span>Your order will be processed within 1 business day</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span>Track your order status in the Orders section</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span>{"You'll"} receive tracking details once dispatched</span>
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              size="lg"
              className="w-full"
              onClick={() => router.push(`/dealer/orders/${orderNumber}`)}
            >
              <Eye className="w-4 h-4 mr-2" />
              View Order Details
            </Button>

            {onDownloadInvoice && (
              <Button variant="outline" size="lg" className="w-full" onClick={onDownloadInvoice}>
                <Download className="w-4 h-4 mr-2" />
                Download Invoice
              </Button>
            )}

            <Button
              variant="ghost"
              size="lg"
              className="w-full"
              onClick={() => router.push("/dealer/search")}
            >
              <ShoppingBag className="w-4 h-4 mr-2" />
              Continue Shopping
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
