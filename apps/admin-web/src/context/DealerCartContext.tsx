"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  addToCart,
  getCart,
  removeCartItem,
  updateCartItem,
  type CartItem,
} from "@/lib/services/dealerApi";

type CartState = {
  items: CartItem[];
  subtotal: number;
  isLoading: boolean;
  addItem: (item: CartItem["part"], qty?: number) => Promise<void>;
  updateQty: (itemId: string, qty: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => void;
};

const CartContext = createContext<CartState | undefined>(undefined);

export function DealerCartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [subtotal, setSubtotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const computeSubtotal = (nextItems: CartItem[]) =>
    nextItems.reduce((sum, item) => sum + item.part.price * item.qty, 0);

  const syncCart = async () => {
    const cart = await getCart();
    setItems([...cart.items]);
    setSubtotal(cart.subtotal);
  };

  useEffect(() => {
    syncCart().finally(() => setIsLoading(false));
  }, []);

  const addItem = async (part: CartItem["part"], qty = 1) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.part.id === part.id);
      const nextItems = existing
        ? prev.map((item) => (item.part.id === part.id ? { ...item, qty: item.qty + qty } : item))
        : [...prev, { id: `cart-${Date.now()}`, part, qty }];
      setSubtotal(computeSubtotal(nextItems));
      return nextItems;
    });
    try {
      const updated = await addToCart(part, qty);
      setItems([...updated.items]);
      setSubtotal(updated.subtotal);
    } catch (error) {
      console.error("Cart add failed, keeping local state.", error);
    }
  };

  const updateQty = async (itemId: string, qty: number) => {
    setItems((prev) => {
      const nextItems = prev.map((item) => (item.id === itemId ? { ...item, qty } : item));
      setSubtotal(computeSubtotal(nextItems));
      return nextItems;
    });
    try {
      const updated = await updateCartItem(itemId, qty);
      setItems([...updated.items]);
      setSubtotal(updated.subtotal);
    } catch (error) {
      console.error("Cart update failed, keeping local state.", error);
    }
  };

  const removeItem = async (itemId: string) => {
    setItems((prev) => {
      const nextItems = prev.filter((item) => item.id !== itemId);
      setSubtotal(computeSubtotal(nextItems));
      return nextItems;
    });
    try {
      const updated = await removeCartItem(itemId);
      setItems([...updated.items]);
      setSubtotal(updated.subtotal);
    } catch (error) {
      console.error("Cart remove failed, keeping local state.", error);
    }
  };

  const clearCart = () => {
    setItems([]);
    setSubtotal(0);
    // TODO: Call API to clear cart on server
  };

  const value = useMemo(
    () => ({ items, subtotal, isLoading, addItem, updateQty, removeItem, clearCart }),
    [items, subtotal, isLoading],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useDealerCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useDealerCart must be used within DealerCartProvider");
  }
  return context;
}
