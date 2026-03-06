import {
  orders,
  orderTimeline,
  partsCatalog,
  type Announcement,
  type Order,
  type Part,
} from "@/lib/mock/dealerData";
import { DGS_TICKER_MESSAGE, DGS_TICKER_BODY } from "@/lib/config/dgs";
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

export type DealerPricingContext = {
  dealerAccountId: string;
  genuineTier: string;
  aftermarketEsTier: string;
  aftermarketBTier: string;
};

export type DealerProfile = {
  firstName: string;
  lastName: string;
  email: string;
  defaultShippingMethod?: string | null;
  account: {
    accountNo: string;
    companyName?: string | null;
    status: string;
    notes?: string | null;
  };
};

export type NewsAttachment = {
  id: string;
  fileName: string;
  mimeType?: string;
};

export type NewsArticle = {
  id: string;
  type: string;
  title: string;
  bodyMd?: string;
  startsAt?: string | null;
  endsAt?: string | null;
  publishedAt?: string | null;
  attachments: NewsAttachment[];
};

export type SearchParams = {
  query: string;
  page: number;
  pageSize: number;
  stock?: "All" | "In Stock" | "Low Stock" | "Backorder";
  partType?: "All" | Part["partType"];
};

const delay = (ms = 240) => new Promise((resolve) => setTimeout(resolve, ms));

const calcSubtotal = (items: CartItem[]) =>
  items.reduce((sum, item) => sum + item.part.price * item.qty, 0);

// Helper to convert API cart item to CartItem format
const convertApiCartItem = (apiItem: any): CartItem => ({
  id: apiItem.id,
  part: {
    id: apiItem.productId,
    sku: apiItem.product.productCode,
    name: apiItem.product.productCode,
    description: apiItem.product.description,
    partType: apiItem.product.partType,
    price: apiItem.yourPrice || 0,
    band: apiItem.tierCode || apiItem.priceSource || "Tier pricing",
    stockStatus: "In Stock" as const,
    stockQty: apiItem.product.freeStock ?? 0,
    supersededBy: apiItem.supersededBy || undefined,
    replacementExists: apiItem.replacementExists || false,
    supersessionDepth: apiItem.supersessionDepth || 0,
  },
  qty: apiItem.qty,
});

export async function fetchAnnouncements(): Promise<Announcement[]> {
  await delay(120);
  return [
    {
      id: "dgs-ticker",
      title: DGS_TICKER_MESSAGE,
      body: DGS_TICKER_BODY,
      date: new Date().toISOString().slice(0, 10),
      attachments: [],
    },
  ];
}

export async function searchParts(params: SearchParams): Promise<{ items: Part[]; total: number }> {
  const query = params.query.trim().toLowerCase();
  if (!query) {
    return { items: [], total: 0 };
  }
  try {
    const limit = params.pageSize;
    const offset = (params.page - 1) * params.pageSize;
    const partType =
      params.partType && params.partType !== "All" ? params.partType.toUpperCase() : undefined;
    const inStockOnly = params.stock === "In Stock" ? true : undefined;

    const response = await api.get("/dealer/search", {
      params: {
        q: params.query.trim(),
        limit,
        offset,
        partType,
        inStockOnly,
      },
    });
    const payload = response.data || {};
    const rawItems = payload.items || payload.results || [];
    const items = rawItems.map((item: any) => {
      const freeStock = item.freeStock ?? 0;
      const stockStatus = freeStock <= 0 ? "Backorder" : freeStock < 10 ? "Low Stock" : "In Stock";
      const partTypeLabel =
        item.partType === "GENUINE"
          ? "Genuine"
          : item.partType === "AFTERMARKET"
            ? "Aftermarket"
            : "Branded";
      return {
        id: item.id,
        sku: item.productCode,
        name: item.description || item.productCode,
        description: (item.aliases || []).join(", "),
        partType: partTypeLabel,
        stockStatus,
        stockQty: freeStock,
        price: item.yourPrice ?? Number.NaN,
        band: item.tierCode || item.priceSource || "Tier pricing",
        supersededBy: item.supersededBy || undefined,
        supersessionDepth: item.supersessionDepth || undefined,
        replacementExists: item.replacementExists ?? undefined,
        orderedOnDemand: item.orderedOnDemand || false,
      } as Part;
    });

    const filtered =
      params.stock && params.stock !== "All"
        ? items.filter((item: Part) => item.stockStatus === params.stock)
        : items;
    return {
      items: filtered,
      total: payload.pagination?.total || payload.total || filtered.length,
    };
  } catch (error) {
    console.error("Search failed, falling back to mock data.", error);
    await delay(180);
    let items = partsCatalog.filter((part) => {
      const matchQuery =
        !query ||
        part.sku.toLowerCase().includes(query) ||
        part.name.toLowerCase().includes(query) ||
        part.description.toLowerCase().includes(query);
      const matchStock =
        params.stock && params.stock !== "All" ? part.stockStatus === params.stock : true;
      const matchType =
        params.partType && params.partType !== "All" ? part.partType === params.partType : true;
      return matchQuery && matchStock && matchType;
    });

    const total = items.length;
    const start = (params.page - 1) * params.pageSize;
    items = items.slice(start, start + params.pageSize);

    return { items, total };
  }
}

export async function getCart(): Promise<CartSummary> {
  try {
    const response = await api.get("/dealer/cart");
    const items = response.data.items.map(convertApiCartItem);
    return { items, subtotal: response.data.subtotal };
  } catch (error) {
    console.error("Failed to fetch cart:", error);
    return { items: [], subtotal: 0 };
  }
}

export async function addToCart(part: Part, qty = 1): Promise<CartSummary> {
  try {
    await api.post("/dealer/cart/items", { productId: part.id, qty });
    return await getCart();
  } catch (error) {
    console.error("Failed to add to cart:", error);
    throw error;
  }
}

export async function updateCartItem(itemId: string, qty: number): Promise<CartSummary> {
  try {
    await api.patch(`/dealer/cart/items/${itemId}`, { qty });
    return await getCart();
  } catch (error) {
    console.error("Failed to update cart item:", error);
    throw error;
  }
}

export async function removeCartItem(itemId: string): Promise<CartSummary> {
  try {
    await api.delete(`/dealer/cart/items/${itemId}`);
    return await getCart();
  } catch (error) {
    console.error("Failed to remove cart item:", error);
    throw error;
  }
}

export async function getOrders(): Promise<Order[]> {
  try {
    const response = await api.get("/dealer/orders");
    const apiOrders = response.data.orders || [];
    return apiOrders.map((order: any) => ({
      id: order.id,
      orderNo: order.orderNo,
      createdAt: new Date(order.createdAt).toISOString().slice(0, 10),
      status: order.status,
      dispatchMethod: order.dispatchMethod || "Standard",
      poRef: order.poRef || "",
      notes: order.notes || "",
      lines: (order.lines || []).map((line: any, index: number) => ({
        id: line.id || `${order.id}-${index}`,
        sku: line.productCodeSnapshot || line.productCode,
        description: line.descriptionSnapshot || line.description,
        qty: line.qty,
        unitPrice: Number(line.unitPriceSnapshot || line.unitPrice || 0),
      })),
    }));
  } catch (error) {
    console.error("Failed to fetch orders, falling back to mock data.", error);
    await delay(150);
    return orders;
  }
}

export async function getOrderById(id: string): Promise<Order | null> {
  try {
    const response = await api.get(`/dealer/orders/${id}`);
    const order = response.data;
    return {
      id: order.id,
      orderNo: order.orderNo,
      createdAt: new Date(order.createdAt).toISOString().slice(0, 10),
      status: order.status,
      dispatchMethod: order.dispatchMethod || "Standard",
      poRef: order.poRef || "",
      notes: order.notes || "",
      lines: (order.lines || []).map((line: any, index: number) => ({
        id: line.id || `${order.id}-${index}`,
        sku: line.productCodeSnapshot || line.productCode,
        description: line.descriptionSnapshot || line.description,
        qty: line.qty,
        unitPrice: Number(line.unitPriceSnapshot || line.unitPrice || 0),
      })),
    };
  } catch (error) {
    console.error("Failed to fetch order detail, falling back to mock data.", error);
    await delay(120);
    return orders.find((order) => order.id === id) || null;
  }
}

export async function getOrderTimeline(id: string) {
  await delay(120);
  return orderTimeline[id] || [];
}

export function getPartBySku(sku: string): Part | null {
  const normalized = sku.trim().toLowerCase();
  return partsCatalog.find((part) => part.sku.toLowerCase() === normalized) || null;
}

export async function getBackorders(): Promise<any[]> {
  try {
    const response = await api.get("/dealer/backorders");
    return response.data.backorders || [];
  } catch (error) {
    console.error("Failed to fetch backorders:", error);
    return [];
  }
}

export async function getPricingContext(): Promise<DealerPricingContext | null> {
  try {
    const response = await api.get("/pricing/context");
    return response.data;
  } catch (error) {
    console.error("Failed to fetch pricing context:", error);
    return null;
  }
}

export async function getDealerProfile(): Promise<DealerProfile | null> {
  try {
    const response = await api.get("/dealer/profile");
    return response.data;
  } catch (error) {
    console.error("Failed to fetch dealer profile:", error);
    return null;
  }
}

export async function getNewsArticles(): Promise<NewsArticle[]> {
  try {
    const response = await api.get("/dealer/news");
    return response.data.news || [];
  } catch (error) {
    console.error("Failed to fetch news:", error);
    return [];
  }
}
