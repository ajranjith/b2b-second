import type {
  Announcement,
  Order,
  Part,
  OrderTimelineEntry,
} from "@/types/portal";
import api from "@/lib/api";

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

export async function fetchAnnouncements(): Promise<Announcement[]> {
  const res = await api.get('/dealer/announcements');
  return res.data.announcements ?? [];
}

export async function searchParts(
  params: SearchParams,
): Promise<{ items: Part[]; total: number }> {
  const res = await api.get('/dealer/search', { params });
  return { items: res.data.items ?? [], total: res.data.total ?? 0 };
}

export async function getCart(): Promise<CartSummary> {
  const res = await api.get('/dealer/cart');
  return res.data;
}

export async function addToCart(part: Part, qty = 1): Promise<CartSummary> {
  const res = await api.post('/dealer/cart/items', { productId: part.id, qty });
  return res.data;
}

export async function updateCartItem(
  itemId: string,
  qty: number,
): Promise<CartSummary> {
  const res = await api.patch(`/dealer/cart/items/${itemId}`, { qty });
  return res.data;
}

export async function removeCartItem(itemId: string): Promise<CartSummary> {
  const res = await api.delete(`/dealer/cart/items/${itemId}`);
  return res.data;
}

export async function getOrders(): Promise<Order[]> {
  const res = await api.get('/dealer/orders');
  return res.data.orders ?? [];
}

export async function getOrderById(id: string): Promise<Order | null> {
  const res = await api.get(`/dealer/orders/${id}`);
  return res.data.order ?? null;
}

export async function getOrderTimeline(
  id: string,
): Promise<OrderTimelineEntry[]> {
  const res = await api.get(`/dealer/orders/${id}/timeline`);
  return res.data.timeline ?? [];
}
