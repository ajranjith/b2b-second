# Dealer E2E Test Suite Documentation

## Overview

The `test-dealer-flow.ts` script provides comprehensive end-to-end testing for the dealer process, validating all major functionality flows from login through order placement.

## Test Phases

### Phase 1: Authentication

- **Test**: `Login Dealer Account`
- **Validates**:
  - Successful dealer login
  - JWT token generation
  - User and dealer account information retrieval

### Phase 2: Product Search

- **Test**: `Product Search - Basic Query`
  - Validates basic product search functionality
  - Ensures search results are returned with pricing data
- **Test**: `Product Search - With Filters`
  - Validates filtering by part type (GENUINE, BRANDED, AFTERMARKET)
  - Tests in-stock filtering
  - Verifies limit parameter

- **Test**: `Product Search - Entitlement Filtering`
  - Validates that dealer's entitlement level filters product visibility
  - Ensures GENUINE_ONLY, AFTERMARKET_ONLY, and SHOW_ALL work correctly

### Phase 3: Pricing & Product Details

- **Test**: `Get Product Detail`
  - Retrieves single product with full details
  - Validates pricing calculation
  - Checks band assignment

- **Test**: `Pricing Calculation`
  - Validates that prices are calculated based on dealer's band
  - Checks minimum price rules
  - Validates price availability status

### Phase 4: Cart Operations

- **Test**: `Get Cart`
  - Retrieves current cart for authenticated dealer user
  - Validates cart structure and totals

- **Test**: `Add Item to Cart`
  - Adds a product to cart with specified quantity
  - Validates cart is updated with correct totals

- **Test**: `Verify Cart After Add`
  - Confirms item was properly added
  - Validates pricing was applied to cart item
  - Checks line totals calculation

- **Test**: `Update Cart Item Quantity`
  - Updates quantity of existing cart item
  - Validates line total recalculation
  - Ensures cart total is updated

- **Test**: `Remove Item from Cart`
  - Removes item from cart
  - Validates item no longer exists in cart
  - Checks cart total is recalculated

### Phase 5: Order Placement

- **Test**: `Place Order (Checkout)`
  - Creates order from cart contents
  - Validates order confirmation response
  - Checks order totals match cart
  - Validates PO reference and notes are stored

### Phase 6: Order Retrieval

- **Test**: `Get Dealer Orders`
  - Retrieves list of orders for dealer
  - Validates order history is accessible
  - Checks order details are complete

## Prerequisites

### Required Environment Variables

```bash
# API endpoint
API_BASE_URL=http://localhost:3001

# Test dealer credentials (must exist in database)
DEALER_EMAIL=dealer@example.com
DEALER_PASSWORD=password123
```

### Required Database Setup

Before running tests, ensure:

1. **Database is initialized**:

   ```bash
   npm run db:seed
   ```

2. **Test dealer account exists**:
   - Email: `dealer@example.com`
   - Password: `password123`
   - Status: `ACTIVE`
   - Entitlement: `SHOW_ALL` or specific type

3. **Sample products exist**:
   - Products with codes like "bearing", "pump"
   - Products across different part types (GENUINE, BRANDED, AFTERMARKET)
   - Products with varying stock levels

4. **API server is running**:
   ```bash
   npm run dev:api
   ```

## Running Tests

### Prerequisites

Ensure all services are running:

```bash
# Terminal 1: Database & migrations
npm run db:migrate

# Terminal 2: API Server
npm run dev:api

# Terminal 3: Run tests
npx ts-node test-dealer-flow.ts
```

### Run All Tests

```bash
npx ts-node test-dealer-flow.ts
```

### Expected Output

```
🚀 STARTING DEALER E2E TESTS

✅ PASS: Login Dealer Account (145ms)
✅ PASS: Product Search - Basic Query (230ms)
✅ PASS: Product Search - With Filters (215ms)
...

============================================================
TEST RESULTS SUMMARY
============================================================

Total Tests: 13
✅ Passed: 13
❌ Failed: 0
⏱️  Total Time: 2845ms

🎉 ALL TESTS PASSED! Dealer flow is fully functional.
```

## Troubleshooting

### Test Failures

#### "Login failed: 401"

- **Cause**: Invalid credentials or user doesn't exist
- **Fix**: Create test dealer account in database with correct credentials

#### "Search failed: 403 - Forbidden"

- **Cause**: User is not a DEALER role or token is invalid
- **Fix**: Verify user role is set to 'DEALER' and token includes dealerAccountId

#### "No products found for search query"

- **Cause**: Database has no products or search index is empty
- **Fix**: Run `npm run db:seed` to populate sample data

#### "Add to cart failed: 404 - Product not found"

- **Cause**: Product code format issue or product doesn't exist
- **Fix**: Verify product exists in database with correct format

#### "Checkout failed: 422 - Cart is empty"

- **Cause**: Items were not added to cart or cart was cleared
- **Fix**: Verify add to cart test passed before running checkout

### Performance Considerations

- Each test is timed and logged
- Tests should complete in < 10 seconds total
- If tests are slow, check API server performance
- Look for slow database queries in Prisma logs

## Test Coverage Matrix

| Functionality            | Covered | Status  |
| ------------------------ | ------- | ------- |
| Dealer Authentication    | ✅      | Active  |
| Product Search           | ✅      | Active  |
| Part Type Filtering      | ✅      | Active  |
| Stock Filtering          | ✅      | Active  |
| Entitlement Filtering    | ✅      | Active  |
| Pricing Calculation      | ✅      | Active  |
| Band Assignment          | ✅      | Active  |
| Minimum Price Rules      | ✅      | Active  |
| Cart CRUD                | ✅      | Active  |
| Order Creation           | ✅      | Active  |
| Order Retrieval          | ✅      | Active  |
| Backorder Retrieval      | ⏳      | Planned |
| Order History Pagination | ⏳      | Planned |
| Cart Persistence         | ⏳      | Planned |

## Key Business Rules Validated

1. **Entitlement Rules**
   - GENUINE_ONLY: Can only see GENUINE products
   - AFTERMARKET_ONLY: Can see AFTERMARKET and BRANDED only
   - SHOW_ALL: Can see all product types

2. **Pricing Rules**
   - Prices calculated based on dealer's band assignment
   - Minimum price rule applied when applicable
   - Currency displayed in GBP

3. **Stock Rules**
   - Free stock is tracked separately from allocated stock
   - In-stock filtering respects free stock level
   - Products can be ordered beyond stock (backorder)

4. **Order Rules**
   - Cart items must have valid pricing
   - PO reference is optional but stored when provided
   - Order total matches sum of line items

## Next Steps

### Extending the Test Suite

Add tests for:

- Edge cases (zero stock, inactive products)
- Error scenarios (invalid input, insufficient permissions)
- Performance testing (large result sets)
- Concurrent operations (multiple dealers ordering simultaneously)

### Automation

Integrate with CI/CD:

```bash
# GitHub Actions workflow
npx ts-node test-dealer-flow.ts --ci --report junit
```

### Monitoring

Set up alerts for:

- Test failure notifications
- Performance degradation
- API error rates
