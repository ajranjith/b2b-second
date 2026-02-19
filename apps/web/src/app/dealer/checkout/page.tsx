"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart } from "@/hooks/useCart";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, Button } from "@/ui";
import { StatusChip } from "@/components/portal/StatusChip";
import { toast } from "sonner";

const steps = ["Dispatch", "Review", "Confirmation"] as const;

export default function DealerCheckoutPage() {
  const { items, subtotal } = useCart();
  const [step, setStep] = useState(0);
  const [dispatchMethod, setDispatchMethod] = useState("");
  const [poRef, setPoRef] = useState("");
  const [notes, setNotes] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const hasSupersededItems = items.some((item) => item.supersededBy);

  const next = async () => {
    if (hasSupersededItems) return;
    if (step === 0 && !dispatchMethod) return;
    if (step === 1) {
      setSubmitting(true);
      try {
        const response = await api.post("/dealer/checkout", {
          shippingMethod: dispatchMethod,
          poRef,
          notes,
        });
        const resolvedOrderNo = response?.data?.orderNo ?? response?.data?.data?.orderNo;
        if (!resolvedOrderNo) {
          throw new Error("Checkout response missing order number");
        }
        setOrderNumber(resolvedOrderNo);
      } catch (error) {
        toast.error("Checkout failed. Please try again.");
        setSubmitting(false);
        return;
      }
      setSubmitting(false);
    }

    setStep((prev) => Math.min(prev + 1, steps.length - 1));
  };
  const prev = () => setStep((prev) => Math.max(prev - 1, 0));

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="py-16 text-center text-slate-500">
          Your cart is empty. Please add parts before checkout.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm p-6">
        <h1 className="text-3xl font-semibold text-slate-900">Checkout</h1>
        <p className="text-slate-500 mt-1">
          Complete your dispatch details and confirm your order.
        </p>
        <div className="mt-4 flex items-center gap-3">
          {steps.map((label, index) => (
            <StatusChip
              key={label}
              label={`${index + 1}. ${label}`}
              tone={index === step ? "blue" : "slate"}
            />
          ))}
        </div>
      </div>
      {hasSupersededItems && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4 text-sm text-amber-900">
            <div>Some items in your cart are superseded. Replace them before checkout.</div>
            <Link href="/dealer/cart">
              <Button variant="outline">Return to cart</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {step === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Dispatch Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-3">
              {["Standard", "Express", "Collection"].map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setDispatchMethod(option)}
                  className={`rounded-2xl border px-4 py-3 text-left shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600 focus-visible:outline-offset-2 ${
                    dispatchMethod === option
                      ? "border-blue-600 bg-blue-50 text-blue-700"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                  }`}
                >
                  <div className="text-sm font-semibold">{option}</div>
                  <div className="text-xs text-slate-500 mt-1">
                    {option === "Standard" && "3-5 business days"}
                    {option === "Express" && "Next-day priority"}
                    {option === "Collection" && "Pick up from depot"}
                  </div>
                </button>
              ))}
            </div>
            {!dispatchMethod && (
              <div className="text-xs text-rose-500 font-semibold">
                Select a dispatch method to continue.
              </div>
            )}
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-xs font-semibold text-slate-500">PO Reference</label>
                <input
                  value={poRef}
                  onChange={(event) => setPoRef(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600 focus-visible:outline-offset-2"
                  placeholder="Optional reference"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500">Notes</label>
                <input
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600 focus-visible:outline-offset-2"
                  placeholder="Delivery instructions"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Review Order</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border border-slate-200 p-4">
              <div className="text-sm font-semibold text-slate-700">Dispatch</div>
              <div className="text-sm text-slate-500 mt-1">
                {dispatchMethod || "Not set"} | PO {poRef || "None"} | {notes || "No notes"}
              </div>
            </div>
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between border-b border-slate-100 pb-3"
                >
                  <div>
                    <div className="text-sm font-semibold text-slate-900">
                      {item.product.productCode}
                    </div>
                    <div className="text-xs text-slate-500">{item.product.description}</div>
                    {item.supersededBy && (
                      <div className="text-xs text-amber-700">
                        Superseded by {item.supersededBy}
                      </div>
                    )}
                  </div>
                  <div className="text-sm font-semibold text-slate-700">
                    x{item.qty} | GBP {((item.yourPrice || 0) * item.qty).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between text-base font-semibold text-slate-900">
              <span>Total</span>
              <span>GBP {subtotal.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardContent className="py-16 text-center space-y-4">
            <h2 className="text-2xl font-semibold text-slate-900">Order Confirmed</h2>
            <div className="text-sm text-slate-500">Order Number</div>
            <div className="text-2xl font-semibold text-slate-900">{orderNumber}</div>
            <p className="text-slate-500">
              Your order has been placed and is now in processing. We will notify you on status
              updates.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link href="/dealer/orders">
                <Button className="bg-blue-600 text-white hover:bg-blue-700">View Orders</Button>
              </Link>
              <Link href="/dealer/search">
                <Button variant="outline">Return to Search</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={prev} disabled={step === 0}>
          Back
        </Button>
        {step < steps.length - 1 ? (
          <Button
            className="bg-blue-600 text-white hover:bg-blue-700"
            onClick={next}
            disabled={hasSupersededItems || submitting}
          >
            {submitting ? "Processing..." : "Continue"}
          </Button>
        ) : (
          <Link href="/dealer/orders">
            <Button className="bg-blue-600 text-white hover:bg-blue-700">Done</Button>
          </Link>
        )}
      </div>
    </div>
  );
}
