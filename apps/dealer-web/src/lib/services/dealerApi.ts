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
  genuineTier: string | null;
  aftermarketEsTier: string | null;
  aftermarketBTier: string | null;
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

const mapPartType = (value?: string) => {
  if (!value) return "Genuine";
  if (value === "GENUINE") return "Genuine";
  if (value === "AFTERMARKET") return "Aftermarket";
  if (value === "BRANDED") return "Branded";
  return "Genuine";
};

const determineStockStatus = (stock?: number | null, orderedOnDemand?: boolean) => {
  if (orderedOnDemand) return "Backorder";
  if (stock === undefined || stock === null) return "In Stock";
  if (stock <= 0) return "Backorder";
  if (stock < 10) return "Low Stock";
  return "In Stock";
};

// Helper to convert API cart item to CartItem format
const convertApiCartItem = (apiItem: any): CartItem => {
  const freeStock = apiItem.product?.freeStock ?? 0;
  return {
    id: apiItem.id,
    part: {
      id: apiItem.productId,
      sku: apiItem.product?.productCode ?? "SKU",
      name: apiItem.product?.description ?? apiItem.product?.productCode ?? "Part",
      description: apiItem.product?.description ?? "",
      partType: mapPartType(apiItem.product?.partType),
      stockStatus: determineStockStatus(freeStock, apiItem.orderedOnDemand),
      stockQty: typeof freeStock === "number" ? freeStock : 0,
      price: Number(apiItem.yourPrice ?? 0),
      band: apiItem.priceSource ?? apiItem.tierCode ?? "Tier pricing",
      supersededBy: apiItem.supersededBy || undefined,
      replacementExists: apiItem.replacementExists ?? undefined,
      supersessionDepth: apiItem.supersessionDepth ?? undefined,
      orderedOnDemand: apiItem.orderedOnDemand ?? false,
    },
    qty: apiItem.qty,
  };
};

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
  await api.post("/dealer/cart/items", { productId: part.id, qty });
  return getCart();
}

export async function updateCartItem(itemId: string, qty: number): Promise<CartSummary> {
  await api.patch(`/dealer/cart/items/${itemId}`, { qty });
  return getCart();
}

export async function removeCartItem(itemId: string): Promise<CartSummary> {
  await api.delete(`/dealer/cart/items/${itemId}`);
  return getCart();
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
    const response = await api.get("/dealer/account");
    const tiers = response.data.tiers || {};
    return {
      dealerAccountId: response.data.account?.accountNo ?? "",
      genuineTier: tiers.genuine ?? null,
      aftermarketEsTier: tiers.aftermarketEs ?? null,
      aftermarketBTier: tiers.aftermarketBr ?? null,
    };
  } catch (error) {
    console.error("Failed to fetch pricing context:", error);
    return null;
  }
}

export async function getDealerProfile(): Promise<DealerProfile | null> {
  try {
    const response = await api.get("/dealer/account");
    const account = response.data.account;
    const contact = response.data.contact;
    return {
      firstName: contact?.firstName ?? "Dealer",
      lastName: contact?.lastName ?? "",
      email: contact?.email ?? "",
      defaultShippingMethod: account?.defaultShippingMethod ?? null,
      account: {
        accountNo: account?.accountNo ?? "",
        companyName: account?.companyName ?? "",
        status: account?.status ?? "Unknown",
        notes: account?.notes ?? "",
      },
    };
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
