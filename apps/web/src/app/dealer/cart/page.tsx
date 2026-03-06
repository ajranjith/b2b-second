"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Input,
  Label,
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/ui";
import { ShoppingCart, Trash2, Plus, Minus, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { useDealerCart } from "@/context/DealerCartContext";
import { getPartBySku } from "@/lib/services/dealerApi";
import { StockNotesBanner } from "@/components/portal/StockNotesBanner";

export default function DealerCartPage() {
  const router = useRouter();
  const { items, subtotal, isLoading, updateQty, removeItem, addItem, clearCart } = useDealerCart();
  const [showCheckout, setShowCheckout] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [dispatchMethod, setDispatchMethod] = useState("STANDARD");
  const [poRef, setPoRef] = useState("");
  const [notes, setNotes] = useState("");
  const [isPlacing, setIsPlacing] = useState(false);

  const itemCount = items.reduce((sum, item) => sum + item.qty, 0);
  const hasSupersededItems = items.some((item) => item.part.supersededBy);
  const showZeroStockNote = items.some((item) => item.part.stockQty <= 0);
  const showOrderedOnDemandNote = items.some((item) => item.part.orderedOnDemand);

  const handleQuantityChange = (itemId: string, newQty: number) => {
    if (newQty < 1) return;
    updateQty(itemId, newQty);
  };

  const handleRemoveItem = (itemId: string) => {
    if (confirm("Remove this item from cart?")) {
      removeItem(itemId);
    }
  };

  const handleReplaceItem = async (itemId: string, supersededBy?: string, qty = 1) => {
    if (!supersededBy) {
      toast.error("Replacement not available online.");
      return;
    }
    const replacement = getPartBySku(supersededBy);
    if (!replacement) {
      toast.error("Replacement not available online.");
      return;
    }
    await addItem(replacement, qty);
    await removeItem(itemId);
    toast.success(`Replaced with ${supersededBy}`);
  };

  const handleCheckout = () => {
    if (!items.length) return;
    if (hasSupersededItems) {
      toast.error("Some items are superseded. Please replace them before checkout.");
      return;
    }
    setShowCheckout(true);
  };

  const handlePlaceOrder = async () => {
    try {
      setIsPlacing(true);
      const response = await api.post("/dealer/checkout", {
        shippingMethod: dispatchMethod,
        poRef,
        notes,
      });
      const orderNo = response.data?.orderNo ?? response.data?.data?.orderNo;
      if (!orderNo) {
        throw new Error("Order number missing in checkout response");
      }
      setOrderNumber(orderNo);
      clearCart();
      setShowCheckout(false);
      setShowConfirmation(true);
      toast.success(`Order ${orderNo} placed successfully`);
      setTimeout(() => {
        router.push("/dealer/orders");
      }, 3000);
    } catch (error: any) {
      const message = error.response?.data?.message;
      const code = error.response?.data?.code;
      if (code === "ITEM_SUPERSEDED") {
        toast.error("Some items are superseded. Please replace them before checkout.");
        return;
      }
      if (message?.includes("SUSPENDED")) {
        toast.error("Your account is suspended. Please contact support.");
      } else {
        toast.error(message || "Failed to place order");
      }
    } finally {
      setIsPlacing(false);
    }
  };

  const partTypeColors: Record<string, string> = {
    Genuine: "bg-blue-100 text-blue-700 border-blue-200",
    Aftermarket: "bg-purple-100 text-purple-700 border-purple-200",
    Branded: "bg-green-100 text-green-700 border-green-200",
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500">Loading cart...</p>
      </div>
    );
  }

  const isEmpty = items.length === 0;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">Shopping Cart</h1>
            {!isEmpty && (
              <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-200">
                {itemCount} items
              </Badge>
            )}
          </div>
          <Button variant="outline" onClick={() => router.push("/dealer/search")}>
            Continue Shopping
          </Button>
        </div>

        {isEmpty && (
          <Card className="shadow-sm border-slate-200">
            <CardContent className="py-16 text-center">
              <ShoppingCart className="h-16 w-16 text-slate-300 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-slate-700 mb-2">Your cart is empty</h2>
              <p className="text-slate-500 mb-6">Add items to your cart to get started</p>
              <Button
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => router.push("/dealer/search")}
              >
                Continue Shopping
              </Button>
            </CardContent>
          </Card>
        )}

        {!isEmpty && (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-4">
              <StockNotesBanner
                showZeroStock={showZeroStockNote}
                showOrderedOnDemand={showOrderedOnDemandNote}
              />
              {items.map((item) => (
                <Card key={item.id} className="shadow-sm border-slate-200">
                  <CardContent className="p-6">
                    <div className="flex gap-4">
                      <div className="w-24 h-24 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-slate-400 text-xs">Image</span>
                      </div>

                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h3 className="font-bold text-lg">{item.part.sku}</h3>
                            <p className="text-sm text-slate-600">{item.part.description}</p>
                            <Badge
                              variant="outline"
                              className={`mt-2 ${partTypeColors[item.part.partType] || "border-slate-200 text-slate-600"}`}
                            >
                              {item.part.partType}
                            </Badge>
                            {item.part.supersededBy && (
                              <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                                <div className="flex items-center justify-between gap-3">
                                  <div>
                                    <span className="font-semibold">Superseded by:</span>{" "}
                                    <button
                                      type="button"
                                      onClick={() =>
                                        router.push(
                                          `/dealer/search?q=${encodeURIComponent(item.part.supersededBy || "")}`,
                                        )
                                      }
                                      className="text-blue-600 hover:underline"
                                    >
                                      {item.part.supersededBy}
                                    </button>
                                  </div>
                                  {item.part.replacementExists ? (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() =>
                                        handleReplaceItem(item.id, item.part.supersededBy, item.qty)
                                      }
                                    >
                                      Replace in cart
                                    </Button>
                                  ) : (
                                    <Badge
                                      variant="outline"
                                      className="border-amber-300 text-amber-700"
                                    >
                                      Not available online
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveItem(item.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="flex items-center justify-between mt-4">
                          <div className="text-sm text-slate-600">
                            Unit Price:{" "}
                            <span className="font-semibold">GBP {item.part.price.toFixed(2)}</span>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="flex items-center border border-slate-200 rounded-lg">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleQuantityChange(item.id, item.qty - 1)}
                                disabled={item.qty <= 1}
                                className="h-8 w-8 p-0 rounded-r-none"
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <Input
                                type="number"
                                value={item.qty}
                                onChange={(e) =>
                                  handleQuantityChange(item.id, parseInt(e.target.value, 10) || 1)
                                }
                                className="h-8 w-16 text-center border-0 focus-visible:ring-0"
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleQuantityChange(item.id, item.qty + 1)}
                                className="h-8 w-8 p-0 rounded-l-none"
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>

                            <div className="text-lg font-bold text-blue-600 min-w-[100px] text-right">
                              GBP {(item.part.price * item.qty).toFixed(2)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="lg:col-span-1">
              <Card className="shadow-sm border-slate-200 sticky top-6">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Items ({itemCount})</span>
                    <span className="font-semibold">GBP {subtotal.toFixed(2)}</span>
                  </div>
                  <div className="border-t pt-4">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Subtotal</span>
                      <span className="text-blue-600">GBP {subtotal.toFixed(2)}</span>
                    </div>
                  </div>
                  {hasSupersededItems && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                      Some items are superseded. Replace them before checkout.
                    </div>
                  )}
                  <Button
                    className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-lg"
                    onClick={handleCheckout}
                    disabled={hasSupersededItems}
                  >
                    Proceed to Checkout
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Complete Your Order</DialogTitle>
              <DialogDescription>Please provide delivery and order details</DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              <div className="space-y-3">
                <Label className="text-base font-semibold">Dispatch Method</Label>
                <div className="space-y-2">
                  <label className="flex items-center space-x-3 cursor-pointer p-3 border rounded-lg hover:bg-slate-50">
                    <input
                      type="radio"
                      value="STANDARD"
                      checked={dispatchMethod === "STANDARD"}
                      onChange={(e) => setDispatchMethod(e.target.value)}
                      className="h-4 w-4 text-blue-600"
                    />
                    <div className="flex-1">
                      <div className="font-medium">Standard Delivery</div>
                      <div className="text-sm text-slate-500">3-5 business days</div>
                    </div>
                  </label>
                  <label className="flex items-center space-x-3 cursor-pointer p-3 border rounded-lg hover:bg-slate-50">
                    <input
                      type="radio"
                      value="EXPRESS"
                      checked={dispatchMethod === "EXPRESS"}
                      onChange={(e) => setDispatchMethod(e.target.value)}
                      className="h-4 w-4 text-blue-600"
                    />
                    <div className="flex-1">
                      <div className="font-medium">Express Delivery</div>
                      <div className="text-sm text-slate-500">1-2 business days</div>
                    </div>
                  </label>
                  <label className="flex items-center space-x-3 cursor-pointer p-3 border rounded-lg hover:bg-slate-50">
                    <input
                      type="radio"
                      value="COLLECTION"
                      checked={dispatchMethod === "COLLECTION"}
                      onChange={(e) => setDispatchMethod(e.target.value)}
                      className="h-4 w-4 text-blue-600"
                    />
                    <div className="flex-1">
                      <div className="font-medium">Collection</div>
                      <div className="text-sm text-slate-500">Same day pickup</div>
                    </div>
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="poRef">PO Reference (Optional)</Label>
                <Input
                  id="poRef"
                  value={poRef}
                  onChange={(e) => setPoRef(e.target.value)}
                  placeholder="Enter your PO reference number"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Order Notes (Optional)</Label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any special instructions or notes"
                  className="w-full min-h-[100px] px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setShowCheckout(false)} className="flex-1">
                  Back to Cart
                </Button>
                <Button
                  onClick={handlePlaceOrder}
                  disabled={isPlacing}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {isPlacing ? "Placing Order..." : "Place Order"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
          <DialogContent>
            <DialogHeader>
              <div className="mx-auto mb-4">
                <CheckCircle className="h-16 w-16 text-green-600" />
              </div>
              <DialogTitle className="text-center text-2xl">Order Placed Successfully!</DialogTitle>
              <DialogDescription className="text-center">
                Your order has been received and is being processed
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="bg-slate-50 rounded-lg p-4 text-center">
                <div className="text-sm text-slate-600 mb-1">Order Number</div>
                <div className="text-2xl font-bold text-blue-600">{orderNumber}</div>
              </div>

              <p className="text-sm text-slate-600 text-center">
                You will be redirected to your orders page shortly...
              </p>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => router.push("/dealer/orders")}
                  className="flex-1"
                >
                  View Order
                </Button>
                <Button
                  onClick={() => router.push("/dealer/search")}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  Continue Shopping
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
