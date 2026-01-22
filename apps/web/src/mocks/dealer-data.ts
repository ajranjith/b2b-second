/**
 * Mock data for Dealer Portal development
 */

import type {
  Announcement,
  Product,
  Order,
  DashboardKPI,
  NewsItem,
  DispatchOption,
  Dealer,
} from "@/types/dealer";

// === ANNOUNCEMENTS ===
export const mockAnnouncements: Announcement[] = [
  {
    id: "1",
    type: "info",
    title: "System Maintenance",
    shortText: "Scheduled maintenance on Saturday 3-5 AM GMT",
    fullText:
      "Our system will undergo scheduled maintenance this Saturday from 3:00 AM to 5:00 AM GMT. During this time, the portal may be temporarily unavailable. We apologize for any inconvenience.",
    createdAt: "2026-01-15T10:00:00Z",
    priority: 1,
  },
  {
    id: "2",
    type: "promo",
    title: "New Parts Available",
    shortText: "Latest XJ series parts now in stock",
    fullText:
      "We are pleased to announce that the latest XJ series parts are now available in our catalog. Browse the new additions and place your orders today.",
    createdAt: "2026-01-14T14:30:00Z",
    priority: 2,
  },
  {
    id: "3",
    type: "warning",
    title: "Price Update",
    shortText: "Price adjustments effective Feb 1st",
    fullText:
      "Please note that price adjustments will take effect on February 1st, 2026. Review the updated pricing in your catalog.",
    createdAt: "2026-01-13T09:15:00Z",
    priority: 3,
    attachments: [
      {
        id: "att1",
        name: "price-changes-feb-2026.pdf",
        url: "/downloads/price-changes-feb-2026.pdf",
        size: 245000,
      },
    ],
  },
  {
    id: "4",
    type: "urgent",
    title: "Shipping Delays",
    shortText: "Expect 2-3 day delays on international shipments",
    fullText:
      "Due to increased customs processing times, international shipments may experience 2-3 day delays. We are working to minimize the impact.",
    createdAt: "2026-01-12T16:45:00Z",
    priority: 0,
  },
];

// === PRODUCTS ===
export const mockProducts: Product[] = [
  {
    id: "p1",
    lrNo: "LR001234",
    jagAlt: "C2C12345",
    description: "Oil Filter - XJ Series 3.0 V6 Diesel",
    dealerPrice: 12.45,
    availability: "in_stock",
    quantityAvailable: 150,
    imageUrl: "/products/lr001234.jpg",
  },
  {
    id: "p2",
    lrNo: "LR005678",
    description: "Brake Disc - Front - XF Sportbrake",
    dealerPrice: 89.99,
    availability: "low_stock",
    quantityAvailable: 3,
    imageUrl: "/products/lr005678.jpg",
  },
  {
    id: "p3",
    lrNo: "LR009012",
    jagAlt: "C2C67890",
    description: "Air Filter Element - F-Type V8",
    dealerPrice: 34.5,
    availability: "backorder",
    eta: "2026-02-15",
    notes: "Expected arrival mid-February",
  },
  {
    id: "p4",
    lrNo: "LR003456",
    description: "Wiper Blade Set - E-Pace",
    dealerPrice: 18.75,
    availability: "in_stock",
    quantityAvailable: 87,
  },
  {
    id: "p5",
    lrNo: "LR007890",
    description: "Suspension Spring - Rear - XE",
    dealerPrice: 125.0,
    availability: "unknown",
    notes: "Superseded by LR007891",
    supersededBy: "LR007891",
  },
];

// === ORDERS ===
export const mockOrders: Order[] = [
  {
    id: "o1",
    orderNumber: "ORD-2026-001234",
    status: "processing",
    createdAt: "2026-01-15T09:30:00Z",
    updatedAt: "2026-01-15T11:45:00Z",
    items: [
      {
        id: "oi1",
        lrNo: "LR001234",
        description: "Oil Filter - XJ Series 3.0 V6 Diesel",
        quantity: 10,
        unitPrice: 12.45,
        lineTotal: 124.5,
        availability: "in_stock",
      },
      {
        id: "oi2",
        lrNo: "LR003456",
        description: "Wiper Blade Set - E-Pace",
        quantity: 5,
        unitPrice: 18.75,
        lineTotal: 93.75,
        availability: "in_stock",
      },
    ],
    subtotal: 218.25,
    vat: 43.65,
    total: 261.9,
    dispatchMethod: "standard",
    timeline: [
      {
        id: "te1",
        type: "created",
        title: "Order Created",
        description: "Order successfully submitted",
        timestamp: "2026-01-15T09:30:00Z",
      },
      {
        id: "te2",
        type: "processing",
        title: "Order Processing",
        description: "Your order is being prepared",
        timestamp: "2026-01-15T11:45:00Z",
      },
    ],
  },
  {
    id: "o2",
    orderNumber: "ORD-2026-001188",
    status: "completed",
    createdAt: "2026-01-10T14:20:00Z",
    updatedAt: "2026-01-13T10:00:00Z",
    items: [
      {
        id: "oi3",
        lrNo: "LR005678",
        description: "Brake Disc - Front - XF Sportbrake",
        quantity: 2,
        unitPrice: 89.99,
        lineTotal: 179.98,
        availability: "in_stock",
      },
    ],
    subtotal: 179.98,
    vat: 36.0,
    total: 215.98,
    dispatchMethod: "express",
    timeline: [
      {
        id: "te3",
        type: "created",
        title: "Order Created",
        timestamp: "2026-01-10T14:20:00Z",
      },
      {
        id: "te4",
        type: "processing",
        title: "Order Processing",
        timestamp: "2026-01-10T16:00:00Z",
      },
      {
        id: "te5",
        type: "dispatched",
        title: "Order Dispatched",
        description: "Tracking: DPD123456789",
        timestamp: "2026-01-11T09:30:00Z",
      },
      {
        id: "te6",
        type: "completed",
        title: "Order Delivered",
        timestamp: "2026-01-13T10:00:00Z",
      },
    ],
  },
  {
    id: "o3",
    orderNumber: "ORD-2026-001089",
    status: "submitted",
    createdAt: "2026-01-16T08:15:00Z",
    updatedAt: "2026-01-16T08:15:00Z",
    items: [
      {
        id: "oi4",
        lrNo: "LR007890",
        description: "Suspension Spring - Rear - XE",
        quantity: 4,
        unitPrice: 125.0,
        lineTotal: 500.0,
      },
    ],
    subtotal: 500.0,
    vat: 100.0,
    total: 600.0,
    dispatchMethod: "standard",
  },
];

// === DASHBOARD KPI ===
export const mockDashboardKPI: DashboardKPI = {
  backordersCount: 7,
  ordersInProgress: 3,
  accountBalance: 2450.75,
  accountCreditLimit: 10000.0,
};

// === NEWS ITEMS ===
export const mockNewsItems: NewsItem[] = [
  {
    id: "n1",
    title: "New F-Pace Parts Catalog Released",
    summary: "Browse the latest parts available for the 2026 F-Pace models.",
    publishedAt: "2026-01-14T10:00:00Z",
    category: "product",
  },
  {
    id: "n2",
    title: "Extended Support Hours",
    summary: "Customer support now available until 7 PM GMT on weekdays.",
    publishedAt: "2026-01-12T09:00:00Z",
    category: "service",
  },
  {
    id: "n3",
    title: "Holiday Closure Notice",
    summary: "Please note that we will be closed on the upcoming bank holiday.",
    publishedAt: "2026-01-08T14:30:00Z",
    category: "general",
  },
];

// === DISPATCH OPTIONS ===
export const mockDispatchOptions: DispatchOption[] = [
  {
    id: "standard",
    name: "Standard Delivery",
    description: "Delivery within 3-5 business days",
    estimatedDays: "3-5 days",
    price: 0,
  },
  {
    id: "express",
    name: "Express Delivery",
    description: "Next working day delivery",
    estimatedDays: "1 day",
    price: 15.0,
  },
  {
    id: "collection",
    name: "Click & Collect",
    description: "Collect from our warehouse",
    estimatedDays: "2-3 days",
    price: 0,
  },
];

// === DEALER INFO ===
export const mockDealer: Dealer = {
  id: "d1",
  code: "DLR001",
  name: "Premium Motors Ltd",
  email: "orders@premiummotors.co.uk",
  phone: "+44 20 1234 5678",
  address: {
    line1: "123 High Street",
    line2: "Business Park",
    city: "London",
    postcode: "SW1A 1AA",
    country: "United Kingdom",
  },
  accountStatus: "active",
};
