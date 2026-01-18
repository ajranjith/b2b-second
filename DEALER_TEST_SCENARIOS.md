# Dealer Process Test Scenarios & Expected Outcomes

## Scenario 1: Genuine-Only Dealer Purchasing Genuine Parts

### Setup
- Dealer: "Luxury Auto Parts Ltd" (Entitlement: GENUINE_ONLY)
- Desired Product: Land Rover engine component (Code: LR071485)

### Test Flow
```
1. Login as dealer
   → Expected: Login successful, dashboard shown
   
2. Search for "engine"
   → Expected: 
     - GENUINE products shown
     - AFTERMARKET/BRANDED products NOT shown
     - Results include LR071485
   
3. Click on LR071485
   → Expected:
     - Product detail loads
     - Shows "GENUINE" badge
     - Price shown (e.g., £2231.41 in Band 1)
     - Free stock shown
   
4. Add 10 units to cart
   → Expected:
     - Unit price: £2231.41
     - Line total: £22,314.10
     - Cart total updates to £22,314.10
   
5. Proceed to checkout
   → Expected:
     - PO number field shown
     - Order review shows item
     - Order created successfully
     
6. View order history
   → Expected:
     - Order appears in list
     - Order total matches: £22,314.10
     - Status: PENDING
```

### Key Validations
- ✅ Only GENUINE products visible
- ✅ Pricing matches band 1 pricing
- ✅ Cart calculation correct
- ✅ Order totals accurate

---

## Scenario 2: Aftermarket-Only Dealer Attempting to View Genuine Parts

### Setup
- Dealer: "Quick Fix Auto" (Entitlement: AFTERMARKET_ONLY)
- Scenario: Try to search for genuine parts

### Test Flow
```
1. Login as dealer
   → Expected: Login successful
   
2. Search for "engine" (might return aftermarket engine parts)
   → Expected:
     - AFTERMARKET products shown
     - BRANDED products shown
     - GENUINE products NOT shown
     - Results limited to compatible alternatives
   
3. Try to directly access LR071485 via URL
   → Expected:
     - Either 404 Product Not Found
     - Or error: "Product not available for your account"
   
4. Search for BRANDED alternative
   → Expected:
     - Can add BRANDED engine parts to cart
     - Pricing calculated correctly (usually lower than genuine)
```

### Key Validations
- ✅ Genuine products completely hidden
- ✅ Direct access to genuine product denied
- ✅ Can still purchase allowed categories

---

## Scenario 3: High-Volume Order with Mixed Part Types (SHOW_ALL Dealer)

### Setup
- Dealer: "Master Mechanics" (Entitlement: SHOW_ALL)
- Order: 
  - 20 × GENUINE pump (£50 each)
  - 100 × AFTERMARKET bearing (£5 each)
  - 50 × BRANDED filter (£10 each)

### Test Flow
```
1. Login
   → Expected: Successful login
   
2. Search and add items iteratively
   Item 1: Add 20 × pump
   → Expected: Line total = £1,000
   
   Item 2: Add 100 × bearing
   → Expected: 
     - Cart now has 2 lines
     - Subtotal = £1,000 + £500 = £1,500
   
   Item 3: Add 50 × filter
   → Expected:
     - Cart has 3 lines
     - Subtotal = £1,500 + £500 = £2,000

3. Review cart before checkout
   → Expected:
     - All 3 lines shown correctly
     - Quantities are accurate
     - Unit prices are correct for each part type
     - Cart total: £2,000

4. Checkout with PO "PO-MIXED-2026"
   → Expected:
     - Order created with all 170 items
     - Order total: £2,000
     - All items recordedwith correct pricing

5. Verify order detail
   → Expected:
     - 3 line items
     - Correct quantities and prices
     - Order status: PENDING
```

### Key Validations
- ✅ Multiple part types visible
- ✅ Pricing calculated separately for each type
- ✅ Cart totals accurate across types
- ✅ Order captures all item details

---

## Scenario 4: Minimum Price Rule Validation

### Setup
- Product: "Standard Bearing" (Code: LR018173)
  - Trade Price: £1.45
  - Band 1 Price: £1.38
  - Band 2 Price: £1.30
  - Band 3 Price: £1.30
  - Band 4 Price: £1.29
  - Minimum Price: £1.26
- Dealer: Band 4 dealer (should get lowest price)

### Test Flow
```
1. View product detail for LR018173
   → Expected:
     - Minimum price rule applied
     - Your Price = £1.29 (band 4 price, above minimum)
     - No "minimum applied" indicator needed
   
2. Add 1000 units to cart (bulk order)
   → Expected:
     - Unit price remains: £1.29
     - Line total: £1,290.00
     - No volume discount applied (uses fixed bands)

3. Checkout
   → Expected:
     - Order total: £1,290.00
     - Pricing rule respected throughout
```

### Key Validations
- ✅ Correct band price applied
- ✅ Minimum price enforced
- ✅ Bulk orders don't change band
- ✅ Pricing consistent in cart and order

---

## Scenario 5: Out-of-Stock / Backorder Scenario

### Setup
- Product: "Rare Engine Component" (Code: XXX999)
  - Free Stock: 0
  - Can be backordered: Yes
  - Lead Time: 30 days

### Test Flow
```
1. Search for product
   → Expected:
     - Product appears in results
     - Shows "Free Stock: 0"
     - Badge or indicator: "Backorder Available"

2. View product detail
   → Expected:
     - Stock status clearly shown: "Out of Stock"
     - Price still shown (backorder pricing)
     - Note: "Available for backorder with 30-day delivery"

3. Add to cart
   → Expected:
     - Can add quantity (system allows backorder)
     - Line added to cart with backorder indicator
     - Price same as if in stock

4. Checkout with backorder item
   → Expected:
     - Order created successfully
     - Order status: "PENDING_STOCK" or "BACKORDER"
     - Delivery date shown as estimated
```

### Key Validations
- ✅ Out-of-stock products remain purchasable
- ✅ Pricing correct for backorder items
- ✅ Order created with backorder flag
- ✅ Customer notified of lead time

---

## Scenario 6: Cart Persistence & Session Recovery

### Setup
- Dealer: Active session with items in cart
- Scenario: Network interruption or page crash

### Test Flow
```
1. Add 5 items to cart
   → Expected: Cart shows 5 items, total £500

2. Close browser (session ends)
   → Expected: Cart data persisted in local storage

3. Reopen browser and navigate to site
   → Expected:
     - User still logged in (persistent session)
     - Cart still has 5 items
     - Prices recalculated (in case changed)
     - Can proceed to checkout

4. Modify quantity of item
   → Expected: 
     - Only that line updates
     - Other items unchanged
     - Total recalculates

5. Clear cart button
   → Expected:
     - All items removed
     - Cart shows empty message
     - Session still valid
```

### Key Validations
- ✅ Cart persisted across sessions
- ✅ Session maintained
- ✅ Cart state consistent

---

## Scenario 7: Entitlement Changes Mid-Session

### Setup
- Dealer: Initial entitlement GENUINE_ONLY
- Scenario: Admin changes entitlement to SHOW_ALL

### Test Flow
```
1. Dealer searches - sees only GENUINE products
   → Expected: Only GENUINE visible

2. (Admin action) Entitlement changed to SHOW_ALL

3. Dealer refreshes search page
   → Expected:
     - Now sees AFTERMARKET and BRANDED products
     - GENUINE products still visible
     - Cart items unchanged
     - Can continue shopping

4. Add AFTERMARKET item to cart
   → Expected:
     - Item added successfully
     - Priced according to new entitlement
     - Existing GENUINE item still in cart
```

### Key Validations
- ✅ Entitlement change reflected immediately on refresh
- ✅ Product availability updated
- ✅ Existing cart not affected
- ✅ Pricing respects new entitlement

---

## Scenario 8: Concurrent Shopping & Order Placement

### Setup
- Same dealer in 2 browser windows
- Window A & B both have items in cart

### Test Flow
```
Window A:
1. Add 10 × Part A to cart
   → Expected: Cart shows 10 items

Window B:
2. Add 5 × Part B to cart
   → Expected: Cart shows 5 items

Window A:
3. Checkout with 10 × Part A
   → Expected:
     - Order created successfully
     - Order contains Part A only
     - Cart cleared

Window B:
4. Refresh cart
   → Expected:
     - Part B still in cart (not affected)
     - Quantity still 5
     - Can proceed with own order

Window B:
5. Checkout with 5 × Part B
   → Expected:
     - Order created with Part B
     - Order total different from Window A
```

### Key Validations
- ✅ Sessions are independent
- ✅ Orders don't interfere with each other
- ✅ Cart isolation maintained

---

## Scenario 9: Pricing Tier Verification

### Setup
- Dealer: Band 3 assignment for GENUINE parts
- Product: Premium bearing with price tiers
  - Band 1: £100.00 (only for premium dealers)
  - Band 2: £95.00
  - Band 3: £90.00 (dealer's band)
  - Band 4: £85.00
  - Minimum: £80.00

### Test Flow
```
1. View product detail
   → Expected:
     - Your Price: £90.00 (band 3)
     - NOT £100, £95, £85, or £80
     - Exact match to band 3 price

2. Add different quantities to test bulk
   → 1 unit: £90.00
   → 10 units: £900.00
   → 100 units: £9,000.00
   → Expected: No volume discounts, band stays same

3. Compare with Band 4 dealer
   → Expected:
     - Band 4 dealer sees £85.00
     - Same product, different dealer price
     - Both prices valid for their tiers
```

### Key Validations
- ✅ Correct band assigned
- ✅ No price modifications outside bands
- ✅ Bulk orders use same band
- ✅ Different dealers see appropriate prices

---

## Test Execution Checklist

### Before Running Tests
- [ ] Database migrated and seeded
- [ ] API server running
- [ ] Web server running
- [ ] Test dealer account created
- [ ] Sample products exist across all types
- [ ] Test data includes out-of-stock items

### Running Tests
- [ ] Scenario 1 - Genuine-only dealer: PASS / FAIL
- [ ] Scenario 2 - Aftermarket-only restrictions: PASS / FAIL
- [ ] Scenario 3 - High-volume mixed order: PASS / FAIL
- [ ] Scenario 4 - Minimum price rule: PASS / FAIL
- [ ] Scenario 5 - Backorder handling: PASS / FAIL
- [ ] Scenario 6 - Cart persistence: PASS / FAIL
- [ ] Scenario 7 - Entitlement changes: PASS / FAIL
- [ ] Scenario 8 - Concurrent sessions: PASS / FAIL
- [ ] Scenario 9 - Pricing tier accuracy: PASS / FAIL

### Issues Log
Document any failures:
1. _________________________________
2. _________________________________
3. _________________________________

### Approval
- **All tests passed**: [ ] Yes [ ] No
- **Date**: ________________
- **Tester**: ________________

