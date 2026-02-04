# Phase 1 B2B Dealer Portal - Complete Implementation Plan

**Date:** 2026-01-17
**Status:** In Progress

---

## Overview

This document outlines the complete implementation of the Phase 1 B2B Dealer Portal following the 10-task specification. The portal follows modern B2B e-commerce patterns with a clean "Eurospare-like" aesthetic.

---

## ✅ TASK 1 — Project Structure (COMPLETED)

### Created Files:

1. **Theme Tokens**: [src/lib/theme.ts](apps/web/src/lib/theme.ts)
   - Spacing scales (xs to 3xl)
   - Layout dimensions (header: 72px, sidenav: 260px, etc.)
   - Border radius (sm to full)
   - Typography scales
   - Color tokens (brand, status, stock)
   - Table density settings

2. **Mock Data**: [src/mocks/data.ts](apps/web/src/mocks/data.ts)
   - Announcements (3 types: info, promo, warning)
   - Dashboard KPIs
   - News items
   - Products (5 sample parts)
   - Orders (2 sample orders with timelines)
   - Dispatch options

3. **API Service**: [src/services/dealer-api.ts](apps/web/src/services/dealer-api.ts)
   - getAnnouncements()
   - getDashboardKPI()
   - searchProducts(filters)
   - getCart(), addToCart(), etc.
   - getOrders(params), getOrderDetails()
   - submitOrder()

### Directory Structure:
```
apps/web/src/
├── components/
│   ├── global/            # Shared UI components
│   ├── layouts/           # AppShell, SideNav, BottomNav
│   ├── dealer/            # Dealer-specific components
│   └── ui/                # Shadcn components
├── app/
│   └── dealer/
│       ├── dashboard/     # Dashboard page
│       ├── search/        # Search parts page
│       ├── cart/          # Shopping cart
│       ├── checkout/      # 3-step checkout flow
│       ├── orders/        # Orders list
│       ├── orders/[id]/   # Order detail
│       ├── process-order/ # Process order status
│       └── account/       # Account settings
├── services/              # API interfaces
├── mocks/                 # Mock data
├── lib/                   # Utilities & theme
└── types/                 # TypeScript types
```

---

## 🔨 TASK 2 — AppShell Layout

### Component: [AppShell.tsx](apps/web/src/components/layouts/AppShell.tsx)

**Structure:**
```
┌─────────────────────────────────────┐
│   Header (72px desktop/64 mobile)   │ ← Sticky, z-50
├─────────────────────────────────────┤
│   AnnouncementTicker (40px)         │ ← Sticky below header
├──────────┬──────────────────────────┤
│          │                          │
│ SideNav  │  Main Content            │
│ (260px)  │  (max-width: 1440px)     │
│          │  (padding: 24-32px)      │
│ Fixed    │                          │
│          │                          │
│          │                          │
└──────────┴──────────────────────────┘
         ↑
   Hidden on mobile,
   replaced by BottomNav
```

**Responsibilities:**
- Render ReferenceHeader (sticky)
- Render AnnouncementTicker (sticky below header)
- Render SideNav (desktop: fixed sidebar, mobile: overlay drawer)
- Render BottomNav (mobile only)
- Manage loading states (top progress bar + cursor)
- Handle announcement clicks → open MessageDrawer

**Props:**
```typescript
interface AppShellProps {
  children: React.ReactNode;
  announcements: Announcement[];
}
```

---

## 🧩 TASK 3 — Global Components

### 3.1 MessageDrawer Component

**File**: `src/components/global/MessageDrawer.tsx`

**Features:**
- Right-side drawer (480px desktop, full-screen mobile)
- Shows full announcement details
- Attachments list with download links
- Focus trap (when open, focus stays in drawer)
- ESC key to close
- Overlay backdrop (click to close)
- Smooth slide-in animation

**Structure:**
```tsx
<MessageDrawer isOpen={bool} onClose={fn} announcement={Announcement}>
  <DrawerHeader>
    <TypeBadge /> {announcement.title}
    <CloseButton />
  </DrawerHeader>
  <DrawerBody>
    <p>{announcement.fullText}</p>
    {announcement.attachments?.length > 0 && (
      <AttachmentsList>
        {attachments.map(...)}
      </AttachmentsList>
    )}
  </DrawerBody>
</MessageDrawer>
```

### 3.2 SideNav Component

**File**: `src/components/layouts/SideNav.tsx`

**Features:**
- Desktop: Fixed sidebar (260px wide)
- Mobile: Overlay drawer (triggered from AppShell)
- Nav links with icons and active states
- Sections:
  - Dashboard
  - Search Parts
  - Orders
  - Account
  - Divider
  - Settings
  - Logout

**Active State Logic:**
```typescript
const isActive = pathname === href || pathname.startsWith(href + '/');
```

**Styling:**
- Active: `bg-blue-50 text-blue-600 border-l-4 border-blue-600`
- Hover: `hover:bg-slate-50`

### 3.3 BottomNav Component

**File**: `src/components/layouts/BottomNav.tsx`

**Features:**
- Mobile only (`className="lg:hidden"`)
- Fixed bottom (height: 64px)
- 4 nav items: Dashboard, Search, Orders, Account
- Active state: blue icon + text
- Cart badge overlay on Search/Cart icon

### 3.4 StatusChip Component

**File**: `src/components/global/StatusChip.tsx`

**Variants:**
```typescript
type Variant = 'neutral' | 'info' | 'success' | 'warning' | 'error' | 'urgent';

const statusStyles = {
  neutral: 'bg-slate-100 text-slate-700 border-slate-200',
  info: 'bg-blue-50 text-blue-700 border-blue-200',
  success: 'bg-green-50 text-green-700 border-green-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  error: 'bg-red-50 text-red-700 border-red-200',
  urgent: 'bg-red-100 text-red-800 border-red-300',
};
```

**Usage:**
```tsx
<StatusChip variant="success">In Stock</StatusChip>
<StatusChip variant="warning">Low Stock</StatusChip>
<StatusChip variant="info">Backorder</StatusChip>
```

### 3.5 Table Component

**File**: `src/components/global/Table.tsx`

**Features:**
- Density toggle: Comfortable (56px rows) / Dense (40px rows)
- Sortable headers (click to sort)
- Row expansion (chevron icon)
- Empty state
- Loading skeleton
- Sticky header (optional)

**Props:**
```typescript
interface TableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  density?: 'comfortable' | 'dense';
  isLoading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
  expandable?: boolean;
  renderExpanded?: (row: T) => React.ReactNode;
}
```

### 3.6 Toast Notifications

**Already exists**: Using `sonner` library
- Success toast: `toast.success("Item added to cart")`
- Error toast: `toast.error("Failed to load")`
- Info toast: `toast.info("Order processing")`

---

## 📊 TASK 4 — Dashboard Page

**File**: `src/app/dealer/dashboard/page.tsx`

### Layout:

```
┌─────────────────────────────────────────────────┐
│  Dashboard                                       │
│  Welcome back, here's what's happening today     │
├─────────────────────────────────────────────────┤
│                                                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐         │
│  │ Backorders│ │ Orders   │ │ Account  │         │
│  │    12    │ │ Progress │ │ Balance  │         │
│  │ Download │ │    8     │ │ -£4,250  │         │
│  └──────────┘ └──────────┘ └──────────┘         │
│                                                  │
├─────────────────────────────────────────────────┤
│  Recent Orders (last 10)                        │
│  ┌─────────────────────────────────────────┐   │
│  │ Order No │ Date │ Items │ Total │ Status│   │
│  ├─────────────────────────────────────────┤   │
│  │ ORD-001  │ ...  │   2   │ £581  │ ●●●   │   │
│  │ ORD-002  │ ...  │   1   │ £510  │ ●●●   │   │
│  └─────────────────────────────────────────┘   │
│                                                  │
├─────────────────────────────────────────────────┤
│  News & Updates                                 │
│  ┌──────────────────────────────────────┐       │
│  │ 📰 New Range Rover Parts Available   │       │
│  │ Jan 15 • Product                     │       │
│  ├──────────────────────────────────────┤       │
│  │ 🔔 Extended Holiday Hours            │       │
│  │ Jan 14 • Service                     │       │
│  └──────────────────────────────────────┘       │
└─────────────────────────────────────────────────┘
```

### Components to Build:

1. **KPICard** - Stats cards with icons, values, trends
2. **RecentOrdersTable** - Table showing last 10 orders
3. **NewsFeedCard** - List of news items with category badges

### States:
- Loading: Show skeleton cards
- Empty orders: "No orders yet" message
- Error: Error card with retry button

---

## 🔍 TASK 5 — Search Parts Page

**File**: `src/app/dealer/search/page.tsx`

### Layout:

```
┌──────────────────────────────┬─────────────┐
│  Search Parts                │ Cart Preview│
├──────────────────────────────┤ (Sticky)    │
│ 🔍 Search + Filters (Sticky) │             │
├──────────────────────────────┤ Last 5 items│
│ Results Table:               │             │
│ ┌──────────────────────────┐ │ Subtotal:   │
│ │Part No│Desc│Price│Stock  │ │ £584.96     │
│ ├──────────────────────────┤ │             │
│ │LR12345│Brake│£89│In Stock│ │ [View Cart] │
│ │  [Qty: 1] [Add to Cart]  │ │ [Checkout]  │
│ │  ▼ More details...       │ │             │
│ └──────────────────────────┘ │             │
└──────────────────────────────┴─────────────┘
```

### Features:

**Sticky Filter Bar:**
- Search input
- Availability chips (All, In Stock, Low Stock, Backorder)
- Price range sliders
- Sort dropdown (Relevance, Price: Low-High, Price: High-Low, Part Number)

**Results Table:**
- Columns: Part No (LRNo + JagAlt badge), Description (2-line clamp), Price, Availability + ETA, Qty Stepper, Add Button
- Row expansion: Shows supersession info, notes, image placeholder
- Empty state: "No results found" with suggestions
- Loading state: Skeleton rows

**Cart Preview Panel (Right Sticky):**
- Last 5 added items
- Subtotal
- "View Cart" button
- "Proceed to Checkout" button

---

## 🛒 TASK 6 — Cart Page

**File**: `src/app/dealer/cart/page.tsx`

### Layout:

```
┌────────────────────────────────────┬──────────────┐
│ Shopping Cart                      │ Order Summary│
├────────────────────────────────────┤ (Sticky)     │
│ Cart Table:                        │              │
│ ┌────────────────────────────────┐ │ Subtotal:    │
│ │ Part │ Desc │ Price │ Qty │ × │ │ £484.96      │
│ ├────────────────────────────────┤ │              │
│ │ LR123│Brake │ £89   │[4]│ × │ │ VAT (20%):   │
│ │ LR234│Oil   │ £12.50│[10]│ × │ │ £96.99       │
│ └────────────────────────────────┘ │              │
│                                    │ Total:       │
│                                    │ £581.95      │
│                                    │              │
│                                    │ [Checkout]   │
└────────────────────────────────────┴──────────────┘
```

### Features:
- Inline qty editing (stepper or input)
- Remove button (× icon)
- Order summary panel: Subtotal, VAT (optional), Total
- "Proceed to Checkout" CTA button
- Empty state: "Your cart is empty" with "Browse Parts" link

---

## ✅ TASK 7 — Checkout Flow (3-Step)

### Step 1: Dispatch Method

**File**: `src/app/dealer/checkout/page.tsx`

```
┌─────────────────────────────────────┐
│ Checkout (Step 1 of 3)              │
│ ● Dispatch  ○ Review  ○ Confirm     │
├─────────────────────────────────────┤
│ Choose Dispatch Method:             │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ ○ Standard Delivery        FREE │ │
│ │   Next working day              │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ ○ Express Delivery       £15.00 │ │
│ │   Same day (order before 12pm)  │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ ○ Click & Collect          FREE │ │
│ │   Same day pickup               │ │
│ └─────────────────────────────────┘ │
│                                     │
│ PO Reference (optional): [_______] │
│ Notes (optional): [______________] │
│                                     │
│            [Cancel] [Continue →]   │
└─────────────────────────────────────┘
```

### Step 2: Review Order

```
┌─────────────────────────────────────┐
│ Checkout (Step 2 of 3)              │
│ ○ Dispatch  ● Review  ○ Confirm     │
├─────────────────────────────────────┤
│ Order Summary (Read-only)           │
│                                     │
│ Dispatch: Standard Delivery (FREE)  │
│ PO Ref: ABC123                      │
│                                     │
│ Items:                              │
│ • Brake Pad Kit × 4     £359.96     │
│ • Oil Filter × 10       £125.00     │
│                                     │
│ Subtotal:               £484.96     │
│ VAT (20%):              £96.99      │
│ Delivery:               FREE        │
│ ─────────────────────────           │
│ Total:                  £581.95     │
│                                     │
│ ⚠️ Email Warning (if applicable):   │
│ "Your email may not be deliverable" │
│ (Non-blocking - can still submit)   │
│                                     │
│          [← Back] [Confirm Order]   │
└─────────────────────────────────────┘
```

### Step 3: Confirmation

```
┌─────────────────────────────────────┐
│ Checkout (Step 3 of 3)              │
│ ○ Dispatch  ○ Review  ● Confirm     │
├─────────────────────────────────────┤
│       ✅ Order Confirmed!            │
│                                     │
│   Your order number:                │
│   ORD-2026-123                      │
│                                     │
│ We've sent a confirmation email to  │
│ your registered address.            │
│                                     │
│ What happens next:                  │
│ ✓ Order processing (within 1 hour)  │
│ ✓ Dispatch notification             │
│ ✓ Delivery tracking                 │
│                                     │
│ [View Order Details]                │
│ [Continue Shopping]                 │
└─────────────────────────────────────┘
```

---

## 📦 TASK 8 — Orders List + Order Detail

### Orders List Page

**File**: `src/app/dealer/orders/page.tsx`

```
┌─────────────────────────────────────────────────┐
│ My Orders                                        │
├─────────────────────────────────────────────────┤
│ Filters:                                        │
│ [Last 7 days] [Last 30 days] [Last 90 days]    │
│ Status: [All ▼]  Search: [__________] 🔍       │
├─────────────────────────────────────────────────┤
│ Orders Table:                                   │
│ ┌───────────────────────────────────────────┐  │
│ │ Order No │ Date  │ Items │ Total │ Status │  │
│ ├───────────────────────────────────────────┤  │
│ │ ORD-001  │ Jan17 │   2   │ £581  │ ●●●    │  │
│ │ ORD-002  │ Jan15 │   1   │ £510  │ ✓✓✓    │  │
│ └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

### Order Detail Page

**File**: `src/app/dealer/orders/[id]/page.tsx`

```
┌─────────────────────────────────────────────────┐
│ ← Back to Orders                                 │
│                                                  │
│ Order ORD-2026-001                               │
│ Status: Processing  •  Placed: Jan 17, 2026      │
│ [Download PDF]                                   │
├─────────────────────────────────────────────────┤
│ Timeline:                                        │
│ ● Order Placed         Jan 17, 10:30 AM          │
│ ● Processing           Jan 17, 11:00 AM          │
│ ○ Dispatched           Pending                   │
│ ○ Delivered            Pending                   │
├─────────────────────────────────────────────────┤
│ Order Items:                                     │
│ ┌─────────────────────────────────────────┐     │
│ │ Part    │ Description  │ Qty │ Price    │     │
│ ├─────────────────────────────────────────┤     │
│ │ LR12345 │ Brake Pad... │  4  │ £359.96  │     │
│ │ LR23456 │ Oil Filter.. │ 10  │ £125.00  │     │
│ └─────────────────────────────────────────┘     │
│                                                  │
│ Subtotal:  £484.96                               │
│ VAT:       £96.99                                │
│ Total:     £581.95                               │
│                                                  │
│ Dispatch: Standard Delivery                      │
│ PO Ref: ABC123                                   │
└─────────────────────────────────────────────────┘
```

### Process Order Page

**File**: `src/app/dealer/process-order/page.tsx` (or tab)

```
┌─────────────────────────────────────────────────┐
│ Order ORD-2026-001                               │
├─────────────────────────────────────────────────┤
│   Status Hero Card:                              │
│   🔄 Order Processing                            │
│   Expected dispatch: Today by 5pm                │
├─────────────────────────────────────────────────┤
│ What happens next:                               │
│ ✓ Order received and confirmed                   │
│ ● Items being picked and packed   ← Current      │
│ ○ Quality check                                  │
│ ○ Dispatch and tracking                          │
│ ○ Delivery                                       │
├─────────────────────────────────────────────────┤
│ Need help?                                       │
│ [Contact Support] [Download Summary]             │
└─────────────────────────────────────────────────┘
```

---

## 📱 TASK 9 — Responsive + Accessibility

### Mobile Breakpoints:
- **Mobile**: < 768px (use BottomNav, hide SideNav)
- **Tablet**: 768px - 1024px
- **Desktop**: ≥ 1024px (show SideNav, hide BottomNav)

### Accessibility Checklist:

✅ **Keyboard Navigation:**
- Tab order is logical
- All interactive elements are focusable
- Enter/Space activates buttons
- ESC closes modals/drawers

✅ **Focus Management:**
- Visible focus rings (ring-2 ring-blue-500)
- Focus trap in MessageDrawer
- Focus returns to trigger after close

✅ **ARIA Attributes:**
- `aria-label` on icon-only buttons
- `aria-expanded` on dropdowns
- `role="button"` on clickable divs
- `aria-live` for announcements

✅ **Screen Readers:**
- Semantic HTML (`<nav>`, `<main>`, `<aside>`)
- Alt text on images
- Table headers with `scope`

✅ **Color Contrast:**
- WCAG AA compliance (4.5:1 for text)
- Don't rely on color alone for status

---

## 🎨 TASK 10 — UI Polish

### Design System Consistency:

**Button Hierarchy:**
```tsx
// Primary CTA
<Button className="bg-blue-600 hover:bg-blue-700 text-white">
  Checkout
</Button>

// Secondary
<Button variant="outline">
  Cancel
</Button>

// Tertiary/Ghost
<Button variant="ghost">
  View Details
</Button>

// Destructive
<Button variant="destructive">
  Remove
</Button>
```

**Spacing:**
- Card padding: `p-6`
- Section gaps: `space-y-6` or `space-y-8`
- Content max-width: `max-w-7xl` or `max-w-[1440px]`

**Shadows:**
- Cards: `shadow-sm hover:shadow-md`
- Dropdowns/Popovers: `shadow-lg`
- Modals: `shadow-xl`

**Typography:**
- Page title: `text-3xl font-bold text-slate-900`
- Section heading: `text-xl font-semibold text-slate-800`
- Body: `text-sm text-slate-600`
- Labels: `text-sm font-medium text-slate-700`

**Transitions:**
- Hover states: `transition-colors duration-200`
- Slide-ins: `transition-transform duration-300`
- Fade-ins: `transition-opacity duration-200`

---

## 📋 Implementation Checklist

### Core Infrastructure:
- ✅ Theme tokens file
- ✅ Mock data providers
- ✅ API service interface
- ✅ AppShell layout
- ⏳ MessageDrawer component
- ⏳ SideNav component
- ⏳ BottomNav component
- ⏳ StatusChip component
- ⏳ Table component with density

### Pages:
- ⏳ Dashboard (KPI cards, recent orders, news feed)
- ⏳ Search Parts (filters, results, cart preview)
- ⏳ Cart (table with inline edit, order summary)
- ⏳ Checkout (3 steps: dispatch, review, confirm)
- ⏳ Orders List (filters, search, table)
- ⏳ Order Detail (timeline, items, download)
- ⏳ Process Order (status hero, checklist)
- ⏳ Account Settings

### Polish:
- ⏳ Mobile responsive (BottomNav)
- ⏳ Accessibility audit
- ⏳ Loading states (skeletons)
- ⏳ Empty states
- ⏳ Error states
- ⏳ Toast notifications integration
- ⏳ Final design review

---

## Next Steps

1. **Build Core Components** (MessageDrawer, SideNav, BottomNav, StatusChip, Table)
2. **Enhance Dashboard Page** (KPI cards, news feed)
3. **Build Search Page** (filters, cart preview)
4. **Build Checkout Flow** (3-step wizard)
5. **Build Order Pages** (list, detail, process-order)
6. **Mobile Polish** (BottomNav, responsive tables)
7. **Accessibility Pass** (keyboard nav, ARIA, focus management)
8. **Final UI Polish** (consistent spacing, shadows, transitions)

---

**Status:** Foundation complete, building core components next.
