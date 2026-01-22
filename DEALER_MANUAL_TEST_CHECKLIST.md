# Dealer Process Manual Testing Checklist

## Pre-Test Verification

### Environment Setup

- [ ] API server running on `http://localhost:3001`
- [ ] Web frontend running on `http://localhost:3000`
- [ ] Database is connected and seeded
- [ ] Test dealer account created (email: `dealer@example.com`, password: `password123`)
- [ ] At least 20 sample products exist in database
- [ ] Products have varying stock levels (some in stock, some out of stock)
- [ ] Products span all part types (GENUINE, BRANDED, AFTERMARKET)

## Phase 1: Dealer Authentication

### Login Flow

- [ ] Navigate to `/login`
- [ ] Enter dealer credentials (email: `dealer@example.com`, password: `password123`)
- [ ] Click "Login"
- [ ] Verify redirect to dealer dashboard or search page
- [ ] Verify authentication token is stored
- [ ] Verify user info shows dealer account name

### Session Persistence

- [ ] Refresh page - verify still logged in
- [ ] Close and reopen browser - verify session persists (if using persistent tokens)
- [ ] Click "Logout" - verify redirect to login page
- [ ] Try accessing protected routes - verify redirect to login

## Phase 2: Product Search & Discovery

### Basic Search

- [ ] Navigate to search page (`/dealer/search`)
- [ ] Type "bearing" in search box
- [ ] Press Enter or click Search
- [ ] Verify results appear within 2 seconds
- [ ] Each result shows: Product Code, Description, Stock, Price
- [ ] Results are sorted by relevance

### Search Filters - Part Type

- [ ] Set filter to "GENUINE PARTS"
- [ ] Verify only GENUINE products shown
- [ ] Set filter to "AFTERMARKET"
- [ ] Verify only AFTERMARKET products shown (or none if dealer doesn't have access)
- [ ] Set filter to "ALL PARTS"
- [ ] Verify mixed product types shown (based on entitlement)

### Search Filters - Stock Status

- [ ] Check "In Stock Only"
- [ ] Verify only products with Free Stock > 0 are shown
- [ ] Uncheck "In Stock Only"
- [ ] Verify backorder/out-of-stock products appear

### Search Sorting

- [ ] Sort by "Price - Low to High"
- [ ] Verify results ordered by price ascending
- [ ] Sort by "Price - High to Low"
- [ ] Verify results ordered by price descending
- [ ] Sort by "Stock Level"
- [ ] Verify results ordered by stock descending

### Search Entitlement Verification

- [ ] Search for all products
- [ ] **If dealer is GENUINE_ONLY**: Only see GENUINE products
- [ ] **If dealer is AFTERMARKET_ONLY**: See AFTERMARKET & BRANDED, but NOT GENUINE
- [ ] **If dealer is SHOW_ALL**: See all product types

## Phase 3: Product Details & Pricing

### View Product Detail

- [ ] Click on a product in search results
- [ ] Verify product detail page loads
- [ ] Verify all information shown: Code, Description, Stock, Trade Price, Your Price, Band

### Pricing Validation

- [ ] **Verify pricing is shown**: "Your Price" should never be blank (should show minimum price if applicable)
- [ ] **Verify band assignment**: Check band code matches dealer's band for this product type
- [ ] **Verify minimum price rule**: If minimum price applied, verify "Your Price" ≥ minimum
- [ ] **Verify discount structure**:
  - GENUINE products typically: trade > band1 > band2 > band3 > band4 ≥ minimum
  - Prices should show discount progression

### Stock Information

- [ ] Verify "Free Stock" is displayed
- [ ] Verify "Allocated Stock" is shown separately
- [ ] Verify "Available for Order" = Free Stock + can order beyond stock

### Product Unavailability Cases

- [ ] Find a product with no price assigned for this dealer
- [ ] Verify message indicates why product is unavailable (e.g., "Not entitled to view")
- [ ] Verify product still appears in search but cannot be added to cart

## Phase 4: Shopping Cart

### Cart Access

- [ ] Click on cart icon (usually top-right)
- [ ] Verify cart page/modal opens
- [ ] Verify empty cart shows "Your cart is empty"
- [ ] Verify "Continue Shopping" button available

### Adding Items to Cart

- [ ] From search results, click "Add to Cart" button on a product
- [ ] Verify quantity selector shows (default 1)
- [ ] Change quantity to 5
- [ ] Click "Add to Cart"
- [ ] Verify success message appears
- [ ] Verify mini-cart updates (shows 1 item or cumulative items)
- [ ] Verify cart total is shown

### Cart Display

- [ ] Open full cart view
- [ ] Verify all added items listed with:
  - Product Code
  - Description
  - Unit Price
  - Quantity
  - Line Total
  - Subtotal for each line
- [ ] Verify Cart Total is sum of all line totals
- [ ] Verify items are sorted by add order

### Modifying Cart Items

- [ ] Change quantity of first item from 5 to 10
- [ ] Verify line total updates (quantity × price)
- [ ] Verify cart total recalculates
- [ ] Change quantity back to 2
- [ ] Verify totals update correctly
- [ ] Change quantity to 0 or use delete button
- [ ] Verify item is removed from cart
- [ ] Verify cart total recalculates

### Adding Multiple Items

- [ ] Add 3 different products to cart
- [ ] Verify all 3 items shown in cart
- [ ] Verify each has correct quantity and pricing
- [ ] Verify total is sum of all items
- [ ] Modify quantities of multiple items
- [ ] Verify total recalculates correctly

### Edge Cases

- [ ] Add item, then go back to search and add same item again
  - Should either: (a) increase quantity, or (b) show item already in cart
- [ ] Add item to cart, then increase stock level in admin, then refresh
  - Verify pricing and availability unchanged (don't refresh pricing from here)
- [ ] Add item that has 10 in stock, add 15 to cart
  - Verify system allows (backorder), or shows warning

## Phase 5: Order Checkout

### Checkout Initiation

- [ ] Verify cart has items
- [ ] Click "Checkout" button
- [ ] Verify checkout page/modal loads

### Order Information

- [ ] Verify PO Reference field is shown
- [ ] Verify optional Notes/Comments field is shown
- [ ] Enter PO Reference: "PO-2026-001"
- [ ] Enter Notes: "Urgent delivery needed"
- [ ] Verify dealer info is pre-filled (company name, account number)

### Order Review

- [ ] Verify all cart items are listed in order review
- [ ] Verify each item shows: Code, Description, Quantity, Unit Price, Line Total
- [ ] Verify Subtotal
- [ ] Verify any applicable taxes/fees (if applicable)
- [ ] Verify Order Total matches cart total

### Order Placement

- [ ] Review all details
- [ ] Click "Place Order" button
- [ ] Verify loading state while processing
- [ ] Verify order confirmation page appears within 3 seconds
- [ ] Verify confirmation shows:
  - Order Number
  - Order Date/Time
  - Order Status (usually "PENDING")
  - Total Amount
  - Item Count
  - Delivery Information (if available)

### Post-Order

- [ ] Verify cart is cleared after successful order
- [ ] Verify "Continue Shopping" button available
- [ ] Click "Continue Shopping" - verify returns to search page
- [ ] Verify order confirmation number can be printed/exported

## Phase 6: Order History

### View Orders List

- [ ] Navigate to "My Orders" page
- [ ] Verify list of previous orders shown
- [ ] Verify most recent order appears at top
- [ ] Each order shows: Order Number, Date, Status, Total, Item Count

### Order Details

- [ ] Click on the order we just placed
- [ ] Verify order detail page shows:
  - Order Number
  - Order Date
  - Delivery Address
  - Items (with quantities and prices)
  - Subtotal
  - Order Total
  - Status and any tracking info

### Order Status Tracking

- [ ] Verify order status (should be PENDING or CONFIRMED)
- [ ] If statuses are updated in background, refresh and verify status changes
- [ ] Look for estimated delivery date
- [ ] Check if tracking information is available

### Order Filtering & Sorting

- [ ] Filter by date range (if available)
- [ ] Sort by most recent / oldest
- [ ] Search for specific order number
- [ ] Verify pagination works if many orders exist

## Phase 7: Edge Cases & Error Handling

### Invalid Inputs

- [ ] Try search with special characters: "@#$%^"
- [ ] Search with very long query: 100+ characters
- [ ] Add quantity of 0
- [ ] Add quantity greater than stock level
- [ ] Try to access another dealer's cart (if possible)

### Network Errors

- [ ] Disable network while adding to cart
- [ ] Verify error message shown
- [ ] Enable network and retry
- [ ] Verify operation completes

### Product Availability Changes

- [ ] Add product to cart
- [ ] (In another browser/admin) Change product to INACTIVE
- [ ] Try to checkout
- [ ] Verify appropriate error message

### Entitlement Changes

- [ ] View GENUINE product in search
- [ ] (In admin) Change dealer entitlement to AFTERMARKET_ONLY
- [ ] Verify GENUINE product no longer visible on search
- [ ] Change entitlement back to SHOW_ALL
- [ ] Verify product is visible again

## Phase 8: Performance Testing

### Search Performance

- [ ] Search with 1 character query
- [ ] Verify results within 2 seconds
- [ ] Search with very specific query
- [ ] Verify results within 2 seconds
- [ ] Sort by price on large result set (100+ items)
- [ ] Verify sorting within 1 second

### Cart Performance

- [ ] Add 50 items to cart
- [ ] Verify cart loads within 2 seconds
- [ ] Update quantity of multiple items
- [ ] Verify page remains responsive
- [ ] Verify totals are calculated correctly

### Checkout Performance

- [ ] Proceed to checkout with 50 items
- [ ] Verify checkout page loads within 2 seconds
- [ ] Verify order placement completes within 5 seconds

## Phase 9: Data Integrity

### Pricing Accuracy

- [ ] Verify unit prices in cart match product detail page
- [ ] Verify line totals = quantity × unit price
- [ ] Verify cart total = sum of line totals
- [ ] Verify order totals match cart totals

### Stock Accuracy

- [ ] Check free stock in product detail
- [ ] Verify matches in search results
- [ ] Add item to cart
- [ ] Verify stock doesn't change in product detail (read-only during order)

### Order Records

- [ ] Verify order created in database
- [ ] Verify all order items recorded with correct prices
- [ ] Verify order status is PENDING
- [ ] Verify PO reference saved correctly
- [ ] Verify order timestamp is current

## Phase 10: Mobile/Responsive

### Responsive Design

- [ ] Test on mobile (375px width)
- [ ] Test on tablet (768px width)
- [ ] Test on desktop (1920px width)

### Mobile Specific

- [ ] Search box is easily accessible
- [ ] Add to cart button is large enough to tap
- [ ] Quantity selector works with mobile input
- [ ] Cart sidebar/drawer is usable on mobile
- [ ] Checkout form is readable and fillable on mobile

## Test Results Summary

### Overall Status

- [ ] All Phase 1 tests passed: **\_** (Y/N)
- [ ] All Phase 2 tests passed: **\_** (Y/N)
- [ ] All Phase 3 tests passed: **\_** (Y/N)
- [ ] All Phase 4 tests passed: **\_** (Y/N)
- [ ] All Phase 5 tests passed: **\_** (Y/N)
- [ ] All Phase 6 tests passed: **\_** (Y/N)
- [ ] All Phase 7 tests passed: **\_** (Y/N)
- [ ] All Phase 8 tests passed: **\_** (Y/N)
- [ ] All Phase 9 tests passed: **\_** (Y/N)
- [ ] All Phase 10 tests passed: **\_** (Y/N)

### Issues Found

(Document any failures or unexpected behavior)

1. Issue: **\*\***\*\*\*\***\*\***\_**\*\***\*\*\*\***\*\***
   Status: [ ] Critical [ ] Major [ ] Minor
2. Issue: **\*\***\*\*\*\***\*\***\_**\*\***\*\*\*\***\*\***
   Status: [ ] Critical [ ] Major [ ] Minor

### Sign-Off

- **Tested By**: **\*\***\_\_\_\_**\*\***
- **Date**: **\*\***\_\_\_\_**\*\***
- **Overall Status**: [ ] PASS [ ] FAIL
- **Approved By**: **\*\***\_\_\_\_**\*\***
