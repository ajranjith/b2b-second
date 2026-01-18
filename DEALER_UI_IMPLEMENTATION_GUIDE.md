# Dealer Portal UI - Implementation Guide

**Phase 1 Implementation Status**

## ✅ Completed Components (Tasks 1-3)

### Task 1: Project Structure ✅
**Created comprehensive foundation for the dealer portal:**

#### 📁 Folder Structure
```
apps/web/src/
├── styles/
│   └── tokens.ts                    # Design system tokens
├── types/
│   └── dealer.ts                    # TypeScript definitions
├── mocks/
│   └── dealer-data.ts               # Mock data for development
├── services/
│   └── dealer-api.ts                # API service layer
├── components/
│   ├── layouts/                     # Layout components
│   │   ├── AppShell.tsx
│   │   ├── DealerHeader.tsx
│   │   ├── SideNav.tsx
│   │   ├── BottomNav.tsx
│   │   └── index.ts
│   └── global/                      # Global UI components
│       ├── AnnouncementTicker.tsx
│       ├── MessageDrawer.tsx
│       ├── StatusChip.tsx
│       ├── DataTable.tsx
│       ├── toast-utils.ts
│       └── index.ts
```

#### 🎨 Design Tokens ([tokens.ts](apps/web/src/styles/tokens.ts))
- **Spacing**: xs (4px) → 4xl (96px), semantic container/section spacing
- **Border Radius**: sm (4px) → full (9999px)
- **Typography**: Font scales, weights, letter spacing
- **Layout**: Header (72px), Ticker (40px), SideNav (260px), BottomNav (64px)
- **Z-Index**: Layered elevation system (base → toast)
- **Shadows**: sm → xl + inner
- **Transitions**: Duration (fast/base/slow) + timing functions
- **Breakpoints**: xs (375px) → 2xl (1440px)
- **Table Density**: Comfortable vs Dense padding/sizing
- **Animation**: Ticker rotation timing

#### 📝 TypeScript Types ([types/dealer.ts](apps/web/src/types/dealer.ts))
- `Announcement` + `AnnouncementType` (info/promo/warning/urgent)
- `Product`, `Cart`, `CartItem`
- `Order`, `OrderLineItem`, `OrderStatus`, `OrderTimelineEvent`
- `StockStatus` (in_stock/low_stock/backorder/unknown)
- `DispatchMethod` + `DispatchOption`
- `Dealer`, `DashboardKPI`, `NewsItem`
- `SearchFilters`, `TableDensity`
- `ApiResponse<T>`, `PaginatedResponse<T>`
- `LoadingState`, `ToastMessage`

#### 🔌 API Services ([services/dealer-api.ts](apps/web/src/services/dealer-api.ts))
**Complete API interface layer:**
- `announcementAPI`: Get all, mark as read
- `productAPI`: Search with filters, get by part number, check availability
- `cartAPI`: Get, add item, update item, remove item, clear
- `orderAPI`: Get all, get by ID, create, download invoice, get backorders
- `dashboardAPI`: Get KPIs, recent orders, news
- `accountAPI`: Get/update profile, download statement

#### 🗂️ Mock Data ([mocks/dealer-data.ts](apps/web/src/mocks/dealer-data.ts))
- `mockAnnouncements` (4 items: info, promo, warning, urgent)
- `mockProducts` (5 items with various statuses)
- `mockOrders` (3 orders in different states)
- `mockDashboardKPI` (backorders, orders in progress, account balance)
- `mockNewsItems` (3 news items)
- `mockDispatchOptions` (standard, express, collection)
- `mockDealer` (sample dealer profile)

---

### Task 2: AppShell Layout ✅
**Built responsive layout system:**

#### [AppShell.tsx](apps/web/src/components/layouts/AppShell.tsx)
**Main layout wrapper with:**
- Sticky Header (72px desktop / 64px mobile)
- Optional Announcement Ticker (40px desktop / 36px mobile)
- Body split: SideNav (260px) + Content area (max-width 1440px)
- Optional Bottom Nav (64px, mobile only)
- Content padding: 24px mobile, 32px desktop
- Flexible max-width support (comfortable 1280px / full 1440px)

**Helper components:**
- `AppShellContent`: Consistent padding and max-width wrapper
- `AppShellSection`: Consistent spacing between sections (small/medium/large)

#### [DealerHeader.tsx](apps/web/src/components/layouts/DealerHeader.tsx)
**Main header featuring:**
- Logo + "Dealer Portal" branding
- Global search input (Part No / JagAlt / Description)
- Help/Contact button
- Cart icon with badge count (shows 99+ for >99 items)
- User dropdown menu (Account, My Orders, Logout)
- Mobile menu toggle
- Responsive: search hidden on mobile, full layout on desktop

#### [SideNav.tsx](apps/web/src/components/layouts/SideNav.tsx)
**Left sidebar navigation (desktop only):**
- Links: Dashboard, Search Parts, Cart, Orders, Backorders, Account
- Active state highlighting (blue background for current page)
- Badge support (cart count, backorder count)
- Icon + label layout
- Help & Support link at bottom
- Hover states with smooth transitions

#### [BottomNav.tsx](apps/web/src/components/layouts/BottomNav.tsx)
**Mobile bottom navigation:**
- 5 primary items: Dashboard, Search, Cart, Orders, Account
- Active state with icon scale effect
- Cart badge support
- Fixed to bottom, hidden on desktop (lg+)
- Icon + label vertical layout

---

### Task 3: Global Components ✅
**Built reusable UI components:**

#### [AnnouncementTicker.tsx](apps/web/src/components/global/AnnouncementTicker.tsx)
**Auto-rotating announcement banner:**
- Displays announcements sorted by priority
- Auto-rotates every 8 seconds (configurable)
- Pauses on hover/keyboard focus
- Click opens MessageDrawer with full details
- Type chips: info (blue), promo (green), warning (amber), urgent (red)
- Pagination dots for multiple announcements
- Dismiss button
- Keyboard accessible (Enter/Space to activate)
- Loading skeleton included

#### [MessageDrawer.tsx](apps/web/src/components/global/MessageDrawer.tsx)
**Right-side message detail drawer:**
- 480px width on desktop, full screen on mobile
- Shows full announcement with icon, type badge, timestamp
- Displays attachments with download buttons
- "View More Details" link (if linkTarget provided)
- Focus trap for accessibility
- ESC key + overlay click to close
- Prevents body scroll when open
- Smooth slide-in animation

#### [StatusChip.tsx](apps/web/src/components/global/StatusChip.tsx)
**Consistent status badges:**
- `OrderStatusChip`: submitted, processing, completed, cancelled
- `StockStatusChip`: in_stock (with quantity), low_stock, backorder, unknown
- `StatusChip`: Generic with variants (info, success, warning, error, neutral)
- Subtle color accents (50 bg, 700 text, 200 border)
- Consistent with design system

#### [DataTable.tsx](apps/web/src/components/global/DataTable.tsx)
**Enhanced table component:**
- **Density Toggle**: Switch between comfortable/dense views
  - Comfortable: py-4 px-4, larger text
  - Dense: py-2 px-3, compact text
- Generic column configuration
- Row click handler support
- Custom cell rendering
- Empty state message
- Loading skeleton (`DataTableSkeleton`)
- Hover states on rows
- Responsive rounded border design

#### [toast-utils.ts](apps/web/src/components/global/toast-utils.ts)
**Toast notification wrapper:**
- `showToast.success()`, `.error()`, `.warning()`, `.info()`
- `showToast.loading()` - returns ID for dismissal
- `showToast.promise()` - handles async operations
- `commonToasts` - pre-configured messages:
  - Cart: addedToCart, removedFromCart, cartCleared
  - Orders: orderPlaced, orderCancelled
  - General: savedSuccessfully, deleteSuccess
  - Errors: networkError, serverError, notFound, unauthorized
  - Warnings: unsavedChanges, lowStock

---

## 🚧 Remaining Tasks (4-10)

### Task 4: Dashboard Page
**Components to build:**
- KPI cards row
  - Backorders count + download button
  - Orders in progress count
  - Account summary (balance / credit limit)
- Recent Orders table (last 10 with status chips)
- News/Updates feed (card list)
- Loading skeletons
- Empty states

**Files:**
- `apps/web/src/app/dealer/dashboard/page.tsx`
- `apps/web/src/components/dealer/DashboardKPICard.tsx`
- `apps/web/src/components/dealer/RecentOrdersTable.tsx`
- `apps/web/src/components/dealer/NewsFeed.tsx`

---

### Task 5: Search Parts Page
**Components to build:**
- Sticky in-page search/filter bar
  - Part No / JagAlt / Description search
  - Availability filters
  - Price range slider
  - Sort dropdown
- Results table with columns:
  - Part No (LRNo) + JagAlt badge
  - Description (2-line clamp)
  - Dealer Price
  - Availability chip + ETA
  - Qty Stepper
  - Add to Cart button
- Row expand panel (supersession, notes, image placeholder)
- Right sticky Cart Preview panel
  - Last 5 added items
  - Subtotal
  - View Cart + Checkout buttons
- States: empty, no results, loading

**Files:**
- `apps/web/src/app/dealer/search/page.tsx`
- `apps/web/src/components/dealer/SearchFilters.tsx`
- `apps/web/src/components/dealer/ProductResultsTable.tsx`
- `apps/web/src/components/dealer/CartPreview.tsx`

---

### Task 6: Cart Page
**Components to build:**
- Cart table with inline quantity editors
- Remove item buttons
- Sticky Order Summary panel
  - Subtotal
  - VAT (optional)
  - Total
  - Checkout CTA
- Empty cart state with "Browse Parts" link

**Files:**
- `apps/web/src/app/dealer/cart/page.tsx`
- `apps/web/src/components/dealer/CartTable.tsx`
- `apps/web/src/components/dealer/OrderSummary.tsx`

---

### Task 7: Checkout Flow (3-step)
**Components to build:**
- Step indicator (1→2→3)
- **Step 1: Dispatch Method**
  - Radio cards for dispatch options
  - Standard / Express / Collection
  - Show pricing and ETA
- **Step 2: Review Order**
  - Read-only line items table
  - Order totals
  - Confirm + Place Order button
- **Step 3: Confirmation**
  - Success card with order number
  - Download invoice button
  - View order details link
  - Continue shopping link
- Email warning state banner (non-blocking)

**Files:**
- `apps/web/src/app/dealer/checkout/page.tsx`
- `apps/web/src/components/dealer/CheckoutStepIndicator.tsx`
- `apps/web/src/components/dealer/DispatchMethodSelector.tsx`
- `apps/web/src/components/dealer/OrderReview.tsx`
- `apps/web/src/components/dealer/OrderConfirmation.tsx`

---

### Task 8: Orders List + Order Detail
**Components to build:**
- **Orders List:**
  - Filter chips: Last 7/30/90 days
  - Status dropdown filter
  - Search field (order number)
  - Orders table with columns:
    - Order Number
    - Date
    - Status chip
    - Items count
    - Total
    - Actions (View, Download Invoice)
- **Order Detail:**
  - Order header (number, date, status)
  - Timeline visualization
  - Line items table
  - Download invoice button
- **Process Order Tab:**
  - Status hero card
  - "What happens next" checklist
  - Contact support button
  - Download buttons

**Files:**
- `apps/web/src/app/dealer/orders/page.tsx`
- `apps/web/src/app/dealer/orders/[id]/page.tsx`
- `apps/web/src/components/dealer/OrdersFilterBar.tsx`
- `apps/web/src/components/dealer/OrdersTable.tsx`
- `apps/web/src/components/dealer/OrderDetailHeader.tsx`
- `apps/web/src/components/dealer/OrderTimeline.tsx`
- `apps/web/src/components/dealer/ProcessOrderView.tsx`

---

### Task 9: Responsive + Accessibility
**Improvements:**
- Mobile: Use BottomNav instead of SideNav
- Ensure ticker is keyboard accessible
- MessageDrawer focus trap working
- Tables responsive (horizontal scroll on mobile)
- Forms accessible (labels, ARIA attributes)
- Color contrast compliance (WCAG AA)
- Keyboard navigation throughout

---

### Task 10: Final UI Polish
**Refinements:**
- Consistent spacing using design tokens
- Typography hierarchy (headings, body, labels)
- Shadow depth consistency
- Button hierarchy clear:
  - Primary: CTA actions (Checkout, Add to Cart)
  - Secondary: Supporting actions (Cancel, Back)
  - Tertiary/Ghost: Low-priority actions (Close, Dismiss)
- Clean "eurospare-like" modern theme
- Smooth transitions and animations
- Loading states for all async operations
- Error boundaries for fault tolerance

---

## 🎯 Implementation Strategy

### Next Steps:
1. **Update dealer layout** to use new AppShell + components
2. **Build Dashboard page** (Task 4) - establishes patterns for other pages
3. **Build Search page** (Task 5) - most complex interactions
4. **Build Cart** (Task 6) → **Checkout** (Task 7) - complete purchase flow
5. **Build Orders** (Task 8) - order management
6. **Polish** (Tasks 9-10) - accessibility and final refinements

### File Organization:
```
apps/web/src/
├── app/dealer/                      # Next.js app routes
│   ├── dashboard/page.tsx           # Task 4
│   ├── search/page.tsx              # Task 5
│   ├── cart/page.tsx                # Task 6
│   ├── checkout/page.tsx            # Task 7
│   ├── orders/page.tsx              # Task 8
│   ├── orders/[id]/page.tsx         # Task 8
│   └── account/page.tsx             # Future
├── components/
│   ├── layouts/                     # ✅ Done (Task 2)
│   ├── global/                      # ✅ Done (Task 3)
│   └── dealer/                      # Tasks 4-8
└── styles/
    └── tokens.ts                    # ✅ Done (Task 1)
```

---

## 📋 Design System Reference

### Colors
- **Primary**: Blue (#3b82f6) - CTAs, active states
- **Success**: Green - in stock, completed
- **Warning**: Amber - low stock, processing
- **Error**: Red - backorder, cancelled, destructive actions
- **Neutral**: Slate - borders, muted text, backgrounds

### Spacing Scale
- xs: 4px, sm: 8px, md: 16px, lg: 24px, xl: 32px, 2xl: 48px, 3xl: 64px, 4xl: 96px

### Typography
- Headings: Fraunces (display font)
- Body: Sora (sans-serif)
- Mono: UI monospace

### Component Patterns
- **Cards**: White bg, slate border, lg radius, 24px padding
- **Buttons**: md radius, consistent padding, clear hierarchy
- **Inputs**: slate-50 bg, slate-200 border, focus ring
- **Tables**: Comfortable (16px padding) / Dense (8px padding)
- **Status**: Subtle chips with 50 bg, 700 text, 200 border

---

## 🚀 Usage Examples

### Using AppShell
```tsx
import { AppShell, DealerHeader, SideNav, BottomNav } from '@/components/layouts';
import { AnnouncementTicker } from '@/components/global';

export default function DealerLayout({ children }) {
  return (
    <AppShell
      header={<DealerHeader cartItemCount={5} />}
      ticker={<AnnouncementTicker announcements={mockAnnouncements} />}
      sideNav={<SideNav badgeCounts={{ cart: 5, backorders: 2 }} />}
      bottomNav={<BottomNav cartItemCount={5} />}
    >
      {children}
    </AppShell>
  );
}
```

### Using DataTable
```tsx
import { DataTable } from '@/components/global';

<DataTable
  columns={[
    { key: 'orderNumber', header: 'Order #', render: (o) => o.orderNumber },
    { key: 'status', header: 'Status', render: (o) => <OrderStatusChip status={o.status} /> },
  ]}
  data={orders}
  keyExtractor={(o) => o.id}
  allowDensityToggle
  onRowClick={(order) => router.push(`/dealer/orders/${order.id}`)}
/>
```

### Using Toasts
```tsx
import { showToast, commonToasts } from '@/components/global';

// Simple
showToast.success('Saved!', 'Your changes have been saved');

// Pre-configured
commonToasts.addedToCart('Oil Filter LR001234');

// Promise handling
showToast.promise(
  orderAPI.create({ dispatchMethod: 'standard' }),
  {
    loading: 'Placing order...',
    success: (order) => `Order ${order.orderNumber} placed!`,
    error: 'Failed to place order',
  }
);
```

---

## ✅ Quality Checklist

### Before marking complete:
- [ ] All TypeScript types properly defined
- [ ] Components use design tokens (not hardcoded values)
- [ ] Loading states for all async operations
- [ ] Empty states with helpful messaging
- [ ] Error states with recovery actions
- [ ] Keyboard navigation works
- [ ] Focus states visible
- [ ] Color contrast meets WCAG AA
- [ ] Mobile responsive (test on 375px width)
- [ ] Tables support density toggle
- [ ] Toasts provide user feedback
- [ ] Consistent spacing throughout

---

## 📚 Related Documentation
- Design Tokens: [apps/web/src/styles/tokens.ts](apps/web/src/styles/tokens.ts)
- Type Definitions: [apps/web/src/types/dealer.ts](apps/web/src/types/dealer.ts)
- API Services: [apps/web/src/services/dealer-api.ts](apps/web/src/services/dealer-api.ts)
- Mock Data: [apps/web/src/mocks/dealer-data.ts](apps/web/src/mocks/dealer-data.ts)
