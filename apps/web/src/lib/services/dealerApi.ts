import type {
  Announcement,
  Order,
  Part,
  OrderTimelineEntry,
} from "@/types/portal";

export type CartItem = {
  id: string;
  part: Part;
  qty: number;
};

export type CartSummary = {
  items: CartItem[];
  subtotal: number;
};

export type SearchParams = {
  query: string;
  page: number;
  pageSize: number;
  stock?: "All" | "In Stock" | "Low Stock" | "Backorder";
  partType?: "All" | Part["partType"];
};

// TODO: Replace stubs below with real API calls

export async function fetchAnnouncements(): Promise<Announcement[]> {
  // TODO: fetch from API
  return [];
}

export async function searchParts(
  params: SearchParams,
): Promise<{ items: Part[]; total: number }> {
  // TODO: fetch from API
  return { items: [], total: 0 };
}

export async function getCart(): Promise<CartSummary> {
  // TODO: fetch from API
  return { items: [], subtotal: 0 };
}

export async function addToCart(part: Part, qty = 1): Promise<CartSummary> {
  // TODO: call API
  return { items: [], subtotal: 0 };
}

export async function updateCartItem(
  itemId: string,
  qty: number,
): Promise<CartSummary> {
  // TODO: call API
  return { items: [], subtotal: 0 };
}

export async function removeCartItem(itemId: string): Promise<CartSummary> {
  // TODO: call API
  return { items: [], subtotal: 0 };
}

export async function getOrders(): Promise<Order[]> {
  // TODO: fetch from API
  return [];
}

export async function getOrderById(id: string): Promise<Order | null> {
  // TODO: fetch from API
  return null;
}

export async function getOrderTimeline(
  id: string,
): Promise<OrderTimelineEntry[]> {
  // TODO: fetch from API
  return [];
}
