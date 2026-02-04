# Complete Database Connection Testing - Deep Dive (1+ Hour)

**Comprehensive testing workflow combining all testing methods for complete validation**

## 📅 Overview

This guide takes you through a complete 60-90 minute testing session covering:
- ✅ 10 automated database tests
- ✅ 50+ manual SQL verification queries
- ✅ Complete manual UI testing
- ✅ Performance analysis
- ✅ Data integrity validation
- ✅ Security verification

---

## ⏱️ Timeline (60-90 minutes)

| Phase | Duration | Activity |
|-------|----------|----------|
| **Setup** | 5 min | Verify environment, start services |
| **Automated Tests** | 5 min | Run 10 database tests |
| **SQL Verification** | 20 min | Execute 50+ diagnostic queries |
| **Manual UI Tests** | 20 min | Test all dealer portal features |
| **Performance Analysis** | 15 min | Analyze query performance |
| **Results & Report** | 10 min | Summarize findings |

---

## 🔧 PHASE 1: SETUP (5 minutes)

### Step 1.1: Verify PostgreSQL Connection
```bash
# Check if PostgreSQL is running
psql -U postgres -c "SELECT current_database();"

# Expected output:
# current_database
# ----------------
# postgres
```

If not running:
```bash
sudo systemctl start postgresql
```

### Step 1.2: Verify Database Exists
```bash
psql -U postgres -d hotbray -c "SELECT 1;"

# Expected: Single row with "1"
```

### Step 1.3: Start API Server (if not running)
```bash
# Terminal 1
cd apps/api
npm run dev

# Expected logs:
# 💾 Database connected: hotbray
# 🚀 Server listening on http://localhost:3001
# ✅ Routes registered successfully
```

### Step 1.4: Verify API Health
```bash
curl http://localhost:3001/health

# Expected:
# {"status":"ok","database":"connected","dbName":"hotbray"}
```

### Step 1.5: Start Web App (optional, for manual UI testing)
```bash
# Terminal 2
cd apps/web
npm run dev

# Expected:
# ready - started server on http://localhost:3000
```

**✅ Setup Complete!** All services running and connected.

---

## 🧪 PHASE 2: AUTOMATED TESTS (5 minutes)

### Step 2.1: Run Complete Test Suite
```bash
# From project root
npx tsx test-db-connection.ts
```

### Step 2.2: Expected Output
```
════════════════════════════════════════════════════════════════
  DATABASE CONNECTION TESTING - FROM UI
  API: http://localhost:3001
════════════════════════════════════════════════════════════════

✅ Health Check - Database Connection (45ms)
✅ Admin Login - Database Query (120ms)
✅ Dealer Login - Database Query (110ms)
✅ List Dealers - SELECT Query (85ms)
✅ Product Search - Complex SELECT with Joins (95ms)
✅ Get Orders - JOIN with Order Lines (78ms)
✅ Get Backorders - SELECT Backorder Dataset (65ms)
✅ Add to Cart - INSERT Cart Item (130ms)
✅ Get Cart - SELECT Cart with Items (55ms)
✅ Concurrent Requests - Connection Pool (200ms)

════════════════════════════════════════════════════════════════
  TEST SUMMARY
════════════════════════════════════════════════════════════════

Total Tests: 10
✅ Passed:  10
❌ Failed:  0
⚠️  Errors:  0
⏭️  Skipped: 0

Total Duration: 0.98s
```

### Step 2.3: Analyze Results
Create a results file:
```bash
# Capture output
npx tsx test-db-connection.ts | tee test-results.log

# Check for failures
grep "FAIL\|ERROR" test-results.log
```

**✅ Phase 2 Complete!** All automated tests passed.

---

## 🔍 PHASE 3: SQL VERIFICATION (20 minutes)

### Step 3.1: Basic Connectivity Checks (2 min)
```bash
psql -U postgres -d hotbray
```

Then run these queries:

**Test 3.1.1: Verify Connected**
```sql
SELECT current_database() as db,
       current_user as user,
       now() as server_time;
```

Expected: Shows "hotbray" database

**Test 3.1.2: Check Database Size**
```sql
SELECT pg_size_pretty(pg_database_size('hotbray')) as db_size;
```

Expected: Shows size (e.g., "15 MB")

**Test 3.1.3: List Tables**
```sql
SELECT COUNT(*) as table_count FROM pg_tables 
WHERE schemaname = 'public';
```

Expected: Should be 20+ tables

### Step 3.2: Data Validation (3 min)

**Test 3.2.1: Count Records**
```sql
SELECT 
    'Product' as table_name, COUNT(*) as count FROM "Product"
UNION ALL
SELECT 'DealerAccount', COUNT(*) FROM "DealerAccount"
UNION ALL
SELECT 'OrderHeader', COUNT(*) FROM "OrderHeader"
UNION ALL
SELECT 'CartItem', COUNT(*) FROM "CartItem"
ORDER BY count DESC;
```

Expected: All tables have data (count > 0)

**Test 3.2.2: Verify Dealers Exist**
```sql
SELECT id, accountNo, companyName, status 
FROM "DealerAccount" 
LIMIT 5;
```

Expected: Shows recent dealers

**Test 3.2.3: Check Products**
```sql
SELECT partType, COUNT(*) 
FROM "Product" 
GROUP BY partType;
```

Expected: Shows count by type (GENUINE, AFTERMARKET, BRANDED)

### Step 3.3: CRUD Operation Verification (5 min)

**Test 3.3.1: Verify Create - Check Recent Orders**
```sql
SELECT orderNo, createdAt, status, subtotal 
FROM "OrderHeader" 
ORDER BY createdAt DESC 
LIMIT 5;
```

Expected: Shows recent orders (created within last 24 hours)

**Test 3.3.2: Verify Read - Search Products**
```sql
SELECT productCode, description, price 
FROM "Product" 
WHERE LOWER(description) LIKE '%bearing%'
LIMIT 10;
```

Expected: Returns matching products

**Test 3.3.3: Verify Transaction - Order with Lines**
```sql
SELECT 
    oh.orderNo,
    COUNT(ol.id) as line_count,
    SUM(ol.qty * ol.price) as total
FROM "OrderHeader" oh
LEFT JOIN "OrderLine" ol ON oh.id = ol.orderHeaderId
WHERE oh.createdAt > NOW() - INTERVAL '1 day'
GROUP BY oh.id
LIMIT 5;
```

Expected: Shows orders with complete line items

### Step 3.4: Performance Analysis (5 min)

**Test 3.4.1: Check Connection Pool**
```sql
SELECT count(*) as active_connections 
FROM pg_stat_activity 
WHERE datname = 'hotbray';
```

Expected: Shows 5-20 connections (depends on activity)

**Test 3.4.2: Check for Long-Running Queries**
```sql
SELECT 
    pid,
    query_start,
    NOW() - query_start as duration
FROM pg_stat_activity
WHERE datname = 'hotbray'
AND state != 'idle'
AND query_start < NOW() - INTERVAL '5 seconds';
```

Expected: Should be empty (no long queries)

**Test 3.4.3: Table Sizes**
```sql
SELECT 
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 10;
```

Expected: Shows largest tables

### Step 3.5: Data Integrity (3 min)

**Test 3.5.1: Check Referential Integrity**
```sql
SELECT COUNT(*) as orphaned_lines
FROM "OrderLine" ol
WHERE NOT EXISTS (
    SELECT 1 FROM "OrderHeader" oh WHERE oh.id = ol.orderHeaderId
);
```

Expected: Should return 0 (no orphaned records)

**Test 3.5.2: Verify Pricing Consistency**
```sql
SELECT COUNT(*) as invalid_pricing
FROM "PricingRule" pr
WHERE pr.bandPrice < pr.minimumPrice;
```

Expected: Should return 0 (all pricing valid)

**Test 3.5.3: Check Duplicate Products**
```sql
SELECT productCode, COUNT(*) as duplicates
FROM "Product"
GROUP BY productCode
HAVING COUNT(*) > 1;
```

Expected: Should return no rows (no duplicates)

### Step 3.6: Exit psql
```sql
\q
```

**✅ Phase 3 Complete!** 50+ SQL queries verified database integrity.

---

## 👥 PHASE 4: MANUAL UI TESTING (20 minutes)

### Step 4.1: Pre-Test Checklist (1 min)
- [ ] Web app running on http://localhost:3000
- [ ] API running on http://localhost:3001
- [ ] Database connected and healthy
- [ ] Browser cache cleared (optional)
- [ ] DevTools open (Network tab)

### Step 4.2: Test Dealer Login (2 min)

**Action:**
1. Navigate to http://localhost:3000
2. Click "Dealer Login"
3. Enter credentials:
   - Email: `dealer@hotbray.com`
   - Password: `dealer123`
4. Click "Sign In"

**Verification:**
- [ ] Login successful
- [ ] Redirected to `/dealer/dashboard`
- [ ] User name displayed in header
- [ ] No console errors
- [ ] API call time < 200ms (DevTools)

**Database Check:**
```sql
SELECT email, lastLoginAt FROM "AppUser" 
WHERE email = 'dealer@hotbray.com' 
ORDER BY lastLoginAt DESC LIMIT 1;
```

Expected: `lastLoginAt` updated to current time

### Step 4.3: Test Product Search (4 min)

**Action:**
1. Click "Search Parts" in navigation
2. Enter search: "bearing"
3. Click "Search"
4. Observe results

**Verification:**
- [ ] Results displayed (10+ products)
- [ ] Each product shows:
  - Product code
  - Description
  - Part type badge (Genuine/Aftermarket/Branded)
  - Stock status
  - Price
- [ ] Quantity selector works (+/- buttons)
- [ ] No console errors
- [ ] Response time < 300ms

**Database Check:**
```sql
SELECT COUNT(*) as count FROM "Product" 
WHERE LOWER(description) LIKE '%bearing%';
```

Expected: Count matches results shown

### Step 4.4: Test Add to Cart (3 min)

**Action:**
1. Select first product
2. Set quantity to 3
3. Click "Add to Cart"
4. Observe notification

**Verification:**
- [ ] Toast notification: "Added 3x [PRODUCT] to cart!"
- [ ] Mini cart opens automatically
- [ ] Cart count in header updates (shows 3)
- [ ] Mini cart closes after 3 seconds
- [ ] No console errors
- [ ] Response time < 200ms

**Database Check:**
```sql
SELECT COUNT(*) as items, SUM(qty) as total_qty 
FROM "CartItem" ci
JOIN "Cart" c ON ci.cartId = c.id
WHERE c.dealerUserId IN (
    SELECT userId FROM "DealerUser" 
    WHERE dealerAccountId = (
        SELECT id FROM "DealerAccount" LIMIT 1
    )
);
```

Expected: Shows cart items matching UI

### Step 4.5: Test Cart Operations (3 min)

**Action:**
1. Click "Cart" in navigation
2. Observe cart page
3. Test quantity controls:
   - Click "-" button (should decrease)
   - Click "+" button (should increase)
   - Edit quantity directly
4. Check total calculation

**Verification:**
- [ ] All items displayed
- [ ] Quantities can be modified
- [ ] Cart total updates in real-time
- [ ] Line totals correct (qty × price)
- [ ] Remove button works
- [ ] Response times < 200ms

**Database Check:**
```sql
SELECT 
    SUM(ci.qty * ci.price) as calculated_total,
    c.subtotal as cart_total
FROM "CartItem" ci
JOIN "Cart" c ON ci.cartId = c.id
WHERE c.dealerUserId IN (...)
GROUP BY c.id;
```

Expected: Calculated total matches cart subtotal

### Step 4.6: Test Checkout (3 min)

**Action:**
1. Click "Proceed to Checkout"
2. Select dispatch method: "Standard Dispatch"
3. Enter PO Reference: "PO-TEST-001"
4. Enter Notes: "Test order from deep dive"
5. Click "Complete Order"

**Verification:**
- [ ] Checkout dialog opens
- [ ] All fields visible
- [ ] Order submits successfully
- [ ] Confirmation dialog appears
- [ ] Order number displayed (e.g., "ORD-2024-001234")
- [ ] Response time < 500ms

**Database Check:**
```sql
SELECT orderNo, status, createdAt 
FROM "OrderHeader" 
ORDER BY createdAt DESC 
LIMIT 1;
```

Expected: New order appears with status "PROCESSING"

### Step 4.7: Test Orders Page (2 min)

**Action:**
1. Click "View Order" from confirmation
2. Navigate to `/dealer/orders`
3. Observe order list
4. Click order to expand
5. Verify line items

**Verification:**
- [ ] New order appears at top (most recent)
- [ ] Order status shows "PROCESSING"
- [ ] Order total correct
- [ ] Line items show all products
- [ ] Pagination works (if 20+ orders)
- [ ] No console errors

**Database Check:**
```sql
SELECT 
    oh.orderNo,
    COUNT(ol.id) as line_count,
    SUM(ol.qty) as total_qty
FROM "OrderHeader" oh
LEFT JOIN "OrderLine" ol ON oh.id = ol.orderHeaderId
WHERE oh.createdAt > NOW() - INTERVAL '1 hour'
GROUP BY oh.id
ORDER BY oh.createdAt DESC
LIMIT 1;
```

Expected: Shows latest order with all lines

### Step 4.8: Test Backorders Page (1 min)

**Action:**
1. Navigate to `/dealer/backorders`
2. Observe backorder list
3. Click "Refresh" button
4. Verify data updates

**Verification:**
- [ ] Table displays backorder lines
- [ ] Columns visible: Part, Description, Qty Ordered, Outstanding, In Warehouse
- [ ] Data filters by dealer
- [ ] Refresh updates "Last Updated" timestamp
- [ ] No console errors

**Database Check:**
```sql
SELECT COUNT(*) as backorder_count
FROM "BackorderLine" bl
JOIN "BackorderDataset" bd ON bl.datasetId = bd.id
WHERE bd.isActive = true
AND bl.accountNo = (
    SELECT accountNo FROM "DealerAccount" LIMIT 1
);
```

Expected: Shows backorder count for this dealer

**✅ Phase 4 Complete!** All dealer portal features verified.

---

## 📊 PHASE 5: PERFORMANCE ANALYSIS (15 minutes)

### Step 5.1: Measure Response Times

Keep DevTools Network tab open and record:

**Test 5.1.1: Search Response Time**
```bash
# Run 5 searches and average the time
for i in {1..5}; do
    curl -s -w "\n%{time_total}\n" -o /dev/null \
    "http://localhost:3001/dealer/search?q=bearing"
done

# Expected: Average < 200ms
```

**Test 5.1.2: Login Response Time**
```bash
curl -s -w "\n%{time_total}\n" -o /dev/null \
  -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"dealer@hotbray.com","password":"dealer123"}'

# Expected: < 150ms
```

**Test 5.1.3: Get Orders Response Time**
```bash
# First get a valid token, then:
curl -s -w "\n%{time_total}\n" -o /dev/null \
  -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:3001/dealer/orders"

# Expected: < 200ms
```

### Step 5.2: Analyze Query Plans

```bash
psql -U postgres -d hotbray
```

**Test 5.2.1: Product Search Query Plan**
```sql
EXPLAIN ANALYZE
SELECT p.id, p.productCode, p.description, p.price, ps.freeStock
FROM "Product" p
LEFT JOIN "ProductStock" ps ON p.id = ps.productId
WHERE LOWER(p.description) LIKE LOWER('%bearing%')
LIMIT 20;
```

Look for:
- [ ] Uses index scans (good) not sequential scans
- [ ] Estimated rows close to actual rows
- [ ] Planning time < 5ms
- [ ] Execution time < 50ms

**Test 5.2.2: Order Retrieval Query Plan**
```sql
EXPLAIN ANALYZE
SELECT 
    oh.orderNo,
    ol.lineNo,
    p.productCode,
    ol.qty,
    ol.price
FROM "OrderHeader" oh
JOIN "OrderLine" ol ON oh.id = ol.orderHeaderId
JOIN "Product" p ON ol.productId = p.id
WHERE oh.dealerAccountId = (SELECT id FROM "DealerAccount" LIMIT 1)
ORDER BY oh.createdAt DESC;
```

Look for:
- [ ] Uses indexes on foreign keys
- [ ] No sequential scans on large tables
- [ ] Execution time < 100ms

### Step 5.3: Connection Pool Analysis

```sql
-- Check connection efficiency
SELECT 
    usename,
    application_name,
    state,
    COUNT(*) as count
FROM pg_stat_activity
WHERE datname = 'hotbray'
GROUP BY usename, application_name, state;

-- Expected: 5-20 total connections, most idle
```

### Step 5.4: Compare to Baseline

Fill in your measurements:

| Metric | Expected | Your Result | Status |
|--------|----------|-------------|--------|
| Search Time | < 200ms | _____ ms | ✅/❌ |
| Login Time | < 150ms | _____ ms | ✅/❌ |
| Orders Time | < 200ms | _____ ms | ✅/❌ |
| Checkout Time | < 500ms | _____ ms | ✅/❌ |
| Search Plan | Index scan | _______ | ✅/❌ |
| Connections | 5-20 | _____ | ✅/❌ |

**✅ Phase 5 Complete!** Performance analyzed and compared to baseline.

---

## 📋 PHASE 6: RESULTS & REPORT (10 minutes)

### Step 6.1: Create Test Report

Create file `TEST_EXECUTION_REPORT.md`:

```markdown
# Database Connection Testing - Complete Deep Dive Report

**Date:** January 16, 2026
**Duration:** 1 hour 15 minutes
**Tester:** [Your Name]
**Environment:** Development

## Executive Summary

✅ **All Testing Passed**
- Automated Tests: 10/10 ✅
- SQL Verification: 50+ queries ✅
- Manual UI Testing: 8 scenarios ✅
- Performance: Within baseline ✅
- Data Integrity: Verified ✅

## Phase Results

### Phase 1: Setup (5 min)
- [x] PostgreSQL running
- [x] Database connected
- [x] API server running
- [x] Health check passed

### Phase 2: Automated Tests (5 min)
- [x] All 10 tests passed
- [x] No errors or failures
- [x] Average test duration: 0.98 seconds
- [x] Connection pool efficient

### Phase 3: SQL Verification (20 min)
- [x] Connectivity verified
- [x] Data validation complete
- [x] CRUD operations working
- [x] Transaction handling verified
- [x] No data integrity issues
- [x] No orphaned records
- [x] Pricing rules valid

### Phase 4: Manual UI Testing (20 min)
- [x] Dealer login successful
- [x] Product search working
- [x] Add to cart functional
- [x] Cart operations correct
- [x] Checkout process complete
- [x] Orders displayed correctly
- [x] Backorders visible
- [x] All features responsive

### Phase 5: Performance Analysis (15 min)
- [x] Search response: ____ ms (Expected: < 200ms)
- [x] Login response: ____ ms (Expected: < 150ms)
- [x] Orders response: ____ ms (Expected: < 200ms)
- [x] Query plans optimized
- [x] Connection pool healthy

## Detailed Results

### Database Connectivity
- Health Check: ✅ PASS
- Connection Pool: ✅ PASS (5-20 connections)
- No Timeouts: ✅ PASS

### Data Operations
- SELECT queries: ✅ PASS
- INSERT operations: ✅ PASS
- UPDATE operations: ✅ PASS
- TRANSACTIONS: ✅ PASS
- REFERENTIAL INTEGRITY: ✅ PASS

### Performance Metrics

| Operation | Expected | Actual | Status |
|-----------|----------|--------|--------|
| Search | < 200ms | _____ | ✅/❌ |
| Login | < 150ms | _____ | ✅/❌ |
| Orders | < 200ms | _____ | ✅/❌ |
| Checkout | < 500ms | _____ | ✅/❌ |

### Data Integrity
- Orphaned Records: ✅ None found
- Duplicate Products: ✅ None found
- Pricing Rules: ✅ All valid
- Order Consistency: ✅ Verified

### Security
- SQL Injection: ✅ Protected
- Auth Required: ✅ Enforced
- Data Isolation: ✅ Working
- Audit Logs: ✅ Created

## Issues Found

1. ❌ [Issue Description]
   - Impact: [Low/Medium/High]
   - Recommendation: [Action needed]

2. ❌ [Issue Description]
   - Impact: [Low/Medium/High]
   - Recommendation: [Action needed]

## Recommendations

1. ✅ Database connectivity is production-ready
2. ✅ Performance meets expected baselines
3. ✅ Data integrity verified
4. ⚠️ [Optional improvements]

## Sign-Off

- **Overall Status:** ✅ APPROVED FOR DEPLOYMENT
- **Tested By:** [Your Name]
- **Date:** January 16, 2026
- **Next Review:** [Date]

---

## Appendix: Detailed Test Logs

### Automated Test Output
```
[Paste output from test-db-connection.ts]
```

### SQL Query Results Summary
```
[Key query results]
```

### Performance Measurements
```
[Response time data]
```
```

### Step 6.2: Create Summary Checklist

```
✅ DEEP DIVE TESTING COMPLETE

Completed Tasks:
- [x] Setup verification (5 min)
- [x] Automated tests (5 min)
- [x] SQL verification (20 min)
- [x] Manual UI testing (20 min)
- [x] Performance analysis (15 min)
- [x] Report generation (10 min)

Test Results:
- [x] Health Check: ✅ PASS
- [x] Automated Tests: 10/10 ✅ PASS
- [x] SQL Queries: 50+ ✅ PASS
- [x] UI Features: 8/8 ✅ PASS
- [x] Performance: ✅ WITHIN BASELINE
- [x] Data Integrity: ✅ VERIFIED

Issues Found: 0
Recommendations: [Noted above]

Status: ✅ READY FOR DEPLOYMENT
```

### Step 6.3: Save Results
```bash
# Save test output
npx tsx test-db-connection.ts > automated_tests.log

# Save SQL results (if captured)
psql -U postgres -d hotbray -f DATABASE_VERIFICATION.sql > sql_results.log

# Save report
# TEST_EXECUTION_REPORT.md (created manually)
```

**✅ Phase 6 Complete!** All results documented and summarized.

---

## 📈 Overall Results

### Test Summary
| Category | Tests | Passed | Failed | Status |
|----------|-------|--------|--------|--------|
| Automated | 10 | 10 | 0 | ✅ |
| SQL | 50+ | 50+ | 0 | ✅ |
| Manual UI | 8 | 8 | 0 | ✅ |
| Performance | 4 | 4 | 0 | ✅ |
| **Total** | **72+** | **72+** | **0** | **✅** |

### Performance Baseline
| Operation | Expected | Actual | Met? |
|-----------|----------|--------|------|
| Health Check | < 50ms | _____ | ✅/❌ |
| Search | < 200ms | _____ | ✅/❌ |
| Login | < 150ms | _____ | ✅/❌ |
| Orders | < 200ms | _____ | ✅/❌ |
| Checkout | < 500ms | _____ | ✅/❌ |

### Final Assessment
```
✅ DATABASE CONNECTION: VERIFIED
✅ DATA OPERATIONS: WORKING
✅ PERFORMANCE: ACCEPTABLE
✅ INTEGRITY: MAINTAINED
✅ SECURITY: ENFORCED

OVERALL STATUS: ✅ APPROVED
```

---

## 🎓 What You've Verified

By completing this deep dive, you've confirmed:

✅ **Connectivity**
- API can connect to database
- Health checks pass
- Connection pool efficient

✅ **Data Operations**
- All CRUD operations working
- Transactions atomic
- No data loss

✅ **Performance**
- Queries within baseline times
- Indexes effective
- No slow queries

✅ **Integrity**
- No orphaned records
- Pricing rules valid
- Data consistency

✅ **Security**
- SQL injection protected
- Authentication enforced
- Access controls working

✅ **Functionality**
- All dealer features work
- Cart operations correct
- Orders created successfully

---

## 📚 Additional Resources

- [DATABASE_CONNECTION_TESTING.md](DATABASE_CONNECTION_TESTING.md) - Full reference
- [DATABASE_VERIFICATION.sql](DATABASE_VERIFICATION.sql) - All SQL queries
- [test-db-connection.ts](test-db-connection.ts) - Automated test code
- [DEALER_UI_BUTTON_TESTING.md](DEALER_UI_BUTTON_TESTING.md) - UI testing guide

---

## ✅ Sign-Off

**This deep dive testing session is complete!**

You have thoroughly verified that:
1. ✅ Database connectivity works
2. ✅ All operations function correctly
3. ✅ Performance meets expectations
4. ✅ Data integrity is maintained
5. ✅ Security is in place

**Status: APPROVED FOR PRODUCTION** 🚀

