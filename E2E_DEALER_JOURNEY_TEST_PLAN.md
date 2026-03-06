# End-to-End Dealer Journey Test Plan

## Overview

This document provides a comprehensive test plan for the dealer journey from login to order placement.

---

## Test Environment Setup

### Prerequisites

1. **Database**: PostgreSQL with seeded data
   - At least 1 dealer account with tier assignments
   - At least 10 products with pricing (Net1-Net7)
   - Optional: Special prices for testing price override

2. **Services Running**:

   ```bash
   # Terminal 1: API Server
   cd apps/api
   pnpm dev
   # Should start on http://localhost:3001

   # Terminal 2: Web App
   cd apps/web
   pnpm dev
   # Should start on http://localhost:3000
   ```

3. **Test Dealer Credentials**:
   - Email: (from dealer seed data)
   - Password: (temp password from import)
   - Account should have 3 tier assignments (GENUINE, AFTERMARKET, BRANDED)

---

## Journey 1: Login → Search → Add to Cart → Checkout

### Step 1: Dealer Login

**URL**: `http://localhost:3000/dealer/login`

**Actions**:

1. Enter dealer email
2. Enter password
3. Click "Login"

**Expected Result**:

- ✅ Redirected to `/dealer/dashboard` or `/dealer/search`
- ✅ JWT token stored in localStorage
- ✅ Auth header included in API requests

**Verification**:

```javascript
// Open browser console
localStorage.getItem("token"); // Should return JWT token
```

**API Call**:

```
POST /auth/login
Body: { email, password }
Response: { token, user: { role: 'DEALER', dealerAccountId, dealerUserId } }
```

---

### Step 2: Product Search

**URL**: `http://localhost:3000/dealer/search`

**Actions**:

1. Enter search query (e.g., "brake")
2. Select filters (optional):
   - Part Type: All / GENUINE / AFTERMARKET / BRANDED
   - Stock: All / In Stock
3. View results table

**Expected Result**:

- ✅ Products displayed in table
- ✅ Columns: Code, Description, Part Type, Stock, Price, Actions
- ✅ Prices calculated using PricingService (special price → net tier → fallback)
- ✅ "Add to Cart" button enabled for priced products

**Verification**:

```
Products should show:
- yourPrice: number (from PricingService)
- priceSource: 'SPECIAL_PRICE' | 'NET_TIER' | 'FALLBACK_BAND'
```

**API Call**:

```
GET /dealer/search?q=brake&limit=20
Response: {
  results: [
    {
      id, productCode, description, partType,
      freeStock, yourPrice, priceSource, tierCode, available
    }
  ],
  pagination: { total, limit, offset, hasMore }
}
```

**Current Status**: ✅ Route exists, needs pricing integration

---

### Step 3: Add Product to Cart

**Actions**:

1. Click "Add to Cart" on a product
2. Observe toast notification
3. Check cart icon badge (item count)

**Expected Result**:

- ✅ Toast: "Item added to cart"
- ✅ Cart badge shows item count
- ✅ Product added to dealer's cart in database

**Verification**:

```
Cart should contain:
- CartItem with productId, qty, yourPrice (current price)
```

**API Call**:

```
POST /dealer/cart/items
Body: { productId: "uuid", qty: 1 }
Response: {
  cart: {
    items: [{ id, productId, qty, product: {...}, yourPrice, lineTotal }],
    subtotal
  }
}
```

**Current Status**: ✅ Endpoint exists in `dealer.ts`

---

### Step 4: View Cart

**URL**: `http://localhost:3000/dealer/cart`

**Actions**:

1. Navigate to cart page
2. Observe cart items
3. Check prices are current (refreshed)

**Expected Result**:

- ✅ Cart items displayed
- ✅ Prices refreshed with current pricing (special prices, tier changes)
- ✅ Quantity is editable
- ✅ Remove button works
- ✅ Subtotal calculates correctly

**Verification**:

```
On cart load:
1. GET /dealer/cart called
2. Prices refreshed using current tier/special prices
3. If dealer tier changed → prices update
4. If special price became active → price updates
```

**API Call**:

```
GET /dealer/cart
Response: {
  id, dealerAccountId, dealerUserId,
  items: [{
    id, productId, qty,
    product: { productCode, description, partType },
    yourPrice, lineTotal
  }],
  subtotal
}
```

**Current Status**: ✅ Endpoint exists, CartService uses pricingRules

**Update Needed**: CartService should use new PricingService for price refresh

---

### Step 5: Update Cart Item Quantity

**Actions**:

1. Change quantity in cart (e.g., 1 → 3)
2. Observe optimistic update
3. Wait for API confirmation

**Expected Result**:

- ✅ Quantity updates immediately (optimistic)
- ✅ Line total recalculates
- ✅ Subtotal updates
- ✅ If API fails, rollback to previous value

**API Call**:

```
PATCH /dealer/cart/items/:itemId
Body: { qty: 3 }
Response: { cart: {...} } (updated cart)
```

**Current Status**: ✅ Endpoint exists with optimistic updates in useCart

---

### Step 6: Remove Cart Item

**Actions**:

1. Click "Remove" on cart item
2. Observe optimistic removal
3. Confirm API success

**Expected Result**:

- ✅ Item removed immediately (optimistic)
- ✅ Subtotal recalculates
- ✅ Toast: "Item removed from cart"

**API Call**:

```
DELETE /dealer/cart/items/:itemId
Response: { cart: {...} } (updated cart)
```

**Current Status**: ✅ Endpoint exists with optimistic updates

---

### Step 7: Proceed to Checkout

**URL**: `http://localhost:3000/dealer/checkout`

**Actions**:

1. Click "Checkout" from cart
2. Observe cart summary
3. Select shipping method (DELIVERY / COLLECTION)
4. Enter PO reference (optional)
5. Enter notes (optional)
6. Click "Place Order"

**Expected Result**:

- ✅ Cart items displayed in checkout summary
- ✅ Prices shown (current prices at checkout time)
- ✅ Shipping method selector works
- ✅ Form validates correctly
- ✅ Order created with SUSPENDED status

**Verification**:

```
Order creation should:
1. Snapshot prices at checkout time
2. Store unitPriceSnapshot on OrderLine (IMMUTABLE)
3. Create OrderHeader with SUSPENDED status
4. Create OrderExportLine for ERP integration
5. Clear dealer's cart
6. Redirect to order confirmation
```

**API Call**:

```
POST /dealer/checkout
Body: {
  dispatchMethod: "DELIVERY",
  poRef: "PO-12345",
  notes: "Urgent delivery"
}
Response: {
  success: true,
  order: {
    id, orderNo, status: 'SUSPENDED',
    subtotal, total, currency,
    lines: [{ id, productCode, qty, unitPrice (snapshotted), lineTotal }]
  }
}
```

**Current Status**: ✅ Checkout page exists, needs Phase 5 endpoint

**Update Needed**: Connect to `/api/dealer/checkout` endpoint

---

### Step 8: View Order Confirmation

**URL**: `http://localhost:3000/dealer/orders/:orderId` (or confirmation page)

**Expected Result**:

- ✅ Order number displayed
- ✅ Order status: SUSPENDED
- ✅ Order lines with snapshotted prices
- ✅ Total amount
- ✅ Order date
- ✅ Shipping method

**Verification**:

```
OrderLine.unitPriceSnapshot should:
- Match price at checkout time
- NEVER change (even if dealer tier changes later)
- Be the price dealer actually paid
```

---

## Journey 2: View Order History

### Step 9: View All Orders

**URL**: `http://localhost:3000/dealer/orders`

**Actions**:

1. Navigate to orders page
2. View order list
3. Filter by status (optional)
4. Click order to view details

**Expected Result**:

- ✅ Orders displayed in table
- ✅ Columns: Order No, Status, Total, Date, Line Count
- ✅ Can filter by status
- ✅ Pagination works
- ✅ Click to view details

**API Call**:

```
GET /dealer/orders?limit=20&offset=0&status=SUSPENDED
Response: {
  orders: [{
    id, orderNo, status, subtotal, total, currency,
    dispatchMethod, poRef, notes, createdAt, updatedAt,
    lineCount, lines: [...]
  }],
  pagination: { total, limit, offset, hasMore }
}
```

**Current Status**: ⏳ Orders page exists, needs Phase 5 endpoint connection

---

### Step 10: Export Orders to CSV

**Actions**:

1. Click "Export Orders" button
2. Observe file download

**Expected Result**:

- ✅ CSV file downloads
- ✅ Filename: `orders-export-{timestamp}.csv`
- ✅ Contains: Order No, Account No, Line Type, Product Code, Description, Part Type, Qty, Unit Price, Created At, Status

**API Call**:

```
GET /dealer/orders/export
Response: CSV file (Content-Type: text/csv)
```

**Current Status**: ⏳ Needs export button added to UI

---

## Journey 3: View Backorders

### Step 11: View Backorders

**URL**: `http://localhost:3000/dealer/backorders`

**Actions**:

1. Navigate to backorders page
2. View backorder list
3. Click "Export" button (if available)

**Expected Result**:

- ✅ Backorders displayed in table
- ✅ Columns: Order No, Part Code, Description, Qty Ordered, Qty Outstanding, Order Value
- ✅ Filtered by dealer's account number
- ✅ Shows active dataset only

**API Call**:

```
GET /dealer/backorders
Response: {
  backorders: [{
    id, accountNo, orderNo, orderDate, partCode, description,
    qtyOrdered, qtyOutstanding, orderValue
  }],
  datasetId, datasetCreatedAt
}
```

**Current Status**: ✅ Backorders page exists, endpoint exists

---

### Step 12: Export Backorders to CSV

**Actions**:

1. Click "Export Backorders" button
2. Observe file download

**Expected Result**:

- ✅ CSV file downloads
- ✅ Filename: `backorders-export-{timestamp}.csv`

**API Call**:

```
GET /dealer/backorders/export
Response: CSV file (Content-Type: text/csv)
```

**Current Status**: ⏳ Needs export button added to UI

---

## Critical Test Scenarios

### Scenario 1: Price Changes Don't Affect Historical Orders

**Setup**:

1. Add product to cart (price: £100, Net3 tier)
2. Place order → OrderLine.unitPriceSnapshot = £100
3. Admin changes dealer tier: Net3 → Net5 (new price: £80)
4. View historical order

**Expected Result**:

- ✅ Historical order still shows £100 (unitPriceSnapshot)
- ✅ New cart items show £80 (current Net5 price)
- ✅ Order total never changes

**Verification**:

```sql
SELECT
  oh."orderNo",
  ol."unitPriceSnapshot",
  p."productCode",
  oh."createdAt"
FROM "OrderLine" ol
JOIN "OrderHeader" oh ON ol."orderHeaderId" = oh."id"
JOIN "Product" p ON ol."productId" = p."id"
WHERE oh."dealerAccountId" = '<dealer-id>';

-- unitPriceSnapshot should NEVER change
```

---

### Scenario 2: Special Price Overrides Tier Price

**Setup**:

1. Product has Net3 price: £100
2. Admin uploads special price: £75 (active 2026-02-01 to 2026-02-28)
3. Dealer searches product in February 2026

**Expected Result**:

- ✅ Search shows £75 (priceSource: 'SPECIAL_PRICE')
- ✅ Add to cart → yourPrice = £75
- ✅ Checkout → unitPriceSnapshot = £75
- ✅ After Feb 28 → price returns to £100 (Net3 tier)

---

### Scenario 3: Cart Price Refresh on Reload

**Setup**:

1. Add product to cart (current price: £100)
2. Admin uploads special price: £80 (active today)
3. Reload cart page

**Expected Result**:

- ✅ Cart shows updated price: £80
- ✅ priceSource updated to 'SPECIAL_PRICE'
- ✅ Subtotal recalculates with new price

---

### Scenario 4: Superseded Part Search

**Setup**:

1. Admin uploads supersession: PART-OLD → PART-NEW
2. Dealer searches for "PART-OLD"

**Expected Result**:

- ✅ Search returns PART-NEW
- ✅ Supersession banner: "Part PART-OLD has been superseded by PART-NEW"
- ✅ Pricing shown for PART-NEW

**Current Status**: ⏳ Needs supersession integration in search

---

## API Endpoint Checklist

### Dealer Endpoints

- ✅ `POST /auth/login` - Login dealer
- ✅ `GET /dealer/search` - Search products with pricing
- ✅ `GET /dealer/product/:code` - Get product detail
- ✅ `GET /dealer/cart` - Get cart with refreshed prices
- ✅ `POST /dealer/cart/items` - Add to cart
- ✅ `PATCH /dealer/cart/items/:id` - Update quantity
- ✅ `DELETE /dealer/cart/items/:id` - Remove from cart
- ⏳ `POST /dealer/checkout` - Create order (Phase 5 endpoint)
- ⏳ `GET /dealer/orders` - List orders (Phase 5 endpoint)
- ⏳ `GET /dealer/orders/export` - Export orders CSV (Phase 5 endpoint)
- ✅ `GET /dealer/backorders` - List backorders
- ⏳ `GET /dealer/backorders/export` - Export backorders CSV (Phase 5 endpoint)

---

## UI Component Checklist

### Pages

- ✅ `/dealer/login` - Login page
- ✅ `/dealer/search` - Search page with table
- ✅ `/dealer/cart` - Cart page with items
- ✅ `/dealer/checkout` - Checkout page with shipping selector
- ✅ `/dealer/orders` - Orders list page
- ✅ `/dealer/orders/:id` - Order detail page
- ✅ `/dealer/backorders` - Backorders list page

### Components

- ✅ `useCart` hook - Cart management with API integration
- ✅ Search table - Product results display
- ✅ Cart table - Cart items with quantity update
- ✅ Checkout form - Shipping method + PO ref + notes
- ⏳ Export buttons - Download CSV (orders, backorders)
- ⏳ Supersession banner - Show superseded part notice

---

## Known Issues & Fixes Needed

### High Priority

1. **Checkout Endpoint**: Connect `/dealer/checkout` to Phase 5 endpoint
   - File: `apps/web/src/app/dealer/checkout/page.tsx`
   - Change: Update checkout handler to call `/api/dealer/checkout`

2. **Orders Page**: Connect `/dealer/orders` to Phase 5 endpoint
   - File: `apps/web/src/app/dealer/orders/page.tsx`
   - Change: Update useQuery to fetch from `/api/dealer/orders`

3. **Export Buttons**: Add export functionality
   - Files: `apps/web/src/app/dealer/orders/page.tsx`, `backorders/page.tsx`
   - Change: Add export buttons calling `/api/dealer/orders/export`

4. **Cart Price Refresh**: Use PricingService instead of pricingRules
   - File: `apps/api/src/services/CartService.ts`
   - Change: Replace `pricingRules.calculatePrices` with `pricingService.resolvePrices`

### Medium Priority

5. **Supersession in Search**: Show supersession info
   - File: `apps/web/src/app/dealer/search/page.tsx`
   - Change: Display supersession banner when part is superseded

6. **Price Source Indicator**: Show where price comes from
   - File: `apps/web/src/app/dealer/cart/page.tsx`
   - Change: Add badge showing "Special Price" or "Net Tier"

### Low Priority

7. **Password Reset**: Add forgot password flow
   - Files: Create reset password pages
   - Endpoints: Already exist in Phase 5

---

## Success Criteria

End-to-end test passes when:

1. ✅ Dealer can login
2. ✅ Dealer can search products with current pricing
3. ✅ Dealer can add products to cart
4. ✅ Cart prices refresh on reload
5. ✅ Dealer can checkout and create order
6. ✅ Order prices are snapshotted (immutable)
7. ✅ Dealer can view order history
8. ✅ Historical orders show original prices
9. ✅ Dealer can export orders to CSV
10. ✅ Dealer can view and export backorders
11. ✅ Special prices override tier prices
12. ✅ Tier changes don't affect historical orders

---

## Test Data Setup

### Required Database Seed Data

```sql
-- 1. Dealer Account with Tier Assignments
INSERT INTO "DealerAccount" (id, "accountNo", "companyName", status, entitlement)
VALUES ('dealer-1', 'D-001', 'Test Dealer Ltd', 'ACTIVE', 'ALL');

-- 2. App User
INSERT INTO "AppUser" (id, email, "passwordHash", "isActive", role)
VALUES ('user-1', 'dealer@test.com', '<bcrypt-hash>', true, 'DEALER');

-- 3. Dealer User
INSERT INTO "DealerUser" (id, "userId", "dealerAccountId", "firstName", "lastName")
VALUES ('dealer-user-1', 'user-1', 'dealer-1', 'Test', 'Dealer');

-- 4. Tier Assignments (3 required)
INSERT INTO "DealerBandAssignment" ("dealerAccountId", "partType", "tierCode")
VALUES
  ('dealer-1', 'GENUINE', 'Net3'),
  ('dealer-1', 'AFTERMARKET', 'Net4'),
  ('dealer-1', 'BRANDED', 'Net5');

-- 5. Products with Pricing
INSERT INTO "Product" (id, "productCode", description, "partType", "discountCode", "isActive")
VALUES
  ('prod-1', 'BRAKE-001', 'Brake Pad Set', 'GENUINE', 'gn', true),
  ('prod-2', 'FILTER-001', 'Oil Filter', 'AFTERMARKET', 'es', true);

-- 6. Product Net Prices
INSERT INTO "ProductNetPrice" ("productId", "tierCode", price)
VALUES
  ('prod-1', 'Net3', 100.00),
  ('prod-2', 'Net4', 25.00);

-- 7. Product Stock
INSERT INTO "ProductStock" ("productId", "freeStock")
VALUES
  ('prod-1', 50),
  ('prod-2', 100);
```

---

**End of E2E Test Plan**

Last Updated: 2026-01-18
Status: Ready for Testing
