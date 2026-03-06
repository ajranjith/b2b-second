import { bffClient } from "@/lib/bffClient";

export interface Product {
  productCode: string;
  description: string;
  qty: number;
  unitPrice: number;
  totalPrice: number;
  currency: string;
  bandUsed: string;
  minPriceApplied: boolean;
  priceSource: string;
}

export interface CartItem {
  id: string;
  productId: string;
  qty: number;
  product: {
    productCode: string;
    description: string;
  };
}

export interface Cart {
  id: string;
  items: CartItem[];
  totals?: {
    subtotal: number;
    currency: string;
    items: Product[];
  };
}

export interface Order {
  id: string;
  orderNo: string;
  status: string;
  subtotal: number;
  total: number;
  currency: string;
  createdAt: string;
  lines: OrderLine[];
}

export interface OrderLine {
  id: string;
  productCodeSnapshot: string;
  descriptionSnapshot: string;
  qty: number;
  unitPriceSnapshot: number;
}

export interface BackorderLine {
  id: string;
  accountNo: string;
  customerName: string;
  part: string;
  description: string;
  qtyOrdered: number;
  qtyOutstanding: number;
  inWh: number;
}

export interface Dealer {
  id: string;
  accountNo: string;
  companyName: string;
  status: string;
  mainEmail: string;
  phone?: string;
}

class ApiClient {
  private async fetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const method = options?.method || "GET";
    const body = options?.body;
    if (method === "GET") {
      const response = await bffClient.get<T>(endpoint);
      return response.data;
    }

    const response = await bffClient.post<T>(
      endpoint,
      typeof body === "string" ? JSON.parse(body) : body,
    );
    return response.data;
  }

  // Dealer endpoints
  async searchProducts(dealerAccountId: string, query: string): Promise<Product[]> {
    return this.fetch(`/dealer/search?dealerAccountId=${dealerAccountId}&q=${query}`);
  }

  async getCart(dealerUserId: string): Promise<Cart> {
    return this.fetch(`/dealer/cart?dealerUserId=${dealerUserId}`);
  }

  async addToCart(dealerUserId: string, productCode: string, qty: number): Promise<void> {
    await this.fetch("/dealer/cart/items", {
      method: "POST",
      body: JSON.stringify({ dealerUserId, productCode, qty }),
    });
  }

  async updateCartItem(itemId: string, qty: number): Promise<void> {
    await this.fetch(`/dealer/cart/items/${itemId}`, {
      method: "PATCH",
      body: JSON.stringify({ qty }),
    });
  }

  async removeCartItem(itemId: string): Promise<void> {
    await this.fetch(`/dealer/cart/items/${itemId}`, {
      method: "DELETE",
    });
  }

  async checkout(dealerUserId: string): Promise<Order> {
    return this.fetch("/dealer/checkout", {
      method: "POST",
      body: JSON.stringify({ dealerUserId }),
    });
  }

  async getOrders(dealerAccountId: string): Promise<Order[]> {
    return this.fetch(`/dealer/orders?dealerAccountId=${dealerAccountId}`);
  }

  async getBackorders(accountNo: string): Promise<BackorderLine[]> {
    return this.fetch(`/dealer/backorders?accountNo=${accountNo}`);
  }

  // Admin endpoints
  async getDealers(): Promise<Dealer[]> {
    return this.fetch("/admin/dealers");
  }

  async createDealer(data: Partial<Dealer>): Promise<Dealer> {
    return this.fetch("/admin/dealers", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getAllOrders(): Promise<Order[]> {
    return this.fetch("/admin/orders");
  }

  async getImports(): Promise<any[]> {
    return this.fetch("/admin/imports");
  }
}

export const apiClient = new ApiClient();
