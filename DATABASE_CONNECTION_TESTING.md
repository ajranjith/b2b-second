# Database Connection Testing Guide - UI

Complete guide for testing database connectivity from the dealer portal UI.

## Quick Overview

**Database Setup:**

- **Type:** PostgreSQL
- **Provider:** Prisma ORM with PrismaPg adapter
- **Connection:** Via API endpoints (Fastify backend)
- **Health Check Endpoint:** `GET /health`

**Test Objectives:**

- ✅ Verify UI can communicate with database through API
- ✅ Test all data operations (read, write, update, delete)
- ✅ Verify data persistence and integrity
- ✅ Check connection error handling
- ✅ Validate transaction support

---

## 1. ENVIRONMENT SETUP

### 1.1 Check Database Configuration

**File:** [packages/db/.env](packages/db/.env)

```env
# Required environment variables
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/hotbray
NODE_ENV=development
```

**Verify:**

- [ ] `DATABASE_URL` set correctly
- [ ] PostgreSQL running on localhost:5432
- [ ] Database name is "hotbray"
- [ ] Credentials correct (postgres:postgres)

### 1.2 Check API Configuration

**Files:**

- [apps/api/src/index.ts](apps/api/src/index.ts) - Main API server
- [packages/db/src/index.ts](packages/db/src/index.ts) - Prisma client export

**Verify:**

- [ ] API running on port 3001
- [ ] Health check endpoint available
- [ ] Routes registered (auth, dealer, admin)

### 1.3 Check Web/Client Configuration

**File:** [apps/web/src/lib/api.ts](apps/web/src/lib/api.ts)

**Verify:**

- [ ] API base URL points to `http://localhost:3001`
- [ ] JWT token handling configured
- [ ] CORS enabled for web origin

---

## 2. AUTOMATED DB CONNECTION TESTS

### 2.1 Health Check Endpoint Test

**Endpoint:** `GET http://localhost:3001/health`

**Test Script:**

```bash
curl http://localhost:3001/health
```

**Expected Response:**

```json
{
  "status": "ok",
  "database": "connected",
  "dbName": "hotbray"
}
```

**Success Criteria:**

- ✅ HTTP 200 response
- ✅ `status: "ok"`
- ✅ `database: "connected"`
- ✅ `dbName: "hotbray"` displayed

---

### 2.2 Create Test Data Endpoint

**Purpose:** Test INSERT operations to database

**Route:** `POST /admin/dealers` (requires admin auth)

**Test Request:**

```bash
curl -X POST http://localhost:3001/admin/dealers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT" \
  -d '{
    "accountNo": "TEST-DB-001",
    "companyName": "DB Test Company",
    "firstName": "Test",
    "lastName": "User",
    "email": "test-db@example.com",
    "entitlement": "SHOW_ALL",
    "status": "ACTIVE"
  }'
```

**Expected Response:**

```json
{
  "id": "dealer_id_123",
  "accountNo": "TEST-DB-001",
  "companyName": "DB Test Company",
  "status": "ACTIVE",
  "entitlement": "SHOW_ALL"
}
```

**Success Criteria:**

- ✅ HTTP 201 Created
- ✅ Dealer record created
- ✅ Can retrieve the ID
- ✅ Data persisted in database

---

### 2.3 Read Test Data Endpoint

**Purpose:** Test SELECT operations from database

**Route:** `GET /admin/dealers?limit=10`

**Test Request:**

```bash
curl http://localhost:3001/admin/dealers \
  -H "Authorization: Bearer YOUR_ADMIN_JWT"
```

**Expected Response:**

```json
{
  "dealers": [
    {
      "id": "dealer_id_123",
      "accountNo": "TEST-DB-001",
      "companyName": "DB Test Company",
      "status": "ACTIVE",
      "users": []
    }
  ],
  "meta": {
    "total": 1,
    "page": 1,
    "limit": 10,
    "pages": 1
  }
}
```

**Success Criteria:**

- ✅ HTTP 200 response
- ✅ Data array returned
- ✅ Test dealer visible in results
- ✅ Pagination metadata correct

---

### 2.4 Update Test Data Endpoint

**Purpose:** Test UPDATE operations

**Route:** `PATCH /admin/dealers/{dealerId}`

**Test Request:**

```bash
curl -X PATCH http://localhost:3001/admin/dealers/dealer_id_123 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT" \
  -d '{
    "status": "INACTIVE"
  }'
```

**Expected Response:**

```json
{
  "id": "dealer_id_123",
  "status": "INACTIVE",
  "updatedAt": "2024-01-16T10:30:00Z"
}
```

**Success Criteria:**

- ✅ HTTP 200 response
- ✅ Status changed to INACTIVE
- ✅ `updatedAt` timestamp current
- ✅ Change persisted in database

---

### 2.5 Delete Test Data Endpoint

**Purpose:** Test DELETE operations

**Route:** `DELETE /admin/dealers/{dealerId}`

**Test Request:**

```bash
curl -X DELETE http://localhost:3001/admin/dealers/dealer_id_123 \
  -H "Authorization: Bearer YOUR_ADMIN_JWT"
```

**Expected Response:**

```json
{
  "success": true,
  "message": "Dealer deleted successfully"
}
```

**Success Criteria:**

- ✅ HTTP 200 response
- ✅ Dealer removed from database
- ✅ GET request returns 404 for deleted ID
- ✅ Relationships handled (cascade delete if configured)

---

### 2.6 Transaction Test

**Purpose:** Test multi-step transactions

**Route:** `POST /dealer/checkout` (creates order + line items)

**Test Request:**

```bash
curl -X POST http://localhost:3001/dealer/checkout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_DEALER_JWT" \
  -d '{
    "dispatchMethod": "STANDARD",
    "poRef": "PO-TEST-123",
    "items": [
      {
        "productId": "product_id_1",
        "qty": 2,
        "price": 100.00
      }
    ]
  }'
```

**Expected Response:**

```json
{
  "orderNo": "ORD-2024-001234",
  "dealerAccountId": "dealer_123",
  "status": "PROCESSING",
  "items": [
    {
      "productId": "product_id_1",
      "qty": 2,
      "price": 100.0,
      "lineTotal": 200.0
    }
  ],
  "subtotal": 200.0
}
```

**Success Criteria:**

- ✅ HTTP 201 Created
- ✅ Order header created
- ✅ Order line items created (2+ tables)
- ✅ All data consistent (subtotal correct)
- ✅ Transaction successful (all-or-nothing)

---

### 2.7 Concurrent Request Test

**Purpose:** Test database connection pooling under load

**Test Script:**

```bash
# Send 10 concurrent requests
for i in {1..10}; do
  curl -s http://localhost:3001/admin/dealers \
    -H "Authorization: Bearer YOUR_ADMIN_JWT" &
done
wait
```

**Expected Result:**

- ✅ All 10 requests complete
- ✅ All return HTTP 200
- ✅ No "too many connections" error
- ✅ Response times reasonable (< 500ms)
- ✅ Data consistency maintained

---

## 3. UI-BASED DATABASE TESTS

### 3.1 Search Page - Database Query Test

**Test Steps:**

1. Login as dealer
2. Navigate to `/dealer/search`
3. Search for a product (e.g., "bearing")
4. Observe results

**Database Operations Tested:**

- [ ] `Product.findMany()` - Search query
- [ ] `Entitlement` filter applied
- [ ] Pricing from `PricingRule` table
- [ ] Stock from `ProductStock` table

**Verification:**

- [ ] Search returns results from database
- [ ] Results filtered by dealer entitlement
- [ ] Prices calculated from pricing rules
- [ ] Stock quantities accurate
- [ ] No SQL errors in API logs

**Expected SQL Queries:**

```sql
-- Product search with filters
SELECT * FROM "Product"
WHERE description ILIKE '%bearing%'
AND "partType" = 'GENUINE'
LIMIT 20;

-- Pricing lookup
SELECT * FROM "PricingRule"
WHERE "productId" IN (...)
AND "dealerAccountId" = ...;

-- Stock check
SELECT * FROM "ProductStock"
WHERE "productId" IN (...)
AND "dealerAccountId" = ...;
```

---

### 3.2 Add to Cart - Database Write Test

**Test Steps:**

1. Search for product (e.g., "LR071485")
2. Set quantity to 3
3. Click "Add to Cart"
4. Observe cart update

**Database Operations Tested:**

- [ ] `CartItem.create()` - Insert new cart item
- [ ] `Cart.update()` - Update cart totals
- [ ] Transaction handling for consistency

**Verification:**

- [ ] Item added to cart table
- [ ] Quantity set correctly
- [ ] Cart total updated
- [ ] User can see item in cart
- [ ] Data persisted (page refresh shows item)

**Check in DB:**

```sql
-- Verify cart item exists
SELECT * FROM "CartItem"
WHERE "cartId" = '...'
AND "productId" = '...';

-- Check cart total
SELECT "subtotal", "itemCount" FROM "Cart"
WHERE "id" = '...';
```

---

### 3.3 Checkout - Database Transaction Test

**Test Steps:**

1. Add 2-3 items to cart
2. Navigate to cart
3. Click "Proceed to Checkout"
4. Fill dispatch method, PO reference
5. Click "Complete Order"
6. Observe confirmation

**Database Operations Tested:**

- [ ] `OrderHeader.create()` - Main order record
- [ ] `OrderLine.createMany()` - Line items
- [ ] `CartItem.deleteMany()` - Clear cart (atomic)
- [ ] `AuditLog.create()` - Audit trail
- [ ] Transaction rollback on error

**Verification:**

- [ ] Order created with correct ID
- [ ] All line items added
- [ ] Order status = "PROCESSING"
- [ ] Cart cleared after order
- [ ] Audit log entry created
- [ ] Quantity deducted from stock (if configured)

**Check in DB:**

```sql
-- Verify order
SELECT * FROM "OrderHeader"
WHERE "orderNo" = 'ORD-...';

-- Verify order lines
SELECT * FROM "OrderLine"
WHERE "orderHeaderId" = '...'
ORDER BY "lineNo";

-- Verify cart cleared
SELECT COUNT(*) FROM "CartItem"
WHERE "cartId" = '...';  -- Should be 0

-- Verify audit log
SELECT * FROM "AuditLog"
WHERE "action" = 'POST'
AND "entityType" = 'ORDER'
ORDER BY "createdAt" DESC
LIMIT 1;
```

---

### 3.4 Orders Page - Database Query Test

**Test Steps:**

1. Navigate to `/dealer/orders`
2. Observe order list
3. Click order to expand details
4. Verify all data displays

**Database Operations Tested:**

- [ ] `OrderHeader.findMany()` - List all orders
- [ ] `OrderLine.findMany()` - Load line items
- [ ] Join with `Product` table for details
- [ ] Pagination (`skip`/`take`)

**Verification:**

- [ ] All orders displayed
- [ ] Orders show recent first (DESC by date)
- [ ] Order totals correct
- [ ] Line items load when expanded
- [ ] Pagination works (20 per page)
- [ ] Product details load correctly

**Check in DB:**

```sql
-- Verify orders returned
SELECT * FROM "OrderHeader"
WHERE "dealerAccountId" = '...'
ORDER BY "createdAt" DESC
LIMIT 20;

-- Verify pagination count
SELECT COUNT(*) FROM "OrderHeader"
WHERE "dealerAccountId" = '...';
```

---

### 3.5 Backorders Page - Database Query Test

**Test Steps:**

1. Navigate to `/dealer/backorders`
2. Observe backorder list
3. Click refresh button
4. Verify data updates

**Database Operations Tested:**

- [ ] `BackorderDataset.findFirst()` - Get active dataset
- [ ] `BackorderLine.findMany()` - Load lines for dealer
- [ ] Sorting and filtering

**Verification:**

- [ ] Backorders displayed in table
- [ ] Filtering by dealer account works
- [ ] Sorting by columns works
- [ ] Refresh fetches latest data
- [ ] Last updated timestamp accurate

**Check in DB:**

```sql
-- Check active backorder dataset
SELECT * FROM "BackorderDataset"
WHERE "isActive" = true;

-- Get backorder lines for dealer
SELECT * FROM "BackorderLine"
WHERE "accountNo" = '...'
ORDER BY "part" ASC;
```

---

## 4. ERROR HANDLING & RECOVERY

### 4.1 Database Connection Loss

**Test Scenario:** Kill database connection while app is running

**Steps:**

1. Start all services (API, Web, DB)
2. Perform successful search
3. Disconnect database: `sudo systemctl stop postgresql`
4. Try to perform action in UI
5. Observe error handling

**Expected Behavior:**

- [ ] UI shows error message: "Database connection failed"
- [ ] Toast notification appears
- [ ] Button remains clickable for retry
- [ ] No "stuck" loading state
- [ ] User can reconnect database and retry

**API Response:**

```json
{
  "status": "error",
  "message": "Unable to connect to database",
  "code": "DB_CONNECTION_ERROR"
}
```

---

### 4.2 Connection Timeout

**Test Scenario:** Very slow network response

**Steps:**

1. Throttle network to 2G speed (Chrome DevTools)
2. Perform search operation
3. Wait for timeout

**Expected Behavior:**

- [ ] Request times out after 30 seconds
- [ ] Error message shown: "Request timeout"
- [ ] UI not frozen
- [ ] User can retry

---

### 4.3 Connection Pool Exhaustion

**Test Scenario:** Too many concurrent connections

**Test Script:**

```bash
# Create 100 concurrent connections
for i in {1..100}; do
  curl -s http://localhost:3001/admin/dealers \
    -H "Authorization: Bearer YOUR_ADMIN_JWT" &
done
wait
```

**Expected Behavior:**

- [ ] First ~20 succeed quickly
- [ ] Remaining queued
- [ ] No "too many connections" error
- [ ] Graceful degradation (longer wait times)
- [ ] All eventually complete

---

### 4.4 Invalid SQL/Transaction Failure

**Test Scenario:** Update with missing required field

**Request:**

```bash
curl -X PATCH http://localhost:3001/admin/dealers/dealer_123 \
  -H "Authorization: Bearer YOUR_ADMIN_JWT" \
  -d '{ "accountNo": null }' # Invalid: accountNo required
```

**Expected Behavior:**

- [ ] Validation error returned (HTTP 400)
- [ ] Clear error message
- [ ] Database not modified (transaction rolled back)
- [ ] User informed of specific problem

**Response:**

```json
{
  "error": "Validation Error",
  "message": "accountNo is required",
  "statusCode": 400
}
```

---

## 5. DATA INTEGRITY TESTS

### 5.1 ACID Properties - Atomicity

**Test:** Partially failed transaction

**Scenario:** Order with invalid product ID

```bash
curl -X POST http://localhost:3001/dealer/checkout \
  -H "Authorization: Bearer YOUR_DEALER_JWT" \
  -d '{
    "items": [
      { "productId": "valid_id", "qty": 2 },
      { "productId": "INVALID_ID", "qty": 1 }  # This will fail
    ]
  }'
```

**Expected:**

- [ ] Order NOT created (all-or-nothing)
- [ ] No partial data in database
- [ ] Clear error message to user
- [ ] Can retry with valid data

---

### 5.2 ACID Properties - Consistency

**Test:** Pricing consistency across operations

**Scenario:**

1. Add item at £100 to cart
2. While checkout is processing, admin changes price to £200
3. Complete order

**Expected:**

- [ ] Order reflects price at time of order (£100)
- [ ] Current price is £200
- [ ] Historical pricing maintained
- [ ] No double charges

---

### 5.3 ACID Properties - Isolation

**Test:** Concurrent modifications

**Scenario:**

1. Dealer A adds 10 units to cart
2. Dealer B adds 5 units to cart (same product)
3. Both complete order

**Expected:**

- [ ] Both orders created successfully
- [ ] Each dealer's cart isolated
- [ ] No cross-contamination
- [ ] Stock deducted correctly for both

---

### 5.4 ACID Properties - Durability

**Test:** Data persists after crash

**Scenario:**

1. Create order in database
2. Kill API server: `pkill -f "node.*api"`
3. Restart server
4. Query order

**Expected:**

- [ ] Order still exists in database
- [ ] Data not lost
- [ ] Can query and display order
- [ ] Durability confirmed

---

## 6. PERFORMANCE TESTS

### 6.1 Query Performance - Search

**Test:** Search performance with large dataset

**Steps:**

1. Ensure 10,000+ products in database
2. Perform search: "bearing"
3. Measure response time

**Success Criteria:**

- ✅ Response time < 500ms
- ✅ Results loaded in UI within 1 second
- ✅ UI responsive while loading
- ✅ Proper pagination working

**Monitor:**

```bash
# Watch API logs for query time
tail -f logs/api.log | grep "query"
```

---

### 6.2 Pagination Performance

**Test:** Large result sets with pagination

**Steps:**

1. Query page 1 (20 items)
2. Query page 100 (items 1981-2000)
3. Query page 500 (items 9981-10000)
4. Measure each response time

**Success Criteria:**

- ✅ Page 1 < 200ms
- ✅ Page 100 < 300ms (due to OFFSET)
- ✅ Page 500 < 500ms
- ✅ All page loads consistent

---

### 6.3 Join Performance

**Test:** Orders with related products

**Scenario:** Load order page with 50 orders

**Steps:**

1. Create orders with multiple line items
2. Load `/dealer/orders`
3. Expand multiple orders
4. Measure loading time

**Success Criteria:**

- ✅ Page loads < 1 second
- ✅ Expand orders < 300ms each
- ✅ All data fetched (no N+1 queries)
- [ ] Verify DB logs for query count

---

### 6.4 Connection Pool Efficiency

**Test:** Monitor connection usage

**Steps:**

1. Load API and check connections
2. Start 50 concurrent requests
3. Monitor connection count
4. All complete and release

**Success Criteria:**

- ✅ Initial: 5-10 connections
- ✅ Under load: 15-20 connections
- ✅ After load: Drop back to 5-10
- ✅ No connection leaks
- ✅ Pool size reasonable (not 100+)

**Monitor Pool:**

```sql
-- Check active connections
SELECT count(*) FROM pg_stat_activity;

-- Check connection to hotbray
SELECT count(*) FROM pg_stat_activity
WHERE datname = 'hotbray';
```

---

## 7. SECURITY TESTS

### 7.1 SQL Injection Prevention

**Test:** Attempt SQL injection in search

**Request:**

```bash
curl "http://localhost:3001/dealer/search?q=bearing'; DROP TABLE Product;--" \
  -H "Authorization: Bearer YOUR_DEALER_JWT"
```

**Expected:**

- [ ] Treated as literal search string
- [ ] No error in database
- [ ] Table not dropped (obviously!)
- [ ] Prisma parameterization working
- [ ] Safe output returned

---

### 7.2 Unauthorized Database Access

**Test:** Access dealer orders without auth

**Request:**

```bash
curl http://localhost:3001/dealer/orders
# No Authorization header
```

**Expected:**

- [ ] HTTP 401 Unauthorized
- [ ] No data returned
- [ ] Error message: "Unauthorized"
- [ ] Request logged for audit

---

### 7.3 Cross-Dealer Data Isolation

**Test:** Dealer A tries to see Dealer B's orders

**Steps:**

1. Login as Dealer A
2. Get Dealer A's JWT token
3. Try to query: `/dealer/orders?dealerId=dealer_b_id`

**Expected:**

- [ ] HTTP 403 Forbidden
- [ ] Only Dealer A's orders accessible
- [ ] Dealer B's data never returned
- [ ] Audit log shows attempt

---

### 7.4 Role-Based Access Control

**Test:** Dealer tries admin endpoint

**Request:**

```bash
curl -X POST http://localhost:3001/admin/dealers/reset-password \
  -H "Authorization: Bearer DEALER_JWT" \
  -d '{ ... }'
```

**Expected:**

- [ ] HTTP 403 Forbidden
- [ ] Error: "Insufficient permissions"
- [ ] Operation not executed
- [ ] Audit logged

---

## 8. MANUAL TEST CHECKLIST

### Pre-Testing Checklist

- [ ] PostgreSQL running (`psql -U postgres -d hotbray`)
- [ ] API server running (`npm run dev` in apps/api)
- [ ] Web app running (`npm run dev` in apps/web)
- [ ] Environment variables set in `.env`
- [ ] No errors in API logs on startup
- [ ] Health check returns success

### Basic Tests

- [ ] Login works
- [ ] Search returns results
- [ ] Add to cart updates total
- [ ] Checkout creates order
- [ ] Orders page lists orders
- [ ] Backorders page displays data
- [ ] Logout clears session

### Advanced Tests

- [ ] Transactions work (order + lines + audit)
- [ ] Pagination works (page 1, 2, last)
- [ ] Filters apply correctly
- [ ] Sorting works all directions
- [ ] Concurrent users don't interfere
- [ ] Data persists after page refresh
- [ ] Error messages clear and actionable

### Database-Specific Tests

- [ ] Query performance acceptable
- [ ] No memory leaks (check API memory)
- [ ] Connection pool stable
- [ ] Audit logs created for actions
- [ ] Data consistent across operations
- [ ] Deleted data truly gone
- [ ] Updated data reflected immediately

---

## 9. TROUBLESHOOTING

### Issue: "Cannot connect to database"

**Check:**

```bash
# 1. Is PostgreSQL running?
psql -U postgres

# 2. Can you access the database?
psql -U postgres -d hotbray -c "SELECT 1;"

# 3. Is DATABASE_URL set?
echo $DATABASE_URL

# 4. Check API logs for connection error
tail -50 logs/api.log | grep -i "database\|error\|prisma"
```

**Fix:**

1. Start PostgreSQL: `sudo systemctl start postgresql`
2. Verify credentials in `.env`
3. Check port 5432 is accessible: `lsof -i :5432`

---

### Issue: "Too many connections"

**Check:**

```sql
-- See active connections
SELECT count(*) FROM pg_stat_activity
WHERE datname = 'hotbray';

-- See which processes
SELECT pid, usename, state FROM pg_stat_activity
WHERE datname = 'hotbray';
```

**Fix:**

1. Increase max connections in postgresql.conf: `max_connections = 200`
2. Restart PostgreSQL
3. Restart API server to reset connection pool

---

### Issue: "Query timeout"

**Check:**

```sql
-- See long-running queries
SELECT pid, query, query_start
FROM pg_stat_activity
WHERE state != 'idle'
AND datname = 'hotbray'
ORDER BY query_start;
```

**Fix:**

1. Kill slow query: `SELECT pg_terminate_backend(pid);`
2. Check for missing database indexes
3. Add indexes to frequently queried columns

---

### Issue: "Transaction rolled back"

**Check API logs:**

- Look for: "Transaction error" or "Rollback"
- Check: Validation failures, constraint violations
- Verify: All required fields provided

**Fix:**

1. Check error message for specific issue
2. Verify data being sent is valid
3. Review database schema constraints

---

## 10. TEST RESULTS TEMPLATE

**Date Tested:** **\*\***\_\_\_\_**\*\***
**Tester Name:** **\*\***\_\_\_\_**\*\***
**Environment:** Dev / Staging / Production
**Database Version:** **\*\***\_\_\_\_**\*\***
**API Version:** **\*\***\_\_\_\_**\*\***

### Results Summary

- **Health Check:** ✅ / ❌
- **Search Query:** ✅ / ❌
- **Add to Cart:** ✅ / ❌
- **Checkout:** ✅ / ❌
- **Order Retrieval:** ✅ / ❌
- **Backorders:** ✅ / ❌

### Performance Metrics

- Search Response Time: **\_\_\_** ms
- Pagination Response Time: **\_\_\_** ms
- Checkout Response Time: **\_\_\_** ms
- Concurrent Requests Handled: **\_\_\_**

### Issues Found

1. ***
2. ***
3. ***

### Notes

---

---
