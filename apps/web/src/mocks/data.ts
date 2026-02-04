/**
 * Mock Data Providers
 * Local JSON data for development - replace with API calls later
 */

import type {
  Announcement,
  Product,
  Order,
  NewsItem,
  DashboardKPI,
  DispatchOption,
} from '@/types/dealer';

// === ANNOUNCEMENTS ===
export const mockAnnouncements: Announcement[] = [
  {
    id: '1',
    type: 'promo',
    title: 'January Special',
    shortText: 'Get 10% off genuine parts throughout January',
    fullText: 'Exclusive dealer offer: 10% discount on all genuine Land Rover parts throughout January. Use code GENUINE10 at checkout. Valid on orders over £500.',
    priority: 0,
    createdAt: '2026-01-15T10:00:00Z',
    attachments: [
      {
        id: 'a1',
        name: 'January_Promo_Details.pdf',
        url: '/attachments/promo.pdf',
        size: 245000,
      },
    ],
  },
  {
    id: '2',
    type: 'info',
    title: 'System Maintenance',
    shortText: 'Scheduled maintenance this weekend for improved performance',
    fullText: 'We will be performing scheduled system maintenance this weekend from Saturday 2:00 AM to 6:00 AM GMT. During this time, the portal may be temporarily unavailable. We apologize for any inconvenience.',
    priority: 1,
    createdAt: '2026-01-16T14:30:00Z',
  },
  {
    id: '3',
    type: 'warning',
    title: 'Stock Alert',
    shortText: 'Limited stock on popular brake pads - order soon',
    fullText: 'We are experiencing high demand for brake pad kits (LR123456). Current stock levels are running low. Please place your orders as soon as possible to avoid potential delays. Expected restock: January 25th.',
    priority: 2,
    createdAt: '2026-01-17T09:15:00Z',
  },
];

// === DASHBOARD KPI ===
export const mockDashboardKPI: DashboardKPI = {
  backordersCount: 12,
  ordersInProgress: 8,
  accountBalance: -4250.75,
  accountCreditLimit: 50000,
};

// === NEWS ITEMS ===
export const mockNewsItems: NewsItem[] = [
  {
    id: 'n1',
    title: 'New Range Rover Parts Now Available',
    summary: 'Extended range of genuine parts for the latest Range Rover models now in stock',
    publishedAt: '2026-01-15T10:00:00Z',
    category: 'product',
  },
  {
    id: 'n2',
    title: 'Extended Holiday Hours',
    summary: 'Customer support will be available extended hours throughout February',
    publishedAt: '2026-01-14T14:00:00Z',
    category: 'service',
  },
  {
    id: 'n3',
    title: 'Portal Feature Updates',
    summary: 'New search filters and order tracking features have been added to the dealer portal',
    publishedAt: '2026-01-12T09:00:00Z',
    category: 'general',
  },
];

// === PRODUCTS ===
export const mockProducts: Product[] = [
  {
    id: 'p1',
    lrNo: 'LR123456',
    jagAlt: 'C2D12345',
    description: 'Brake Pad Kit - Front Axle - Genuine Land Rover Part',
    dealerPrice: 89.99,
    availability: 'in_stock',
    quantityAvailable: 45,
    imageUrl: '/images/brake-pad.jpg',
  },
  {
    id: 'p2',
    lrNo: 'LR234567',
    description: 'Oil Filter - 2.0L Diesel Engine - Premium Quality',
    dealerPrice: 12.50,
    availability: 'in_stock',
    quantityAvailable: 120,
  },
  {
    id: 'p3',
    lrNo: 'LR345678',
    jagAlt: 'C2D23456',
    description: 'Air Suspension Compressor - Range Rover Sport',
    dealerPrice: 425.00,
    availability: 'low_stock',
    quantityAvailable: 3,
    notes: 'High demand item - order soon',
  },
  {
    id: 'p4',
    lrNo: 'LR456789',
    description: 'Headlight Assembly - LED - Discovery 5 - Driver Side',
    dealerPrice: 789.99,
    availability: 'backorder',
    eta: '2026-01-25',
    notes: 'Expected delivery date: Jan 25, 2026',
  },
  {
    id: 'p5',
    lrNo: 'LR567890',
    description: 'Timing Belt Kit - 3.0L V6 Engine - Complete Set',
    dealerPrice: 156.75,
    availability: 'in_stock',
    quantityAvailable: 28,
    supersededBy: 'LR567891',
    notes: 'Superseded by LR567891 - current stock available',
  },
];

// === ORDERS ===
export const mockOrders: Order[] = [
  {
    id: 'o1',
    orderNumber: 'ORD-2026-001',
    status: 'processing',
    createdAt: '2026-01-17T10:30:00Z',
    updatedAt: '2026-01-17T11:00:00Z',
    items: [
      {
        id: 'ol1',
        lrNo: 'LR123456',
        description: 'Brake Pad Kit - Front Axle',
        quantity: 4,
        unitPrice: 89.99,
        lineTotal: 359.96,
        availability: 'in_stock',
      },
      {
        id: 'ol2',
        lrNo: 'LR234567',
        description: 'Oil Filter - 2.0L Diesel Engine',
        quantity: 10,
        unitPrice: 12.50,
        lineTotal: 125.00,
        availability: 'in_stock',
      },
    ],
    subtotal: 484.96,
    vat: 96.99,
    total: 581.95,
    dispatchMethod: 'standard',
    notes: 'Please deliver to rear entrance',
    timeline: [
      {
        id: 't1',
        type: 'created',
        title: 'Order Placed',
        description: 'Order successfully submitted',
        timestamp: '2026-01-17T10:30:00Z',
      },
      {
        id: 't2',
        type: 'processing',
        title: 'Order Processing',
        description: 'Items being prepared for dispatch',
        timestamp: '2026-01-17T11:00:00Z',
      },
    ],
  },
  {
    id: 'o2',
    orderNumber: 'ORD-2026-002',
    status: 'completed',
    createdAt: '2026-01-15T14:20:00Z',
    updatedAt: '2026-01-16T16:45:00Z',
    items: [
      {
        id: 'ol3',
        lrNo: 'LR345678',
        description: 'Air Suspension Compressor',
        quantity: 1,
        unitPrice: 425.00,
        lineTotal: 425.00,
      },
    ],
    subtotal: 425.00,
    vat: 85.00,
    total: 510.00,
    dispatchMethod: 'express',
    timeline: [
      {
        id: 't3',
        type: 'created',
        title: 'Order Placed',
        timestamp: '2026-01-15T14:20:00Z',
      },
      {
        id: 't4',
        type: 'processing',
        title: 'Order Processing',
        timestamp: '2026-01-15T15:00:00Z',
      },
      {
        id: 't5',
        type: 'dispatched',
        title: 'Dispatched',
        description: 'Tracking: DPD123456789',
        timestamp: '2026-01-16T09:00:00Z',
      },
      {
        id: 't6',
        type: 'completed',
        title: 'Delivered',
        description: 'Signed for by: J. Smith',
        timestamp: '2026-01-16T16:45:00Z',
      },
    ],
  },
];

// === DISPATCH OPTIONS ===
export const mockDispatchOptions: DispatchOption[] = [
  {
    id: 'standard',
    name: 'Standard Delivery',
    description: 'Next working day for orders placed before 3pm',
    estimatedDays: '1-2 business days',
    price: 0,
  },
  {
    id: 'express',
    name: 'Express Delivery',
    description: 'Same day delivery for orders placed before 12pm',
    estimatedDays: 'Same day',
    price: 15.00,
  },
  {
    id: 'collection',
    name: 'Click & Collect',
    description: 'Collect from our warehouse - available same day',
    estimatedDays: 'Same day',
    price: 0,
  },
];
