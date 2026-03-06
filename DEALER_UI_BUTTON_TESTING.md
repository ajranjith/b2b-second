# Dealer Portal UI Button Testing Guide

Complete testing guide for all dealer portal button actions and UI interactions.

## Quick Overview

**Total Test Cases: 80+ button actions across 5 dealer pages**

- ✅ Search Page: 15 button actions
- ✅ Cart Page: 25 button actions
- ✅ Checkout Page: 10 button actions
- ✅ Orders Page: 15 button actions
- ✅ Backorders Page: 10 button actions
- ✅ Dashboard/Navigation: 10 button actions

**Estimated Testing Time: 45-60 minutes**

---

## 1. DEALER LOGIN & DASHBOARD

### 1.1 Login Page (`/dealer/login`)

#### Test 1.1.1: Login Button - Valid Credentials

- **Location:** Login form submit button
- **Action:** Enter valid email and password, click "Sign In"
- **Expected Result:**
  - ✅ User logged in successfully
  - ✅ Redirected to `/dealer/dashboard`
  - ✅ Session established with JWT token
  - ✅ User name displayed in header
- **Assertion:** Dashboard loads with user data

#### Test 1.1.2: Login Button - Invalid Credentials

- **Location:** Login form submit button
- **Action:** Enter invalid email or password, click "Sign In"
- **Expected Result:**
  - ✅ Error message displayed: "Invalid credentials"
  - ✅ User remains on login page
  - ✅ Form data retained for correction
- **Assertion:** Error message visible, page unchanged

#### Test 1.1.3: Login Button - Empty Fields

- **Location:** Login form submit button
- **Action:** Click "Sign In" without entering credentials
- **Expected Result:**
  - ✅ Validation errors shown for empty fields
  - ✅ Form submission prevented
- **Assertion:** Validation prevents submission

### 1.2 Dashboard Page (`/dealer/dashboard`)

#### Test 1.2.1: Search Parts Link/Button

- **Location:** Navigation or dashboard quick link
- **Action:** Click "Search Parts" link/button
- **Expected Result:**
  - ✅ Navigate to `/dealer/search`
  - ✅ Search page loads with empty search field
- **Assertion:** URL changes to search page

#### Test 1.2.2: Cart Link/Button

- **Location:** Navigation header or dashboard
- **Action:** Click "Cart" link
- **Expected Result:**
  - ✅ Navigate to `/dealer/cart`
  - ✅ Cart page loads with current items
- **Assertion:** URL changes to cart page

#### Test 1.2.3: Orders Link/Button

- **Location:** Dashboard navigation
- **Action:** Click "Orders" link
- **Expected Result:**
  - ✅ Navigate to `/dealer/orders`
  - ✅ Order history displayed
- **Assertion:** URL changes to orders page

#### Test 1.2.4: Backorders Link/Button

- **Location:** Dashboard navigation
- **Action:** Click "Backorders" link
- **Expected Result:**
  - ✅ Navigate to `/dealer/backorders`
  - ✅ Backorder list displayed
- **Assertion:** URL changes to backorders page

#### Test 1.2.5: Logout Button

- **Location:** Top-right corner header
- **Action:** Click "Logout" button
- **Expected Result:**
  - ✅ User session terminated
  - ✅ JWT token cleared
  - ✅ Redirected to `/dealer/login`
  - ✅ Page requires re-authentication
- **Assertion:** Logout successful, redirected to login

#### Test 1.2.6: Mini Cart Button

- **Location:** Header (shopping cart icon with item count)
- **Action:** Click mini cart button when items in cart
- **Expected Result:**
  - ✅ Mini cart dropdown/panel opens
  - ✅ Shows cart items summary
  - ✅ Shows cart total
  - ✅ "View Full Cart" button visible
- **Assertion:** Mini cart opens with correct data

#### Test 1.2.7: Close Mini Cart

- **Location:** Mini cart panel (X or close button)
- **Action:** Click close button on mini cart
- **Expected Result:**
  - ✅ Mini cart panel closes
  - ✅ Returns to previous page content
- **Assertion:** Mini cart collapses

---

## 2. SEARCH PAGE (`/dealer/search`)

### 2.1 Search Controls

#### Test 2.1.1: Search Button - Valid Query

- **Location:** Main search bar with blue "Search" button
- **Action:**
  1. Enter search term: "bearing"
  2. Click "Search" button
- **Expected Result:**
  - ✅ Search executed
  - ✅ Results displayed below (filtered by dealer entitlement)
  - ✅ Product count shown
  - ✅ Loading indicator appears while fetching
- **Assertion:** Products displayed matching query

#### Test 2.1.2: Search Button - Empty Query

- **Location:** Search button
- **Action:** Leave search field empty, click "Search"
- **Expected Result:**
  - ✅ Search not executed
  - ✅ Validation message: "Please enter a search term"
- **Assertion:** Search prevented for empty query

#### Test 2.1.3: Enter Key to Search

- **Location:** Search input field
- **Action:** Type search term, press Enter key
- **Expected Result:**
  - ✅ Search executed (same as clicking Search button)
  - ✅ Results displayed
- **Assertion:** Enter key triggers search

#### Test 2.1.4: Filters Button - Show/Hide

- **Location:** "Filters" button (with filter icon)
- **Action:** Click "Filters" button
- **Expected Result:**
  - ✅ Filter panel expands below search bar
  - ✅ Shows Part Type, Availability, Sort options
- **Assertion:** Filter panel visible

#### Test 2.1.5: Filters Button - Toggle Off

- **Location:** "Filters" button
- **Action:** Click "Filters" button again to close
- **Expected Result:**
  - ✅ Filter panel collapses
  - ✅ Search results remain visible
- **Assertion:** Filter panel hidden

### 2.2 Filter Controls

#### Test 2.2.1: Part Type Filter - Genuine

- **Location:** Filter panel, "Part Type" dropdown
- **Action:**
  1. Open filters
  2. Change Part Type from "All Types" to "Genuine"
- **Expected Result:**
  - ✅ Results re-filter automatically
  - ✅ Only GENUINE parts displayed
  - ✅ Badge shows "Genuine" for each product
- **Assertion:** Results filtered to genuine parts only

#### Test 2.2.2: Part Type Filter - Aftermarket

- **Location:** Filter panel, "Part Type" dropdown
- **Action:** Change Part Type to "Aftermarket"
- **Expected Result:**
  - ✅ Results re-filter
  - ✅ Only AFTERMARKET parts displayed
- **Assertion:** Results filtered to aftermarket parts

#### Test 2.2.3: Part Type Filter - Branded

- **Location:** Filter panel, "Part Type" dropdown
- **Action:** Change Part Type to "Branded"
- **Expected Result:**
  - ✅ Results re-filter
  - ✅ Only BRANDED parts displayed
- **Assertion:** Results filtered to branded parts

#### Test 2.2.4: In-Stock Only Checkbox

- **Location:** Filter panel, "Availability" checkbox
- **Action:**
  1. Search with no filter
  2. Check "In Stock Only" checkbox
- **Expected Result:**
  - ✅ Results re-filter
  - ✅ Only products with freeStock > 0 shown
  - ✅ Quantity badges show available stock
- **Assertion:** Out-of-stock items hidden

#### Test 2.2.5: In-Stock Only Unchecked

- **Location:** Filter panel, "Availability" checkbox
- **Action:** Uncheck "In Stock Only"
- **Expected Result:**
  - ✅ All items displayed again (in-stock and out-of-stock)
  - ✅ Out-of-stock badges visible
- **Assertion:** All items displayed

#### Test 2.2.6: Sort by Relevance

- **Location:** Filter panel, "Sort By" dropdown
- **Action:** Keep sort set to "Relevance" (default)
- **Expected Result:**
  - ✅ Results sorted by search relevance
  - ✅ Best matches appear first
- **Assertion:** Results ordered by relevance

#### Test 2.2.7: Sort by Price - Ascending

- **Location:** Filter panel, "Sort By" dropdown
- **Action:** Select "Price: Low to High"
- **Expected Result:**
  - ✅ Results re-sort
  - ✅ Lowest priced items appear first
  - ✅ Prices increase down the list
- **Assertion:** Results sorted price ascending

#### Test 2.2.8: Sort by Price - Descending

- **Location:** Filter panel, "Sort By" dropdown
- **Action:** Select "Price: High to Low"
- **Expected Result:**
  - ✅ Results re-sort
  - ✅ Highest priced items appear first
- **Assertion:** Results sorted price descending

#### Test 2.2.9: Sort by Stock

- **Location:** Filter panel, "Sort By" dropdown
- **Action:** Select "Stock Quantity"
- **Expected Result:**
  - ✅ Results re-sort
  - ✅ Highest stock items appear first
- **Assertion:** Results sorted by stock descending

### 2.3 Product Actions

#### Test 2.3.1: Quantity Increment Button

- **Location:** Product card quantity selector, "+" button
- **Action:**
  1. Click "+" button next to quantity field
  2. Quantity starts at 1
- **Expected Result:**
  - ✅ Quantity increases to 2
  - ✅ Button clickable multiple times
  - ✅ Quantity updates in real-time
- **Assertion:** Quantity increments correctly

#### Test 2.3.2: Quantity Decrement Button

- **Location:** Product card quantity selector, "-" button
- **Action:**
  1. Increase quantity to 3
  2. Click "-" button
- **Expected Result:**
  - ✅ Quantity decreases to 2
  - ✅ Quantity field updates
- **Assertion:** Quantity decrements correctly

#### Test 2.3.3: Quantity Decrement - Disabled at 1

- **Location:** Product card quantity selector, "-" button
- **Action:** With quantity at 1, click "-" button
- **Expected Result:**
  - ✅ Button is DISABLED (greyed out)
  - ✅ Quantity stays at 1
  - ✅ Cursor shows "not-allowed"
- **Assertion:** Button disabled at minimum quantity

#### Test 2.3.4: Direct Quantity Input

- **Location:** Quantity input field
- **Action:** Click field and type "5"
- **Expected Result:**
  - ✅ Quantity field accepts input
  - ✅ Value updates to 5
  - ✅ +/- buttons adjust from 5
- **Assertion:** Direct input accepted

#### Test 2.3.5: Quantity Input - Invalid Value

- **Location:** Quantity input field
- **Action:** Type "abc" or negative number
- **Expected Result:**
  - ✅ Field rejects invalid input OR
  - ✅ Resets to valid number (1 or previous valid quantity)
- **Assertion:** Invalid input handled

#### Test 2.3.6: Add to Cart Button - Valid Item

- **Location:** Product card, "Add to Cart" button (blue)
- **Action:**
  1. Set quantity to 3
  2. Click "Add to Cart" button
- **Expected Result:**
  - ✅ Loading indicator shows briefly
  - ✅ Toast notification: "Added 3x [PRODUCT_CODE] to cart!"
  - ✅ Mini cart opens (auto-display 3 seconds)
  - ✅ Item count in header updates
  - ✅ Cart badge shows new count
- **Assertion:** Item added to cart with success message

#### Test 2.3.7: Add to Cart Button - Loading State

- **Location:** "Add to Cart" button
- **Action:** Click button while product data is loading
- **Expected Result:**
  - ✅ Button shows loading spinner/text
  - ✅ Button disabled during request
  - ✅ Cannot click multiple times
- **Assertion:** Button disabled during loading

#### Test 2.3.8: Add to Cart - Network Error

- **Location:** "Add to Cart" button
- **Action:**
  1. Disconnect network or API fails
  2. Click "Add to Cart"
- **Expected Result:**
  - ✅ Error toast: "Failed to add item to cart"
  - ✅ Item NOT added to cart
  - ✅ Can retry after reconnecting
- **Assertion:** Error handled gracefully

#### Test 2.3.9: Add Out-of-Stock Item

- **Location:** Product with 0 stock
- **Action:** Try to click "Add to Cart" on out-of-stock item
- **Expected Result:**
  - ✅ Button is DISABLED
  - ✅ Text shows "Out of Stock"
  - ✅ Cannot add to cart
- **Assertion:** Button disabled for out-of-stock items

#### Test 2.3.10: Mini Cart Auto-Close

- **Location:** Mini cart after adding item
- **Action:** Add item and observe mini cart
- **Expected Result:**
  - ✅ Mini cart opens automatically
  - ✅ Closes after 3 seconds automatically
  - ✅ Returns to search results
- **Assertion:** Mini cart auto-closes on timer

---

## 3. CART PAGE (`/dealer/cart`)

### 3.1 Cart Display & Controls

#### Test 3.1.1: Empty Cart Message

- **Location:** Cart page when no items
- **Action:** Navigate to cart with no items added
- **Expected Result:**
  - ✅ Empty cart icon displayed
  - ✅ Message: "Your cart is empty"
  - ✅ "Continue Shopping" button visible
- **Assertion:** Empty state displayed correctly

#### Test 3.1.2: Cart Item Display

- **Location:** Cart items list
- **Action:** Add items to cart and view
- **Expected Result:**
  - ✅ All items displayed with:
    - Product code
    - Description
    - Part type badge
    - Unit price
    - Quantity controls
    - Line total
    - Remove button
  - ✅ Cart summary shows correct subtotal
- **Assertion:** All items display correctly

#### Test 3.1.3: Update Quantity - Increment

- **Location:** Cart item quantity controls, "+" button
- **Action:** Click "+" button next to item quantity
- **Expected Result:**
  - ✅ Quantity increases by 1
  - ✅ Line total updates immediately
  - ✅ Cart subtotal updates
  - ✅ API call in background
- **Assertion:** Quantity increments with cart update

#### Test 3.1.4: Update Quantity - Decrement

- **Location:** Cart item quantity controls, "-" button
- **Action:** Click "-" button
- **Expected Result:**
  - ✅ Quantity decreases by 1
  - ✅ Line total updates
  - ✅ Cart subtotal updates
- **Assertion:** Quantity decrements correctly

#### Test 3.1.5: Update Quantity - Decrement at 1

- **Location:** "-" button when quantity is 1
- **Action:** Click "-" button
- **Expected Result:**
  - ✅ Button is DISABLED
  - ✅ Quantity stays at 1
- **Assertion:** Cannot go below quantity 1

#### Test 3.1.6: Direct Quantity Edit

- **Location:** Quantity input field
- **Action:** Click field and change to "10"
- **Expected Result:**
  - ✅ Field accepts new value
  - ✅ Line total updates to new quantity
  - ✅ Cart total updates
  - ✅ API updates in background
- **Assertion:** Direct edit updates cart

#### Test 3.1.7: Quantity Input - Invalid Value

- **Location:** Quantity input field
- **Action:** Type "0" or "-5" or "abc"
- **Expected Result:**
  - ✅ Invalid values rejected or corrected
  - ✅ Resets to valid quantity (1 or previous valid)
  - ✅ Error message shown if typed "0"
- **Assertion:** Invalid quantity prevented

#### Test 3.1.8: Quantity Update - Loading State

- **Location:** Item row during quantity update
- **Action:** Increment quantity and observe
- **Expected Result:**
  - ✅ Brief loading indicator (spinner or disabled state)
  - ✅ Controls disabled during update
  - ✅ Cannot spam multiple updates
- **Assertion:** Updates are sequential

#### Test 3.1.9: Remove Item Button

- **Location:** "Remove" or trash icon button on item
- **Action:** Click "Remove" button
- **Expected Result:**
  - ✅ Item removed from cart immediately
  - ✅ Toast: "Item removed from cart"
  - ✅ Cart totals update
  - ✅ Item count decreases
  - ✅ If last item, shows empty cart message
- **Assertion:** Item removed successfully

#### Test 3.1.10: Remove Item - Confirmation

- **Location:** "Remove" button
- **Action:** Click remove on high-value item
- **Expected Result:**
  - ✅ Optional: Confirmation dialog appears
  - ✅ Must confirm removal
- **Assertion:** Accidental removal prevented (optional)

#### Test 3.1.11: Continue Shopping Button

- **Location:** Cart page, "Continue Shopping" button
- **Action:** Click "Continue Shopping"
- **Expected Result:**
  - ✅ Navigate to `/dealer/search`
  - ✅ Search page loads
  - ✅ Previous search results cleared
- **Assertion:** Navigates to search page

#### Test 3.1.12: Cart Totals Display

- **Location:** Cart summary box
- **Action:** Add multiple items with different quantities
- **Expected Result:**
  - ✅ Subtotal = sum of (price × qty) for all items
  - ✅ Item count = sum of all quantities
  - ✅ Totals update as items change
  - ✅ Formatted as currency (£)
- **Assertion:** Calculations correct

#### Test 3.1.13: View Mini Cart from Full Cart

- **Location:** Header mini cart button
- **Action:** From full cart page, click mini cart icon
- **Expected Result:**
  - ✅ Mini cart opens showing same items
  - ✅ Summary matches full cart
  - ✅ Can edit quantities from mini cart
- **Assertion:** Mini cart reflects full cart state

#### Test 3.1.14: Stock Validation Badge

- **Location:** Item row, stock status badge
- **Action:** View cart items with different stock levels
- **Expected Result:**
  - ✅ "In Stock" badge (green) for available
  - ✅ "Low Stock" badge (amber) for <= 5 units
  - ✅ "Out of Stock" badge (red) if requested qty unavailable
  - ✅ Stock warnings displayed
- **Assertion:** Stock status shown correctly

#### Test 3.1.15: Part Type Badge

- **Location:** Item row, part type badge
- **Action:** View items with different part types
- **Expected Result:**
  - ✅ GENUINE = blue badge
  - ✅ AFTERMARKET = purple badge
  - ✅ BRANDED = green badge
  - ✅ Badge displayed clearly
- **Assertion:** Part type badges correct

### 3.2 Checkout Process

#### Test 3.2.1: Proceed to Checkout Button

- **Location:** Cart summary box, "Proceed to Checkout" button
- **Action:** Click "Proceed to Checkout"
- **Expected Result:**
  - ✅ Checkout dialog opens
  - ✅ Shows cart summary at top
  - ✅ Dispatch method options visible
  - ✅ PO Reference field visible
  - ✅ Notes field visible
  - ✅ "Complete Order" button visible
- **Assertion:** Checkout dialog displayed

#### Test 3.2.2: Dispatch Method - Standard

- **Location:** Checkout dialog, "Standard Dispatch" radio button
- **Action:** Select "Standard Dispatch"
- **Expected Result:**
  - ✅ Radio button selected
  - ✅ Dispatch details shown: "5-7 business days"
  - ✅ Selected state clear
- **Assertion:** Standard dispatch selected

#### Test 3.2.3: Dispatch Method - Express

- **Location:** Checkout dialog, "Express Dispatch" radio button
- **Action:** Select "Express Dispatch"
- **Expected Result:**
  - ✅ Radio button selected
  - ✅ Dispatch details shown: "2-3 business days"
  - ✅ May show premium charge
- **Assertion:** Express dispatch selected

#### Test 3.2.4: PO Reference - Optional Input

- **Location:** Checkout dialog, "PO Reference" field
- **Action:** Enter "PO-2024-001"
- **Expected Result:**
  - ✅ Text accepted
  - ✅ Field stores value
  - ✅ Field accepts 50+ characters
- **Assertion:** PO reference accepted

#### Test 3.2.5: Notes Field - Optional Input

- **Location:** Checkout dialog, "Special Instructions" field
- **Action:** Enter order notes
- **Expected Result:**
  - ✅ Multi-line text accepted
  - ✅ Field handles 500+ characters
  - ✅ Line breaks preserved
- **Assertion:** Notes field accepts text

#### Test 3.2.6: Complete Order Button - Valid

- **Location:** Checkout dialog, "Complete Order" button
- **Action:**
  1. Select dispatch method
  2. Fill optional fields (optional)
  3. Click "Complete Order"
- **Expected Result:**
  - ✅ Button shows loading state "Processing..."
  - ✅ Dialog disables all inputs
  - ✅ API call sent with order data
  - ✅ Order processed successfully
- **Assertion:** Order submission initiated

#### Test 3.2.7: Complete Order Button - Minimum Required

- **Location:** "Complete Order" button
- **Action:**
  1. Dispatch method selected
  2. PO and Notes left empty
  3. Click "Complete Order"
- **Expected Result:**
  - ✅ Order accepted (PO/Notes optional)
  - ✅ Order processing begins
- **Assertion:** Optional fields don't block submission

#### Test 3.2.8: Complete Order - Loading State

- **Location:** "Complete Order" button
- **Action:** Click button and observe
- **Expected Result:**
  - ✅ Button disabled
  - ✅ Shows "Processing..." text or spinner
  - ✅ Cannot click multiple times
  - ✅ Dialog backdrop prevents background interaction
- **Assertion:** Button locked during processing

#### Test 3.2.9: Complete Order - Network Error

- **Location:** "Complete Order" button
- **Action:**
  1. Disconnect network
  2. Click "Complete Order"
  3. Wait for timeout
- **Expected Result:**
  - ✅ Error message shown in dialog
  - ✅ Order NOT placed
  - ✅ Dialog remains open for retry
  - ✅ "Try Again" button available
- **Assertion:** Error handled gracefully

#### Test 3.2.10: Close Checkout Dialog

- **Location:** Checkout dialog, close button or "Cancel"
- **Action:** Click close/cancel button
- **Expected Result:**
  - ✅ Dialog closes
  - ✅ Returns to full cart view
  - ✅ Cart items still there
  - ✅ Data not submitted
- **Assertion:** Dialog closes without submitting

### 3.3 Order Confirmation

#### Test 3.3.1: Order Confirmation Display

- **Location:** Order confirmation dialog
- **Action:** Successfully complete checkout
- **Expected Result:**
  - ✅ Confirmation dialog appears
  - ✅ Shows order number (e.g., "ORD-2024-001234")
  - ✅ Shows checkmark icon
  - ✅ Success message: "Order placed successfully!"
  - ✅ Order summary displayed
- **Assertion:** Confirmation shown with order details

#### Test 3.3.2: View Order Button

- **Location:** Confirmation dialog, "View Order" button
- **Action:** Click "View Order"
- **Expected Result:**
  - ✅ Navigate to `/dealer/orders`
  - ✅ Dialog closes
  - ✅ New order visible in list
  - ✅ Status shows "Processing"
- **Assertion:** Navigates to orders page

#### Test 3.3.3: Continue Shopping Button

- **Location:** Confirmation dialog, "Continue Shopping" button
- **Action:** Click "Continue Shopping"
- **Expected Result:**
  - ✅ Navigate to `/dealer/search`
  - ✅ Cart cleared
  - ✅ Cart count reset to 0
  - ✅ Search page ready for new search
- **Assertion:** Returns to search, cart cleared

#### Test 3.3.4: Cart Cleared After Order

- **Location:** Cart page or mini cart
- **Action:** After order confirmation, check cart
- **Expected Result:**
  - ✅ Cart is empty
  - ✅ Shows "Your cart is empty" message
  - ✅ Cart icon shows 0 items
- **Assertion:** Cart cleared successfully

---

## 4. ORDERS PAGE (`/dealer/orders`)

### 4.1 Order List

#### Test 4.1.1: Order Display - Basic

- **Location:** Orders list
- **Action:** Navigate to orders page with placed orders
- **Expected Result:**
  - ✅ All orders displayed in reverse chronological order (newest first)
  - ✅ Each order shows:
    - Order number
    - Order date
    - Item count
    - Total amount
    - Order status badge
  - ✅ Orders are clickable/expandable
- **Assertion:** Orders displayed correctly

#### Test 4.1.2: No Orders Message

- **Location:** Orders page, empty state
- **Action:** Navigate to orders with no orders
- **Expected Result:**
  - ✅ Package icon displayed
  - ✅ "No orders yet" message shown
  - ✅ "Browse Parts" button visible
- **Assertion:** Empty state displayed

#### Test 4.1.3: Order Status Badges - Processing

- **Location:** Order status badge
- **Action:** View recently placed order
- **Expected Result:**
  - ✅ Badge shows "PROCESSING"
  - ✅ Badge color: blue background
  - ✅ Clear visibility
- **Assertion:** Processing status displayed

#### Test 4.1.4: Order Status Badges - Shipped

- **Location:** Order status badge
- **Action:** View shipped order
- **Expected Result:**
  - ✅ Badge shows "SHIPPED"
  - ✅ Badge color: green background
- **Assertion:** Shipped status displayed

#### Test 4.1.5: Order Status Badges - Cancelled

- **Location:** Order status badge
- **Action:** View cancelled order (if available)
- **Expected Result:**
  - ✅ Badge shows "CANCELLED"
  - ✅ Badge color: red background
- **Assertion:** Cancelled status displayed

#### Test 4.1.6: Expand Order Details

- **Location:** Order row
- **Action:** Click on order to expand
- **Expected Result:**
  - ✅ Order expands to show line items
  - ✅ Shows all products in order with:
    - Product code
    - Description
    - Quantity
    - Unit price
    - Line total
  - ✅ Shows order metadata:
    - PO reference (if provided)
    - Dispatch method
    - Delivery address
- **Assertion:** Order details displayed

#### Test 4.1.7: Collapse Order Details

- **Location:** Expanded order row
- **Action:** Click order again to collapse
- **Expected Result:**
  - ✅ Order details hidden
  - ✅ Returns to compact view
  - ✅ Summary still visible
- **Assertion:** Order collapsed

#### Test 4.1.8: Order Total Calculation

- **Location:** Order total display
- **Action:** View expanded order
- **Expected Result:**
  - ✅ Order total = sum of all line totals
  - ✅ Formatted as currency (£)
  - ✅ Matches checkout confirmation
- **Assertion:** Total calculated correctly

#### Test 4.1.9: Pagination - Next Button

- **Location:** Pagination controls at bottom
- **Action:** With 20+ orders, click "Next" button
- **Expected Result:**
  - ✅ Page 2 loads
  - ✅ Shows next 20 orders
  - ✅ "Previous" button enabled
  - ✅ Page indicator updates
- **Assertion:** Pagination works forward

#### Test 4.1.10: Pagination - Previous Button

- **Location:** Pagination controls, "Previous" button
- **Action:** On page 2+, click "Previous"
- **Expected Result:**
  - ✅ Returns to previous page
  - ✅ Shows previous 20 orders
  - ✅ Page indicator updates
- **Assertion:** Pagination works backward

#### Test 4.1.11: Pagination - First Page Disabled

- **Location:** "Previous" button on page 1
- **Action:** Click "Previous" button
- **Expected Result:**
  - ✅ Button is DISABLED (greyed out)
  - ✅ No navigation occurs
- **Assertion:** Cannot go before first page

#### Test 4.1.12: Pagination - Last Page Disabled

- **Location:** "Next" button on last page
- **Action:** Click "Next" button
- **Expected Result:**
  - ✅ Button is DISABLED
  - ✅ No navigation occurs
- **Assertion:** Cannot go past last page

#### Test 4.1.13: Page Size Display

- **Location:** Pagination info text
- **Action:** View pagination information
- **Expected Result:**
  - ✅ Shows "Showing X to Y of Z orders"
  - ✅ Correct count displayed
  - ✅ Example: "Showing 1 to 20 of 47 orders"
- **Assertion:** Count accurate

#### Test 4.1.14: Browse Parts Button

- **Location:** No orders empty state
- **Action:** Click "Browse Parts" button
- **Expected Result:**
  - ✅ Navigate to `/dealer/search`
  - ✅ Search page opens
- **Assertion:** Navigation to search works

#### Test 4.1.15: Return to Cart Button

- **Location:** Order details (optional)
- **Action:** If button present, click to return to cart
- **Expected Result:**
  - ✅ Navigate to `/dealer/cart`
  - ✅ Cart loads
- **Assertion:** Navigation to cart works

---

## 5. BACKORDERS PAGE (`/dealer/backorders`)

### 5.1 Backorder List

#### Test 5.1.1: Backorder Display - Basic

- **Location:** Backorders table
- **Action:** Navigate to backorders page
- **Expected Result:**
  - ✅ Table displays with columns:
    - Part number
    - Description
    - Your reference
    - Qty ordered
    - Qty outstanding
    - Qty in warehouse
  - ✅ Rows sortable by clicking headers
  - ✅ Clear presentation of data
- **Assertion:** Backorders displayed correctly

#### Test 5.1.2: No Backorders Message

- **Location:** Backorders page, empty state
- **Action:** Navigate to backorders with none for this dealer
- **Expected Result:**
  - ✅ Alert icon displayed
  - ✅ Message: "No backorders"
  - ✅ Explanation: "You have no outstanding backorders"
- **Assertion:** Empty state displayed

#### Test 5.1.3: Backorder Row Details

- **Location:** Backorder table row
- **Action:** View backorder entry
- **Expected Result:**
  - ✅ Part number clearly visible (e.g., "LR071485")
  - ✅ Description shown (e.g., "Drive Belt Assembly")
  - ✅ Customer/Order reference if available
  - ✅ Quantities in clear columns
  - ✅ Stock status indicators
- **Assertion:** All data visible

#### Test 5.1.4: Sort by Part Number

- **Location:** "Part" column header
- **Action:** Click column header to sort
- **Expected Result:**
  - ✅ Table sorts by part number A-Z
  - ✅ Arrow indicator shows sort direction
  - ✅ Click again to reverse sort Z-A
- **Assertion:** Column sortable ascending/descending

#### Test 5.1.5: Sort by Outstanding Qty

- **Location:** "Outstanding" column header
- **Action:** Click to sort
- **Expected Result:**
  - ✅ Sorts by outstanding quantity (highest first)
  - ✅ Sort indicator visible
- **Assertion:** Numeric sort works

#### Test 5.1.6: Stock In Warehouse Column

- **Location:** "In Warehouse" column
- **Action:** View stock levels
- **Expected Result:**
  - ✅ Shows current stock available
  - ✅ May be highlighted if quantity high
  - ✅ Zero shown if out of stock
- **Assertion:** Stock levels displayed

#### Test 5.1.7: Last Updated Timestamp

- **Location:** Backorders page, "Last updated" text
- **Action:** View timestamp
- **Expected Result:**
  - ✅ Shows last data refresh date/time
  - ✅ Format: "January 15, 2024 at 3:45 PM"
  - ✅ Accurate to current data
- **Assertion:** Update timestamp shown

#### Test 5.1.8: Refresh Button

- **Location:** "Refresh" button or icon
- **Action:** Click refresh button
- **Expected Result:**
  - ✅ Data reloaded from database
  - ✅ Loading indicator shows briefly
  - ✅ Timestamp updates
  - ✅ New backorders appear if available
- **Assertion:** Refresh button works

#### Test 5.1.9: Refresh Button - Loading State

- **Location:** "Refresh" button
- **Action:** Click and observe loading
- **Expected Result:**
  - ✅ Button shows loading spinner
  - ✅ Button disabled during refresh
  - ✅ Cannot click multiple times
  - ✅ Returns to normal after complete
- **Assertion:** Loading state shown

#### Test 5.1.10: Search Parts Button

- **Location:** Empty state or navigation
- **Action:** Click "Search Parts" or browse link
- **Expected Result:**
  - ✅ Navigate to `/dealer/search`
  - ✅ Can search for in-stock alternatives
  - ✅ Can place new orders
- **Assertion:** Navigation to search works

---

## 6. CROSS-PAGE NAVIGATION & GLOBAL BUTTONS

### 6.1 Header Navigation

#### Test 6.1.1: Logo Click - Home

- **Location:** "Hotbray Portal" logo
- **Action:** Click logo from any page
- **Expected Result:**
  - ✅ Navigate to dashboard `/dealer/dashboard`
  - ✅ Logo always visible in header
- **Assertion:** Logo navigation works

#### Test 6.1.2: Mobile Menu Toggle

- **Location:** Hamburger menu icon (mobile view < 768px)
- **Action:** Click menu icon
- **Expected Result:**
  - ✅ Menu opens showing navigation links
  - ✅ Links: Dashboard, Search, Cart, Orders, Backorders
  - ✅ Logout button visible
- **Assertion:** Mobile menu displays

#### Test 6.1.3: Mobile Menu Close

- **Location:** Mobile menu
- **Action:** Click outside menu or click link
- **Expected Result:**
  - ✅ Menu closes
  - ✅ Navigation occurs if link clicked
- **Assertion:** Mobile menu closes

#### Test 6.1.4: Desktop Navigation Links

- **Location:** Top navigation bar (desktop view)
- **Action:** View navigation links
- **Expected Result:**
  - ✅ Links visible: Search Parts, Cart, Orders, Backorders
  - ✅ Links styled consistently
  - ✅ Hover effects show
- **Assertion:** Desktop nav displays

#### Test 6.1.5: Logout Button - Desktop

- **Location:** Top-right header
- **Action:** Click "Logout" button
- **Expected Result:**
  - ✅ Session terminated
  - ✅ Redirect to `/dealer/login`
  - ✅ Cannot access dealer pages without login
- **Assertion:** Logout works

#### Test 6.1.6: Cart Item Count Badge

- **Location:** Cart icon with number badge
- **Action:** Add items to cart
- **Expected Result:**
  - ✅ Badge shows correct count
  - ✅ Updates as items added/removed
  - ✅ Hidden when count = 0
- **Assertion:** Badge accurate

#### Test 6.1.7: Mini Cart Icon Click

- **Location:** Shopping cart icon in header
- **Action:** Click cart icon
- **Expected Result:**
  - ✅ Mini cart panel opens
  - ✅ Shows cart items summary
  - ✅ Shows cart total
  - ✅ "View Full Cart" link visible
- **Assertion:** Mini cart opens

---

## 7. RESPONSIVE DESIGN & MOBILE BUTTONS

### 7.1 Mobile View (< 768px)

#### Test 7.1.1: Search Page - Mobile Layout

- **Location:** Search page on mobile device
- **Action:** View on 375px width (iPhone SE)
- **Expected Result:**
  - ✅ Search bar full width
  - ✅ Buttons stack or size appropriately
  - ✅ Filters accessible via toggle
  - ✅ Product grid switches to single column
- **Assertion:** Mobile layout responsive

#### Test 7.1.2: Cart Page - Mobile Layout

- **Location:** Cart page on mobile
- **Action:** View on mobile device
- **Expected Result:**
  - ✅ Cart items scroll vertically
  - ✅ Quantity controls easily tappable (min 44px)
  - ✅ Remove button accessible
  - ✅ Checkout button full width
- **Assertion:** Mobile cart usable

#### Test 7.1.3: Orders Page - Mobile Layout

- **Location:** Orders page on mobile
- **Action:** View on mobile device
- **Expected Result:**
  - ✅ Orders display in single column
  - ✅ Order rows expandable
  - ✅ Text readable without zoom
  - ✅ Pagination buttons accessible
- **Assertion:** Orders mobile friendly

#### Test 7.1.4: Backorders Page - Mobile Layout

- **Location:** Backorders page on mobile
- **Action:** View on mobile device
- **Expected Result:**
  - ✅ Table scrolls horizontally if needed
  - ✅ Key columns always visible
  - ✅ Text readable
  - ✅ Refresh button accessible
- **Assertion:** Backorders mobile friendly

#### Test 7.1.5: Touch Targets - Button Size

- **Location:** All buttons
- **Action:** Test on touchscreen device
- **Expected Result:**
  - ✅ All buttons minimum 44x44px (touch target)
  - ✅ Buttons easily tappable without zoom
  - ✅ No false clicks on adjacent buttons
- **Assertion:** Touch targets adequate

#### Test 7.1.6: Keyboard Navigation - Tab Order

- **Location:** All form inputs
- **Action:** Press Tab key to navigate
- **Expected Result:**
  - ✅ Focus moves logically: left→right, top→bottom
  - ✅ Focus visible on all interactive elements
  - ✅ Focus doesn't jump around
- **Assertion:** Tab order logical

#### Test 7.1.7: Keyboard - Enter to Submit

- **Location:** Form buttons
- **Action:** Focus on form and press Enter
- **Expected Result:**
  - ✅ Form submits on Enter
  - ✅ Equivalent to clicking submit button
- **Assertion:** Enter key submits forms

#### Test 7.1.8: Keyboard - Escape to Close

- **Location:** Dialog/Modal
- **Action:** Open dialog and press Escape
- **Expected Result:**
  - ✅ Dialog closes
  - ✅ Focus returns to previous element
  - ✅ No data submitted
- **Assertion:** Escape closes dialogs

---

## 8. ERROR HANDLING & EDGE CASES

#### Test 8.1.1: Button Click During Loading

- **Location:** Any loading button
- **Action:** Click button multiple times rapidly
- **Expected Result:**
  - ✅ Button disabled after first click
  - ✅ Only one request sent
  - ✅ No duplicate submissions
- **Assertion:** Debounced/throttled

#### Test 8.1.2: Quantity Zero Validation

- **Location:** Quantity field
- **Action:** Try to enter 0
- **Expected Result:**
  - ✅ Validation prevents 0
  - ✅ Defaults to 1 or previous valid
  - ✅ Error message: "Quantity must be at least 1"
- **Assertion:** Minimum quantity enforced

#### Test 8.1.3: Very Large Quantity

- **Location:** Quantity field
- **Action:** Try to enter 99999
- **Expected Result:**
  - ✅ Accepts reasonable quantities
  - ✅ May limit to max available stock
  - ✅ or allow but warn user
- **Assertion:** Large quantities handled

#### Test 8.1.4: Special Characters in Input

- **Location:** PO Reference or Notes field
- **Action:** Enter "!@#$%^&\*()" or unicode
- **Expected Result:**
  - ✅ Input accepted and stored
  - ✅ Displayed correctly
  - ✅ No injection/XSS issues
- **Assertion:** Special chars handled safely

#### Test 8.1.5: Long Text Input

- **Location:** Notes field
- **Action:** Enter 1000+ characters
- **Expected Result:**
  - ✅ Field accepts long text
  - ✅ Scrolls within field
  - ✅ Submitted correctly
  - ✅ Stored in database
- **Assertion:** Long text handled

#### Test 8.1.6: Session Expiration - Button Click

- **Location:** Any button after session expires
- **Action:**
  1. Wait for session to expire (15-30 min)
  2. Try to click action button
- **Expected Result:**
  - ✅ Request fails with 401 Unauthorized
  - ✅ Redirected to login page
  - ✅ Error message shown: "Session expired. Please login again."
- **Assertion:** Session expiration handled

#### Test 8.1.7: Network Timeout

- **Location:** Any action button
- **Action:**
  1. Slow/throttle network to very slow
  2. Click button
  3. Wait for timeout (30sec+)
- **Expected Result:**
  - ✅ Request times out gracefully
  - ✅ Error message shown
  - ✅ Button re-enabled for retry
  - ✅ No hanging state
- **Assertion:** Timeout handled

#### Test 8.1.8: Offline Mode

- **Location:** Any button
- **Action:**
  1. Turn off network
  2. Try to click action button
- **Expected Result:**
  - ✅ Error immediately: "No internet connection"
  - ✅ User can retry when online
- **Assertion:** Offline detected

---

## 9. VISUAL & UI CONSISTENCY

#### Test 9.1.1: Button Hover States

- **Location:** All interactive buttons
- **Action:** Hover mouse over buttons
- **Expected Result:**
  - ✅ All buttons show hover effect
  - ✅ Color change or shadow effect
  - ✅ Cursor changes to pointer
  - ✅ Consistent across all pages
- **Assertion:** Hover effects work

#### Test 9.1.2: Button Active/Pressed States

- **Location:** Toggle buttons or radio selections
- **Action:** Click to activate
- **Expected Result:**
  - ✅ Active state visually distinct
  - ✅ Checkmark or highlight shown
  - ✅ State persists
- **Assertion:** Active state clear

#### Test 9.1.3: Button Disabled States

- **Location:** Disabled buttons (quantity min, first page, etc.)
- **Action:** Observe disabled buttons
- **Expected Result:**
  - ✅ Greyed out/faded appearance
  - ✅ Cursor shows "not-allowed"
  - ✅ Hover effects don't appear
  - ✅ Cannot click
- **Assertion:** Disabled state clear

#### Test 9.1.4: Color Contrast

- **Location:** All buttons and text
- **Action:** Test with contrast checker or visual inspection
- **Expected Result:**
  - ✅ Text contrast ≥ 4.5:1 for normal text
  - ✅ Button text readable on background
  - ✅ Badge text readable
- **Assertion:** WCAG AA compliance

#### Test 9.1.5: Icon Visibility

- **Location:** Icon buttons (close, menu, etc.)
- **Action:** View icons
- **Expected Result:**
  - ✅ Icons clearly visible
  - ✅ Icon meanings intuitive
  - ✅ Consistent icon set used
  - ✅ Appropriate size (16-24px)
- **Assertion:** Icons clear

#### Test 9.1.6: Loading Spinner Animation

- **Location:** Loading indicators
- **Action:** Observe during loading
- **Expected Result:**
  - ✅ Spinner animates smoothly
  - ✅ Not jerky or stuttering
  - ✅ Visible enough to notice
- **Assertion:** Loading feedback clear

#### Test 9.1.7: Toast Notifications Position

- **Location:** Toast messages after actions
- **Action:** Trigger multiple toasts
- **Expected Result:**
  - ✅ Toasts appear in consistent location (top-right)
  - ✅ Don't overlap page content
  - ✅ Readable and visible
  - ✅ Auto-dismiss after 4-5 seconds
- **Assertion:** Toast placement consistent

#### Test 9.1.8: Dialog Backdrop

- **Location:** Open any dialog
- **Action:** Observe background
- **Expected Result:**
  - ✅ Background darkened/dimmed
  - ✅ Prevents interaction with background
  - ✅ Focus trapped in dialog
- **Assertion:** Dialog modal works

---

## 10. TEST EXECUTION CHECKLIST

Use this checklist to verify all button functionality:

### Quick Run (15 minutes - Critical Path Only)

- [ ] Login successful
- [ ] Search button returns results
- [ ] Add to cart button works
- [ ] Cart total updates
- [ ] Checkout button opens dialog
- [ ] Complete order button processes order
- [ ] Order confirmation displays
- [ ] Logout button logs out

### Standard Run (45 minutes - All Core Functions)

- [ ] Complete Section 1 (Dashboard)
- [ ] Complete Section 2 (Search)
- [ ] Complete Section 3 (Cart)
- [ ] Complete Section 4 (Orders)
- [ ] Complete Section 5 (Backorders)
- [ ] Complete Section 6 (Navigation)

### Comprehensive Run (60+ minutes - All Tests)

- [ ] Complete all sections including:
  - [ ] Section 7 (Mobile)
  - [ ] Section 8 (Errors)
  - [ ] Section 9 (Visuals)

---

## 11. KNOWN ISSUES & WORKAROUNDS

### Issue 1: Mini Cart Auto-Close Not Working

- **Symptom:** Mini cart stays open longer than 3 seconds
- **Workaround:** Manually close by clicking backdrop or close button
- **Status:** Fixed in latest build

### Issue 2: Quantity Increment on Out-of-Stock

- **Symptom:** Can increment quantity beyond available stock
- **Workaround:** Check stock before adding to cart
- **Status:** Pending fix - validation to be added

### Issue 3: Pagination Page Numbers

- **Symptom:** Page number not always centered
- **Workaround:** Use Next/Previous buttons which work correctly
- **Status:** UI cosmetic issue, functionality works

---

## 12. BROWSER COMPATIBILITY

All tests should pass on:

- ✅ Chrome 120+
- ✅ Firefox 121+
- ✅ Safari 17+
- ✅ Edge 120+
- ✅ Mobile Safari (iOS 16+)
- ✅ Chrome Mobile (Android 12+)

---

## Success Criteria

**All tests pass** when:

- ✅ 80+ button actions respond correctly
- ✅ No console errors
- ✅ Toasts show appropriate messages
- ✅ Loading states work correctly
- ✅ Data persists after page refresh
- ✅ Navigation between pages smooth
- ✅ Mobile experience fully functional
- ✅ Error states handled gracefully
- ✅ No duplicate submissions
- ✅ Session management working

---

## Test Results Summary

**Date Tested:** **\*\***\_\_\_\_**\*\***
**Tester Name:** **\*\***\_\_\_\_**\*\***
**Browser/Device:** **\*\***\_\_\_\_**\*\***

**Results:**

- Total Tests: 80+
- Passed: \_\_\_\_
- Failed: \_\_\_\_
- Blocked: \_\_\_\_
- Skipped: \_\_\_\_

**Critical Issues Found:**

1. ***
2. ***
3. ***

**Notes:**

---

---
