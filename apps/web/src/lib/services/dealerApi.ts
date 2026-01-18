import {
  announcements,
  orders,
  orderTimeline,
  partsCatalog,
  type Announcement,
  type Order,
  type Part,
} from "@/lib/mock/dealerData";

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

const cartState: CartItem[] = [
  { id: "cart-1", part: partsCatalog[0], qty: 2 },
  { id: "cart-2", part: partsCatalog[3], qty: 1 },
];

const delay = (ms = 240) => new Promise((resolve) => setTimeout(resolve, ms));

const calcSubtotal = (items: CartItem[]) =>
  items.reduce((sum, item) => sum + item.part.price * item.qty, 0);

export async function fetchAnnouncements(): Promise<Announcement[]> {
  await delay(120);
  return announcements;
}

export async function searchParts(params: SearchParams): Promise<{ items: Part[]; total: number }> {
  await delay(180);
  const query = params.query.trim().toLowerCase();
  let items = partsCatalog.filter((part) => {
    const matchQuery =
      !query ||
      part.sku.toLowerCase().includes(query) ||
      part.name.toLowerCase().includes(query) ||
      part.description.toLowerCase().includes(query);
    const matchStock = params.stock && params.stock !== "All" ? part.stockStatus === params.stock : true;
    const matchType = params.partType && params.partType !== "All" ? part.partType === params.partType : true;
    return matchQuery && matchStock && matchType;
  });

  const total = items.length;
  const start = (params.page - 1) * params.pageSize;
  items = items.slice(start, start + params.pageSize);

  return { items, total };
}

export async function getCart(): Promise<CartSummary> {
  await delay(80);
  return { items: cartState, subtotal: calcSubtotal(cartState) };
}

export async function addToCart(part: Part, qty = 1): Promise<CartSummary> {
  await delay(80);
  const existing = cartState.find((item) => item.part.id === part.id);
  if (existing) {
    existing.qty += qty;
  } else {
    cartState.push({ id: `cart-${Date.now()}`, part, qty });
  }
  return { items: cartState, subtotal: calcSubtotal(cartState) };
}

export async function updateCartItem(itemId: string, qty: number): Promise<CartSummary> {
  await delay(80);
  const item = cartState.find((entry) => entry.id === itemId);
  if (item) {
    item.qty = qty;
  }
  return { items: cartState, subtotal: calcSubtotal(cartState) };
}

export async function removeCartItem(itemId: string): Promise<CartSummary> {
  await delay(80);
  const index = cartState.findIndex((entry) => entry.id === itemId);
  if (index >= 0) {
    cartState.splice(index, 1);
  }
  return { items: cartState, subtotal: calcSubtotal(cartState) };
}

export async function getOrders(): Promise<Order[]> {
  await delay(150);
  return orders;
}

export async function getOrderById(id: string): Promise<Order | null> {
  await delay(120);
  return orders.find((order) => order.id === id) || null;
}

export async function getOrderTimeline(id: string) {
  await delay(120);
  return orderTimeline[id] || [];
}
