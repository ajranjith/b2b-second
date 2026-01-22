"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShoppingCart, ArrowLeft } from "lucide-react";
import type { CartItem } from "@/types/dealer";
import { CartTable } from "@/components/dealer/CartTable";
import { OrderSummary } from "@/components/dealer/OrderSummary";
import { showToast, commonToasts } from "@/components/global";
import { Button } from "@/components/ui/button";
import { mockProducts } from "@/mocks/dealer-data";

/**
 * Cart Page
 *
 * Shopping cart with:
 * - Cart table (inline quantity editing)
 * - Remove items with confirmation
 * - Sticky order summary panel
 * - Empty cart state
 */
export default function CartPage() {
  const router = useRouter();

  // Mock cart items for demonstration
  const [cartItems, setCartItems] = useState<CartItem[]>([
    {
      id: "cart-1",
      product: mockProducts[0],
      quantity: 2,
      lineTotal: mockProducts[0].dealerPrice * 2,
    },
    {
      id: "cart-2",
      product: mockProducts[1],
      quantity: 1,
      lineTotal: mockProducts[1].dealerPrice * 1,
    },
    {
      id: "cart-3",
      product: mockProducts[3],
      quantity: 5,
      lineTotal: mockProducts[3].dealerPrice * 5,
    },
  ]);

  const handleUpdateQuantity = (itemId: string, quantity: number) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? {
              ...item,
              quantity,
              lineTotal: item.product.dealerPrice * quantity,
            }
          : item,
      ),
    );
  };

  const handleRemoveItem = (itemId: string) => {
    const item = cartItems.find((i) => i.id === itemId);
    setCartItems((prev) => prev.filter((item) => item.id !== itemId));

    if (item) {
      commonToasts.removedFromCart(item.product.lrNo);
    }
  };

  const handleClearCart = () => {
    setCartItems([]);
    commonToasts.cartCleared();
  };

  const calculateSubtotal = () => {
    return cartItems.reduce((sum, item) => sum + item.lineTotal, 0);
  };

  const calculateVAT = () => {
    return calculateSubtotal() * 0.2;
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateVAT();
  };

  const getTotalItems = () => {
    return cartItems.reduce((sum, item) => sum + item.quantity, 0);
  };

  const handleCheckout = () => {
    router.push("/dealer/checkout");
  };

  // Empty Cart State
  if (cartItems.length === 0) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Shopping Cart</h1>
            <p className="text-slate-600 mt-1">Review and manage your items</p>
          </div>
        </div>

        {/* Empty State */}
        <div className="rounded-lg border-2 border-dashed border-slate-300 p-12 text-center">
          <ShoppingCart className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Your cart is empty</h2>
          <p className="text-slate-600 mb-6">Add some parts to your cart to get started</p>
          <Button size="lg" onClick={() => router.push("/dealer/search")}>
            Browse Parts
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Shopping Cart</h1>
          <p className="text-slate-600 mt-1">
            {getTotalItems()} {getTotalItems() === 1 ? "item" : "items"} in your cart
          </p>
        </div>

        {/* Clear Cart */}
        <Button
          variant="outline"
          onClick={handleClearCart}
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          Clear Cart
        </Button>
      </div>

      {/* Back to Search */}
      <Button variant="ghost" onClick={() => router.push("/dealer/search")} className="gap-2">
        <ArrowLeft className="w-4 h-4" />
        Continue Shopping
      </Button>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cart Table (2/3 width on desktop) */}
        <div className="lg:col-span-2">
          <CartTable
            items={cartItems}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveItem}
          />
        </div>

        {/* Order Summary (1/3 width on desktop) */}
        <div className="lg:col-span-1">
          <OrderSummary
            subtotal={calculateSubtotal()}
            vat={calculateVAT()}
            total={calculateTotal()}
            itemCount={getTotalItems()}
            onCheckout={handleCheckout}
            showVAT={true}
          />
        </div>
      </div>
    </div>
  );
}
