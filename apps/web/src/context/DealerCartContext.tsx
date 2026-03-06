"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  addToCart,
  getCart,
  removeCartItem,
  updateCartItem,
  type CartItem,
} from "@/lib/services/dealerApi";

const CART_STORAGE_KEY = "dealer_cart_v1";

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

  const loadPersistedCart = (): CartSummary | null => {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem(CART_STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as CartSummary;
      if (!Array.isArray(parsed.items)) return null;
      return { items: parsed.items, subtotal: Number(parsed.subtotal || 0) };
    } catch {
      return null;
    }
  };

  const persistCart = (nextItems: CartItem[], nextSubtotal: number) => {
    if (typeof window === "undefined") return;
    localStorage.setItem(
      CART_STORAGE_KEY,
      JSON.stringify({ items: nextItems, subtotal: nextSubtotal }),
    );
  };

  const syncCart = async () => {
    const cart = await getCart();
    if (cart.items.length === 0) {
      setItems((prev) => prev);
      setSubtotal((prev) => prev);
      return;
    }
    setItems([...cart.items]);
    setSubtotal(cart.subtotal);
  };

  useEffect(() => {
    const persisted = loadPersistedCart();
    if (persisted && persisted.items.length > 0) {
      setItems(persisted.items);
      setSubtotal(persisted.subtotal || computeSubtotal(persisted.items));
    }
    syncCart().finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    persistCart(items, subtotal);
  }, [items, subtotal]);

  const addItem = async (part: CartItem["part"], qty = 1) => {
    let optimisticItems: CartItem[] = [];
    setItems((prev) => {
      const existing = prev.find((item) => item.part.id === part.id);
      optimisticItems = existing
        ? prev.map((item) => (item.part.id === part.id ? { ...item, qty: item.qty + qty } : item))
        : [...prev, { id: `cart-${Date.now()}`, part, qty }];
      setSubtotal(computeSubtotal(optimisticItems));
      return optimisticItems;
    });
    try {
      const updated = await addToCart(part, qty);
      if (updated.items.length > 0) {
        setItems([...updated.items]);
        setSubtotal(updated.subtotal);
      }
    } catch (error) {
      console.error("Cart add failed, keeping local state.", error);
      setItems(optimisticItems);
      setSubtotal(computeSubtotal(optimisticItems));
    }
  };

  const updateQty = async (itemId: string, qty: number) => {
    let optimisticItems: CartItem[] = [];
    setItems((prev) => {
      optimisticItems = prev.map((item) => (item.id === itemId ? { ...item, qty } : item));
      setSubtotal(computeSubtotal(optimisticItems));
      return optimisticItems;
    });
    try {
      const updated = await updateCartItem(itemId, qty);
      if (updated.items.length > 0) {
        setItems([...updated.items]);
        setSubtotal(updated.subtotal);
      } else {
        // Ignore empty server snapshots for qty updates; keep optimistic UI.
        setItems(optimisticItems);
        setSubtotal(computeSubtotal(optimisticItems));
      }
    } catch (error) {
      console.error("Cart update failed, keeping local state.", error);
      setItems(optimisticItems);
      setSubtotal(computeSubtotal(optimisticItems));
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
    if (typeof window !== "undefined") {
      localStorage.removeItem(CART_STORAGE_KEY);
    }
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
