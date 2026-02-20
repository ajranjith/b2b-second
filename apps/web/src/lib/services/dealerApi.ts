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
  // TODO: Replace with real API call — e.g. apiClient.getOrders(dealerAccountId)
  // Stub data mirrors the seed script's 20 sample orders
  const statuses: Order["status"][] = ["Processing", "Ready", "Shipped", "Backorder"];
  const methods: Order["dispatchMethod"][] = ["Standard", "Express", "Collection"];

  return Array.from({ length: 20 }, (_, i) => {
    const idx = i + 1;
    const lineCount = (i % 3) + 1;
    return {
      id: `order-${idx}`,
      orderNo: `ORD-${String(1000 + idx)}`,
      createdAt: new Date(2025, 0, idx).toISOString().split("T")[0],
      status: statuses[i % statuses.length],
      dispatchMethod: methods[i % methods.length],
      poRef: `PO-${String(5000 + idx)}`,
      notes: "",
      lines: Array.from({ length: lineCount }, (__, j) => ({
        id: `line-${idx}-${j}`,
        sku: `P-${String(j * 11 + idx).padStart(4, "0")}`,
        description: [
          "Timing Chain Kit",
          "Brake Disc Set Front",
          "Oil Filter Element",
          "Alternator Assembly",
          "Suspension Bush Kit",
        ][(idx + j) % 5],
        qty: (j + 1) * 2,
        unitPrice: +(((idx * 7 + j * 13) % 200) + 15).toFixed(2),
      })),
    };
  });
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
