'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, AlertCircle } from 'lucide-react';
import type { DispatchMethod, CartItem } from '@/types/dealer';
import { CheckoutStepIndicator } from '@/components/dealer/CheckoutStepIndicator';
import { DispatchMethodSelector } from '@/components/dealer/DispatchMethodSelector';
import { OrderReview } from '@/components/dealer/OrderReview';
import { OrderConfirmation } from '@/components/dealer/OrderConfirmation';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { showToast, commonToasts } from '@/components/global';

/**
 * Checkout Page
 *
 * 3-step checkout flow:
 * Step 1: Select dispatch method
 * Step 2: Review order
 * Step 3: Confirmation
 */
export default function CheckoutPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [dispatchMethod, setDispatchMethod] = useState<DispatchMethod>('standard');
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [showEmailWarning] = useState(true); // Non-blocking warning

  // TODO: Load cart items from cart context
  const [cartItems] = useState<CartItem[]>([]);

  const calculateSubtotal = () => {
    return cartItems.reduce((sum, item) => sum + item.lineTotal, 0);
  };

  const getDeliveryCharge = () => {
    return dispatchMethod === 'express' ? 15.0 : 0;
  };

  const calculateVAT = () => {
    return (calculateSubtotal() + getDeliveryCharge()) * 0.2;
  };

  const calculateTotal = () => {
    return calculateSubtotal() + getDeliveryCharge() + calculateVAT();
  };

  const handleNext = () => {
    if (currentStep === 1) {
      setCurrentStep(2);
    } else if (currentStep === 2) {
      handlePlaceOrder();
    }
  };

  const handleBack = () => {
    if (currentStep > 1 && currentStep < 3) {
      setCurrentStep(currentStep - 1);
    } else if (currentStep === 1) {
      router.push('/dealer/cart');
    }
  };

  const handlePlaceOrder = async () => {
    setIsProcessing(true);

    try {
      // TODO: Replace with real API call
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Generate order number
      const newOrderNumber = `ORD-${Date.now()}`;
      setOrderNumber(newOrderNumber);

      // Move to confirmation step
      setCurrentStep(3);

      // Show success toast
      commonToasts.orderPlaced(newOrderNumber);
    } catch (error) {
      console.error('Failed to place order:', error);
      showToast.error('Order failed', 'Please try again or contact support');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadInvoice = () => {
    showToast.info('Downloading invoice', 'Your invoice is being prepared...');
    // TODO: Implement invoice download
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Checkout</h1>
        <p className="text-slate-600 mt-1">Complete your order in 3 easy steps</p>
      </div>

      {/* Step Indicator */}
      <CheckoutStepIndicator currentStep={currentStep} />

      {/* Email Warning Banner (Non-blocking) */}
      {showEmailWarning && currentStep < 3 && (
        <Alert className="border-amber-200 bg-amber-50">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            <strong>Note:</strong> Order confirmation will be sent to your registered
            email address. Please ensure your email is up to date in your{' '}
            <button
              onClick={() => router.push('/dealer/account')}
              className="underline hover:no-underline"
            >
              account settings
            </button>
            .
          </AlertDescription>
        </Alert>
      )}

      {/* Step Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content (2/3 width) */}
        <div className="lg:col-span-2">
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-slate-900 mb-4">
                  Choose Delivery Method
                </h2>
                <DispatchMethodSelector
                  selectedMethod={dispatchMethod}
                  onSelectMethod={setDispatchMethod}
                />
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <OrderReview
              items={cartItems}
              dispatchMethod={dispatchMethod}
              subtotal={calculateSubtotal()}
              deliveryCharge={getDeliveryCharge()}
              vat={calculateVAT()}
              total={calculateTotal()}
            />
          )}

          {currentStep === 3 && (
            <OrderConfirmation
              orderNumber={orderNumber}
              orderDate={new Date().toISOString()}
              total={calculateTotal()}
              estimatedDelivery={
                dispatchMethod === 'express'
                  ? 'Tomorrow'
                  : dispatchMethod === 'collection'
                  ? '2-3 days'
                  : '3-5 days'
              }
              onDownloadInvoice={handleDownloadInvoice}
            />
          )}
        </div>

        {/* Order Summary Sidebar (1/3 width) */}
        {currentStep < 3 && (
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-slate-200 p-6 sticky top-[200px]">
              <h3 className="font-semibold text-slate-900 mb-4">Order Summary</h3>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Items ({cartItems.length})</span>
                  <span className="font-medium text-slate-900">
                    £{calculateSubtotal().toFixed(2)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Delivery</span>
                  <span className="font-medium text-slate-900">
                    {getDeliveryCharge() > 0
                      ? `£${getDeliveryCharge().toFixed(2)}`
                      : 'Free'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">VAT (20%)</span>
                  <span className="font-medium text-slate-900">
                    £{calculateVAT().toFixed(2)}
                  </span>
                </div>

                <div className="border-t border-slate-200 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900">Total</span>
                    <span className="text-xl font-bold text-slate-900">
                      £{calculateTotal().toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      {currentStep < 3 && (
        <div className="flex items-center justify-between pt-6 border-t border-slate-200">
          <Button
            variant="outline"
            size="lg"
            onClick={handleBack}
            disabled={isProcessing}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {currentStep === 1 ? 'Back to Cart' : 'Previous Step'}
          </Button>

          <Button
            size="lg"
            onClick={handleNext}
            disabled={isProcessing}
            className="min-w-[200px]"
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                Processing...
              </>
            ) : currentStep === 1 ? (
              <>
                Continue to Review
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            ) : (
              <>
                Place Order
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
