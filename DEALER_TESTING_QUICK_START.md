# Dealer E2E Testing - Quick Reference Guide

## What Was Created

Four comprehensive testing documents have been created to validate the dealer process end-to-end:

| Document                          | Purpose                    | Time        | Format          |
| --------------------------------- | -------------------------- | ----------- | --------------- |
| `test-dealer-flow.ts`             | Automated testing suite    | 3-5 min     | TypeScript/Code |
| `DEALER_TEST_GUIDE.md`            | Test setup & documentation | 5 min read  | Markdown        |
| `DEALER_MANUAL_TEST_CHECKLIST.md` | Manual testing steps       | 30-45 min   | Checklist       |
| `DEALER_TEST_SCENARIOS.md`        | Business rule scenarios    | 20-30 min   | Test scenarios  |
| `DEALER_TESTING_OVERVIEW.md`      | Complete overview          | 10 min read | Markdown        |

---

## The Dealer Process Being Tested

```
┌─────────────┐
│   Dealer    │
│   Logs In   │
└──────┬──────┘
       │
       ▼
┌─────────────────────────┐
│ Searches for Products   │
│ - By keyword            │
│ - Filtered by type      │
│ - Stock only            │
└──────┬──────────────────┘
       │
       ▼
┌──────────────────────────┐
│ Views Product Details    │
│ & Pricing                │
│ (Band-based, min price)  │
└──────┬───────────────────┘
       │
       ▼
┌──────────────────────────┐
│ Adds Items to Cart       │
│ - Multiple products      │
│ - Various quantities     │
└──────┬───────────────────┘
       │
       ▼
┌──────────────────────────┐
│ Modifies Cart            │
│ - Update quantities      │
│ - Remove items           │
│ - Review total           │
└──────┬───────────────────┘
       │
       ▼
┌──────────────────────────┐
│ Places Order             │
│ - Confirms details       │
│ - Adds PO number         │
│ - Submits payment        │
└──────┬───────────────────┘
       │
       ▼
┌──────────────────────────┐
│ Receives Confirmation    │
│ - Order number           │
│ - Total amount           │
│ - Delivery details       │
└──────┬───────────────────┘
       │
       ▼
┌──────────────────────────┐
│ Views Order History      │
│ - Past orders            │
│ - Status tracking        │
└──────────────────────────┘
```

---

## Test Execution Quick Start

### Option 1: Automated Tests (Fastest)

```bash
# Prerequisites
npm run db:migrate
npm run db:seed
npm run dev:api

# Run tests
npx ts-node test-dealer-flow.ts

# Results (example)
# ✅ PASS: Login Dealer Account (145ms)
# ✅ PASS: Product Search - Basic Query (230ms)
# ✅ PASS: Add Item to Cart (215ms)
# ... (10 more tests)
#
# 🎉 ALL TESTS PASSED! (2845ms total)
```

### Option 2: Manual Testing (Most Thorough)

```
1. Open DEALER_MANUAL_TEST_CHECKLIST.md
2. Go through 10 phases (150+ test items)
3. Use browser to test each step
4. Mark checkboxes as complete
5. Document any issues
```

### Option 3: Scenario Testing (Business Rules)

```
1. Open DEALER_TEST_SCENARIOS.md
2. Pick a scenario (e.g., "Genuine-Only Dealer")
3. Follow the test flow
4. Verify all expected outcomes
5. Check key validations
```

---

## What Gets Tested

### ✅ Authentication (Phase 1)

- Dealer login with credentials
- JWT token generation
- User and dealer account retrieval
- Authorization on subsequent requests

### ✅ Product Search (Phase 2)

- Keyword search (free text)
- Filter by part type (GENUINE, BRANDED, AFTERMARKET)
- Filter by stock status (in-stock only)
- Sorting options (price, code, stock)
- Entitlement-based filtering (dealer can only see allowed products)

### ✅ Pricing & Details (Phase 3)

- Product detail retrieval
- Price calculation based on dealer's band
- Minimum price enforcement
- Stock information display
- Product availability status

### ✅ Shopping Cart (Phase 4)

- Get cart contents
- Add items to cart
- Update item quantities
- Remove items from cart
- Cart total calculation
- Line item total calculation

### ✅ Order Placement (Phase 5)

- Checkout initiation
- PO reference entry
- Order review
- Order creation
- Order confirmation
- Order number generation

### ✅ Order History (Phase 6)

- Retrieve list of orders
- View order details
- Order status tracking
- Order total verification

---

## Critical Business Rules Validated

### 1. Entitlement Rules

| Dealer Type      | Can See                             |
| ---------------- | ----------------------------------- |
| GENUINE_ONLY     | GENUINE products only               |
| AFTERMARKET_ONLY | AFTERMARKET & BRANDED (not GENUINE) |
| SHOW_ALL         | All product types                   |

**Test:** Scenarios 1-2

### 2. Pricing Rules

- Prices based on dealer's band assignment (Band 1, 2, 3, or 4)
- Minimum price enforced (never below minimum)
- No volume discounts (band stays same for bulk orders)
- Prices calculated per product per dealer

**Test:** Scenarios 4, 9 & Manual Phase 3

### 3. Stock Rules

- Free stock tracked separately from allocated stock
- In-stock filtering respects free stock level
- Products can be backordered (even with 0 stock)
- Stock displayed in product detail and cart

**Test:** Scenario 5 & Manual Phase 2

### 4. Order Rules

- All items must have valid pricing before checkout
- PO reference is optional but stored when provided
- Order total = sum of all line items
- Order created with status PENDING

**Test:** Phase 5 & Scenario 3

### 5. Cart Rules

- Items added to personal cart (per user)
- Quantities modifiable
- Items removable
- Totals calculated correctly
- Cart persists across sessions

**Test:** Phase 4 & Scenario 6

---

## Expected Test Results

### All Tests Pass ✅

```
✅ PASS: Login Dealer Account (145ms)
✅ PASS: Product Search - Basic Query (230ms)
✅ PASS: Product Search - With Filters (215ms)
✅ PASS: Product Search - Entitlement Filtering (220ms)
✅ PASS: Get Product Detail (180ms)
✅ PASS: Pricing Calculation (195ms)
✅ PASS: Get Cart (160ms)
✅ PASS: Add Item to Cart (210ms)
✅ PASS: Verify Cart After Add (175ms)
✅ PASS: Update Cart Item Quantity (190ms)
✅ PASS: Remove Item from Cart (185ms)
✅ PASS: Place Order (Checkout) (250ms)
✅ PASS: Get Dealer Orders (200ms)

Total: 13/13 PASSED
Time: ~2.8 seconds
```

### If Tests Fail ❌

See troubleshooting section in `DEALER_TEST_GUIDE.md`

- Database not seeded → Run `npm run db:seed`
- API not running → Run `npm run dev:api`
- User not found → Create test dealer account
- Product not found → Check database has sample products

---

## Key Files Structure

```
B2B-First/
├── test-dealer-flow.ts                 # Automated tests (RUN THIS FIRST)
├── DEALER_TEST_GUIDE.md                # Setup & documentation
├── DEALER_MANUAL_TEST_CHECKLIST.md     # 150+ manual test items
├── DEALER_TEST_SCENARIOS.md            # 9 detailed scenarios
├── DEALER_TESTING_OVERVIEW.md          # Complete overview
│
├── apps/api/src/
│   ├── routes/dealer.ts                # Dealer API endpoints
│   └── services/
│       ├── DealerService.ts            # Product search & pricing
│       ├── CartService.ts              # Cart operations
│       └── OrderService.ts             # Order placement
│
├── packages/rules/src/
│   ├── rules/PricingRules.ts          # Pricing calculations
│   ├── rules/EntitlementRules.ts      # Product visibility
│   └── rules/OrderRules.ts            # Order validation
│
└── packages/db/
    └── schema.prisma                   # Database schema
```

---

## Testing Checklist

### Before Testing

- [ ] Node.js 18+ installed
- [ ] PostgreSQL running
- [ ] npm packages installed (`npm install`)
- [ ] Environment variables set
- [ ] Database schema migrated (`npm run db:migrate`)
- [ ] Sample data seeded (`npm run db:seed`)
- [ ] API server running (`npm run dev:api`)
- [ ] Web server running (`npm run dev:web`)

### Running Tests

- [ ] Automated tests pass: `npx ts-node test-dealer-flow.ts`
- [ ] All 13 tests show ✅ PASS
- [ ] Execution time < 10 seconds
- [ ] No error messages

### Manual Verification

- [ ] Complete DEALER_MANUAL_TEST_CHECKLIST.md
- [ ] All 10 phases completed
- [ ] No critical issues found
- [ ] Signed off by tester

### Scenario Validation

- [ ] Execute all 9 scenarios from DEALER_TEST_SCENARIOS.md
- [ ] Each scenario's expected outcomes met
- [ ] Business rules validated
- [ ] Edge cases handled correctly

### Sign-Off

- [ ] All automated tests PASS
- [ ] Manual checklist complete
- [ ] Scenarios validated
- [ ] Documentation reviewed
- [ ] Ready for release

---

## Contact & Support

### Documentation Reference

- **How to run tests?** → DEALER_TEST_GUIDE.md
- **What to test manually?** → DEALER_MANUAL_TEST_CHECKLIST.md
- **Specific scenarios?** → DEALER_TEST_SCENARIOS.md
- **Complete overview?** → DEALER_TESTING_OVERVIEW.md
- **This quick ref?** → DEALER_TESTING_QUICK_START.md

### Issue Resolution

1. **Test fails on login** → Check test dealer account exists in DB
2. **Search returns no results** → Run `npm run db:seed`
3. **API responds slowly** → Check server logs and database indexes
4. **Cart items not persisting** → Verify localStorage/session storage enabled
5. **Order not created** → Check OrderService logs for validation errors

---

## Success Criteria

✅ **Automated Tests:** 13/13 passing
✅ **Manual Tests:** All 150+ items completed
✅ **Scenarios:** All 9 scenarios validated
✅ **No Regressions:** Previous functionality still works
✅ **Documentation:** Updated and current

---

**Last Updated:** January 16, 2026
**Test Suite Status:** ✅ Complete
**Ready for Use:** Yes
