/**
 * Dealer API Service
 * Interface for all dealer portal API calls
 * Currently uses mock data - replace with actual API calls
 */

import type {
  Announcement,
  Product,
  Order,
  NewsItem,
  DashboardKPI,
  DispatchOption,
  SearchFilters,
  Cart,
} from "@/types/dealer";

import {
  mockAnnouncements,
  mockDashboardKPI,
  mockNewsItems,
  mockProducts,
  mockOrders,
  mockDispatchOptions,
} from "@/mocks/data";

// Simulate network delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// === DEALER API ===
export const dealerApi = {
  // Announcements
  async getAnnouncements(): Promise<Announcement[]> {
    await delay(300);
    return mockAnnouncements;
  },

  // Dashboard
  async getDashboardKPI(): Promise<DashboardKPI> {
    await delay(500);
    return mockDashboardKPI;
  },

  async getRecentOrders(limit: number = 10): Promise<Order[]> {
    await delay(400);
    return mockOrders.slice(0, limit);
  },

  async getNewsItems(limit: number = 5): Promise<NewsItem[]> {
    await delay(350);
    return mockNewsItems.slice(0, limit);
  },

  // Products / Search
  async searchProducts(filters: SearchFilters): Promise<Product[]> {
    await delay(600);

    let results = [...mockProducts];

    // Filter by query
    if (filters.query) {
      const query = filters.query.toLowerCase();
      results = results.filter(
        (p) =>
          p.lrNo.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query) ||
          p.jagAlt?.toLowerCase().includes(query),
      );
    }

    // Filter by availability
    if (filters.availability && filters.availability.length > 0) {
      results = results.filter((p) => filters.availability!.includes(p.availability));
    }

    // Filter by price range
    if (filters.priceRange) {
      results = results.filter(
        (p) => p.dealerPrice >= filters.priceRange!.min && p.dealerPrice <= filters.priceRange!.max,
      );
    }

    // Sort
    if (filters.sortBy === "price_asc") {
      results.sort((a, b) => a.dealerPrice - b.dealerPrice);
    } else if (filters.sortBy === "price_desc") {
      results.sort((a, b) => b.dealerPrice - a.dealerPrice);
    } else if (filters.sortBy === "part_number") {
      results.sort((a, b) => a.lrNo.localeCompare(b.lrNo));
    }

    return results;
  },

  async getProductDetails(productId: string): Promise<Product | null> {
    await delay(300);
    return mockProducts.find((p) => p.id === productId) || null;
  },

  // Cart
  async getCart(): Promise<Cart> {
    await delay(400);
    return {
      id: "cart-1",
      items: [],
      subtotal: 0,
      vat: 0,
      total: 0,
      itemCount: 0,
    };
  },

  async addToCart(productId: string, quantity: number): Promise<void> {
    await delay(300);
    console.log("Added to cart:", productId, quantity);
  },

  async updateCartItemQuantity(itemId: string, quantity: number): Promise<void> {
    await delay(250);
    console.log("Updated cart item:", itemId, quantity);
  },

  async removeFromCart(itemId: string): Promise<void> {
    await delay(250);
    console.log("Removed from cart:", itemId);
  },

  async clearCart(): Promise<void> {
    await delay(200);
    console.log("Cart cleared");
  },

  // Orders
  async getOrders(params?: {
    page?: number;
    limit?: number;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
  }): Promise<{ orders: Order[]; totalCount: number }> {
    await delay(500);

    let filtered = [...mockOrders];

    if (params?.status) {
      filtered = filtered.filter((o) => o.status === params.status);
    }

    if (params?.dateFrom) {
      filtered = filtered.filter((o) => new Date(o.createdAt) >= new Date(params.dateFrom!));
    }
    if (params?.dateTo) {
      filtered = filtered.filter((o) => new Date(o.createdAt) <= new Date(params.dateTo!));
    }

    if (params?.search) {
      const query = params.search.toLowerCase();
      filtered = filtered.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(query) ||
          o.items.some((item) => item.lrNo.toLowerCase().includes(query)),
      );
    }

    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const start = (page - 1) * limit;
    const end = start + limit;

    return {
      orders: filtered.slice(start, end),
      totalCount: filtered.length,
    };
  },

  async getOrderDetails(orderId: string): Promise<Order | null> {
    await delay(400);
    return mockOrders.find((o) => o.id === orderId) || null;
  },

  async downloadOrderSummary(orderId: string): Promise<Blob> {
    await delay(600);
    const blob = new Blob(["Order Summary PDF Content"], { type: "application/pdf" });
    return blob;
  },

  // Checkout
  async getDispatchOptions(): Promise<DispatchOption[]> {
    await delay(300);
    return mockDispatchOptions;
  },

  async submitOrder(data: {
    dispatchMethod: string;
    poReference?: string;
    notes?: string;
  }): Promise<{ orderNumber: string; orderId: string }> {
    await delay(800);
    return {
      orderNumber: `ORD-2026-${String(Math.floor(Math.random() * 1000)).padStart(3, "0")}`,
      orderId: `o${Date.now()}`,
    };
  },
};

// Compatibility exports for legacy page imports.
export const productAPI = {
  async search(filters: SearchFilters, _page = 1, _limit = 50): Promise<Product[]> {
    return dealerApi.searchProducts(filters);
  },
  async getById(productId: string): Promise<Product | null> {
    return dealerApi.getProductDetails(productId);
  },
};

export const dashboardAPI = {
  async getKPIs(): Promise<DashboardKPI> {
    return dealerApi.getDashboardKPI();
  },
  async getRecentOrders(limit = 10): Promise<Order[]> {
    return dealerApi.getRecentOrders(limit);
  },
  async getNews(limit = 5): Promise<NewsItem[]> {
    return dealerApi.getNewsItems(limit);
  },
};

export const orderAPI = {
  async list(params?: {
    page?: number;
    limit?: number;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
  }): Promise<{ orders: Order[]; totalCount: number }> {
    return dealerApi.getOrders(params);
  },
  async getById(orderId: string): Promise<Order | null> {
    return dealerApi.getOrderDetails(orderId);
  },
};
