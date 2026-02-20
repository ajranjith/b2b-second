/**
 * Type definitions for portal components.
 *
 * These types are used by the portal-layer shell, ticker, and drawer
 * components. They intentionally remain separate from the dealer-facing
 * types in ./dealer.ts because the portal UI consumes a simplified
 * shape that will be mapped from whichever API response the backend
 * eventually returns.
 */

export type Announcement = {
  id: string;
  title: string;
  body: string;
  date: string;
  attachments: { name: string; size: string }[];
};

export type Part = {
  id: string;
  sku: string;
  name: string;
  description: string;
  partType: "Genuine" | "Aftermarket" | "Branded";
  stockStatus: "In Stock" | "Low Stock" | "Backorder";
  stockQty: number;
  price: number;
  band: string;
};

export type OrderLine = {
  id: string;
  sku: string;
  description: string;
  qty: number;
  unitPrice: number;
};

export type Order = {
  id: string;
  orderNo: string;
  createdAt: string;
  status: "Processing" | "Ready" | "Shipped" | "Backorder";
  dispatchMethod: "Standard" | "Express" | "Collection";
  poRef: string;
  lines: OrderLine[];
  notes: string;
};

export type OrderTimelineEntry = {
  label: string;
  date: string;
  status: "done" | "current" | "pending";
};
