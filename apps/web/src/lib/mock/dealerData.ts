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

export const announcements: Announcement[] = [
  {
    id: "ann-1",
    title: "January dispatch windows updated",
    body:
      "Standard dispatch runs at 16:30. Express cut-off is now 14:00. Collection bookings must be placed by 12:00.",
    date: "2026-01-12",
    attachments: [
      { name: "Dispatch-Cutoffs.pdf", size: "420 KB" },
      { name: "Collection-Slots.xlsx", size: "84 KB" },
    ],
  },
  {
    id: "ann-2",
    title: "Backorder priority campaign",
    body:
      "Priority fulfillment for core Jaguar platforms is active this week. Contact support to flag critical VIN orders.",
    date: "2026-01-15",
    attachments: [{ name: "Priority-List.csv", size: "62 KB" }],
  },
  {
    id: "ann-3",
    title: "New pricing bands effective Feb 1",
    body:
      "Band 1 parts move to a 3.5% adjustment. Review your most purchased SKUs to confirm margin targets.",
    date: "2026-01-18",
// withAudit(
    attachments: [{ name: "Pricing-Update.pdf", size: "310 KB" }],
  },
];

export const partsCatalog: Part[] = [
  {
    id: "part-001",
    sku: "P-0001",
    name: "Brake Pad Set",
    description: "Front axle brake pads for 2018+ models",
    partType: "Genuine",
    stockStatus: "In Stock",
    stockQty: 120,
    price: 95.0,
    band: "Band 1",
  },
  {
    id: "part-002",
    sku: "P-0002",
    name: "Oil Filter",
    description: "Premium oil filter, fits 2.0L diesel",
    partType: "Aftermarket",
    stockStatus: "Low Stock",
    stockQty: 6,
    price: 18.5,
    band: "Band 2",
  },
  {
    id: "part-003",
    sku: "P-0003",
    name: "Suspension Arm",
    description: "Rear suspension arm, heavy duty",
    partType: "Branded",
    stockStatus: "Backorder",
    stockQty: 0,
    price: 148.0,
    band: "Band 1",
  },
  {
    id: "part-004",
    sku: "P-0004",
    name: "Air Filter",
    description: "Cabin air filter, high flow",
    partType: "Genuine",
    stockStatus: "In Stock",
    stockQty: 80,
    price: 22.0,
    band: "Band 3",
  },
  {
    id: "part-005",
    sku: "P-0005",
    name: "Headlamp Assembly",
    description: "LED headlamp assembly, left side",
    partType: "Genuine",
    stockStatus: "Low Stock",
    stockQty: 4,
    price: 420.0,
    band: "Band 1",
  },
  {
    id: "part-006",
    sku: "P-0006",
    name: "Timing Belt Kit",
    description: "Complete timing belt kit with tensioner",
    partType: "Aftermarket",
    stockStatus: "In Stock",
    stockQty: 48,
    price: 210.0,
    band: "Band 2",
  },
  {
    id: "part-007",
    sku: "P-0007",
    name: "Spark Plug Set",
    description: "Iridium spark plugs, set of 6",
    partType: "Branded",
    stockStatus: "In Stock",
    stockQty: 150,
    price: 64.0,
    band: "Band 3",
  },
  {
    id: "part-008",
    sku: "P-0008",
    name: "Wheel Bearing",
    description: "Front wheel bearing assembly",
    partType: "Genuine",
    stockStatus: "Backorder",
    stockQty: 0,
    price: 185.0,
    band: "Band 1",
  },
];

export const orders: Order[] = [
  {
    id: "order-1001",
    orderNo: "HB-2401-1001",
    createdAt: "2026-01-10",
    status: "Processing",
    dispatchMethod: "Standard",
    poRef: "PO-4493",
    notes: "Deliver with morning dispatch if possible.",
    lines: [
      { id: "line-1", sku: "P-0001", description: "Brake Pad Set", qty: 2, unitPrice: 95.0 },
      { id: "line-2", sku: "P-0004", description: "Air Filter", qty: 5, unitPrice: 22.0 },
    ],
  },
  {
    id: "order-1002",
    orderNo: "HB-2401-1002",
    createdAt: "2026-01-12",
    status: "Ready",
    dispatchMethod: "Express",
    poRef: "PO-4521",
    notes: "Urgent repair order.",
    lines: [
      { id: "line-3", sku: "P-0005", description: "Headlamp Assembly", qty: 1, unitPrice: 420.0 },
    ],
  },
  {
    id: "order-1003",
    orderNo: "HB-2401-1003",
    createdAt: "2026-01-14",
    status: "Shipped",
    dispatchMethod: "Standard",
    poRef: "PO-4550",
    notes: "Leave with receiving dock.",
    lines: [
      { id: "line-4", sku: "P-0006", description: "Timing Belt Kit", qty: 1, unitPrice: 210.0 },
      { id: "line-5", sku: "P-0007", description: "Spark Plug Set", qty: 3, unitPrice: 64.0 },
    ],
  },
  {
    id: "order-1004",
    orderNo: "HB-2401-1004",
    createdAt: "2026-01-16",
    status: "Backorder",
    dispatchMethod: "Collection",
    poRef: "PO-4601",
    notes: "Awaiting stock confirmation.",
    lines: [
      { id: "line-6", sku: "P-0008", description: "Wheel Bearing", qty: 2, unitPrice: 185.0 },
    ],
  },
];

export const orderTimeline: Record<
  string,
  { label: string; date: string; status: "done" | "current" | "pending" }[]
> = {
  "order-1001": [
    { label: "Order received", date: "Jan 10, 08:22", status: "done" },
    { label: "Picking in progress", date: "Jan 10, 12:14", status: "current" },
    { label: "Dispatching", date: "Estimated Jan 11", status: "pending" },
  ],
  "order-1002": [
    { label: "Order received", date: "Jan 12, 09:05", status: "done" },
    { label: "Packed and ready", date: "Jan 12, 13:40", status: "current" },
    { label: "Courier pickup", date: "Today 16:00", status: "pending" },
  ],
  "order-1003": [
    { label: "Order received", date: "Jan 14, 10:11", status: "done" },
    { label: "Shipped", date: "Jan 14, 17:20", status: "done" },
    { label: "Delivered", date: "Jan 16, 11:45", status: "current" },
  ],
  "order-1004": [
    { label: "Order received", date: "Jan 16, 09:30", status: "done" },
    { label: "Awaiting stock", date: "Jan 16, 10:05", status: "current" },
    { label: "Allocated to dispatch", date: "TBD", status: "pending" },
  ],
};
