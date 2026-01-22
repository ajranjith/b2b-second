/**
 * Type definitions for Dealer Portal
 */

// === ANNOUNCEMENT / TICKER ===
export type AnnouncementType = "info" | "promo" | "warning" | "urgent";

export interface Announcement {
  id: string;
  type: AnnouncementType;
  title: string;
  shortText: string;
  fullText?: string;
  linkTarget?: string;
  createdAt: string;
  priority: number;
  attachments?: Array<{
    id: string;
    name: string;
    url: string;
    size: number;
  }>;
}

// === ORDER STATUS ===
export type OrderStatus = "submitted" | "processing" | "completed" | "cancelled";

// === STOCK STATUS ===
export type StockStatus = "in_stock" | "low_stock" | "backorder" | "unknown";

// === PRODUCT ===
export interface Product {
  id: string;
  lrNo: string; // Part number
  jagAlt?: string; // Alternative Jaguar part number
  description: string;
  dealerPrice: number;
  availability: StockStatus;
  eta?: string; // Expected arrival date
  quantityAvailable?: number;
  supersededBy?: string; // Supersession info
  notes?: string;
  imageUrl?: string;
}

// === CART ===
export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  lineTotal: number;
}

export interface Cart {
  id: string;
  items: CartItem[];
  subtotal: number;
  vat?: number;
  total: number;
  itemCount: number;
}

// === ORDER ===
export interface OrderLineItem {
  id: string;
  lrNo: string;
  description: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  availability?: StockStatus;
}

export interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  items: OrderLineItem[];
  subtotal: number;
  vat?: number;
  total: number;
  dispatchMethod?: DispatchMethod;
  notes?: string;
  timeline?: OrderTimelineEvent[];
}

export interface OrderTimelineEvent {
  id: string;
  type: "created" | "processing" | "dispatched" | "completed" | "note";
  title: string;
  description?: string;
  timestamp: string;
  userId?: string;
  userName?: string;
}

// === DISPATCH ===
export type DispatchMethod = "standard" | "express" | "collection";

export interface DispatchOption {
  id: DispatchMethod;
  name: string;
  description: string;
  estimatedDays: string;
  price: number;
}

// === DEALER ===
export interface Dealer {
  id: string;
  code: string;
  name: string;
  email: string;
  phone?: string;
  address?: {
    line1: string;
    line2?: string;
    city: string;
    postcode: string;
    country: string;
  };
  accountStatus: "active" | "suspended" | "inactive";
}

// === KPI / DASHBOARD ===
export interface DashboardKPI {
  backordersCount: number;
  ordersInProgress: number;
  accountBalance: number;
  accountCreditLimit: number;
}

// === NEWS / UPDATES ===
export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  fullText?: string;
  publishedAt: string;
  category: "product" | "service" | "general";
  imageUrl?: string;
}

// === TABLE DENSITY ===
export type TableDensity = "comfortable" | "dense";

// === SEARCH / FILTER ===
export interface SearchFilters {
  query: string;
  availability?: StockStatus[];
  priceRange?: {
    min: number;
    max: number;
  };
  sortBy?: "relevance" | "price_asc" | "price_desc" | "part_number";
}

// === API RESPONSES ===
export interface ApiResponse<T> {
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalPages: number;
    totalItems: number;
  };
}

// === UI STATE ===
export interface LoadingState {
  isLoading: boolean;
  error?: string | null;
}

export interface ToastMessage {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  description?: string;
  duration?: number;
}
