# Database Connection Testing - Complete Testing Suite

Comprehensive testing suite to verify database connectivity from the dealer portal UI.

## 📦 What's Included

### 1. **DATABASE_CONNECTION_TESTING.md** (Full Guide)
Complete testing guide covering:
- ✅ 10 automated API tests
- ✅ 9 UI-based test scenarios  
- ✅ Error handling & recovery tests
- ✅ ACID properties validation
- ✅ Performance testing
- ✅ Security tests
- ✅ Data integrity checks
- ✅ Troubleshooting guide

**Size:** ~2,500 lines | **Read Time:** 45 minutes

---

### 2. **DATABASE_CONNECTION_QUICK_START.md** (Fast Guide)
Quick reference for rapid testing:
- 🚀 Health check (2 minutes)
- 🧪 Automated test suite (5 minutes)
- 🔍 Manual testing checklist
- 🛠️ Troubleshooting quick fixes
- 📊 Performance baseline

**Size:** ~400 lines | **Read Time:** 10 minutes

---

### 3. **test-db-connection.ts** (Automated Test Script)
Executable TypeScript test suite:
- 10 automated database tests
- Tests all CRUD operations
- Validates transactions
- Tests connection pooling
- Colored output with results

**Usage:**
```bash
npx tsx test-db-connection.ts
```

**Output:** Pass/fail report with timing

---

### 4. **DATABASE_VERIFICATION.sql** (SQL Queries)
50+ SQL queries for manual verification:
- Basic connectivity tests
- Data validation queries
- Dealer/product/order checks
- Performance analysis
- Connection monitoring
- Health check queries

**Usage:**
```bash
psql -U postgres -d hotbray -f DATABASE_VERIFICATION.sql
```

---

## 🎯 Quick Start (Choose Your Path)

### Path 1: "I just want to know if DB works" (2 min)
1. Read: **DATABASE_CONNECTION_QUICK_START.md** (Step 1-2)
2. Run: `curl http://localhost:3001/health`
3. Expected: `{"status": "ok", "database": "connected"}`

### Path 2: "I want to test from the UI" (15 min)
1. Read: **DATABASE_CONNECTION_QUICK_START.md** (Step 3)
2. Open: `http://localhost:3000`
3. Login → Search → Add to Cart → Checkout
4. Verify data appears in database

### Path 3: "I want automated tests" (5 min)
1. Run: `npx tsx test-db-connection.ts`
2. View: Pass/fail report
3. Check: All 10 tests pass

### Path 4: "I want deep verification" (30 min)
1. Read: **DATABASE_CONNECTION_TESTING.md** (Full Guide)
2. Follow: Each test section
3. Run: **DATABASE_VERIFICATION.sql** queries
4. Verify: Data integrity & performance

### Path 5: "I need to debug an issue" (Varies)
1. Check: **DATABASE_CONNECTION_QUICK_START.md** (Troubleshooting)
2. Run: Relevant SQL from **DATABASE_VERIFICATION.sql**
3. Reference: Full guide for detailed explanation

---

## 🧪 Database Tests Covered

### Connectivity Tests
| Test | Validates | Expected |
|------|-----------|----------|
| Health Check | API ↔ Database connection | "connected" status |
| Login (Admin) | User table query | JWT token returned |
| Login (Dealer) | User authentication | JWT token returned |

### Data Operation Tests  
| Test | Operation | Expected |
|------|-----------|----------|
| List Dealers | SELECT query | Array of dealers |
| Product Search | JOIN query with filters | Search results |
| Get Orders | Complex JOIN with pagination | Order list |
| Add to Cart | INSERT operation | Item added |
| Checkout | TRANSACTION (multi-table) | Order created |

### Data Integrity Tests
| Test | Validates | Expected |
|------|-----------|----------|
| Atomicity | All-or-nothing transactions | No partial data |
| Consistency | Data rules enforced | Valid data only |
| Isolation | Concurrent operations | No cross-contamination |
| Durability | Data persistence | Data survives restart |

### Performance Tests
| Test | Measures | Baseline |
|------|----------|----------|
| Search Response | Query time | < 200ms |
| Pagination | OFFSET/LIMIT performance | < 300ms |
| Joins | Multi-table queries | < 150ms |
| Concurrent Requests | Connection pooling | 15-20 connections |

---

## 🚀 How to Run Tests

### Quick Health Check
```bash
# Check if database is connected
curl http://localhost:3001/health

# Expected:
# {"status":"ok","database":"connected","dbName":"hotbray"}
```

### Automated Test Suite
```bash
# Install dependencies (if needed)
npm install node-fetch

# Run all 10 tests
npx tsx test-db-connection.ts

# Output: ✅ Passed: 10, ❌ Failed: 0
```

### Manual SQL Verification
```bash
# Connect to database
psql -U postgres -d hotbray

# Run verification queries
\i DATABASE_VERIFICATION.sql

# Or run individual queries from the SQL file
```

### UI-Based Testing
```bash
# 1. Start all services (API, Web, Database)
npm run dev  # In each folder

# 2. Open browser
http://localhost:3000

# 3. Follow manual checklist in QUICK_START guide
```

---

## 📋 Test Checklist

### Before Testing
- [ ] PostgreSQL running
- [ ] API server started (port 3001)
- [ ] Web app running (port 3000)
- [ ] Environment variables set
- [ ] No errors in API logs

### Quick Tests (5 min)
- [ ] Health check passes
- [ ] Automated test suite passes
- [ ] No connection errors

### Manual Tests (15 min)
- [ ] Login successful
- [ ] Search returns results
- [ ] Add to cart works
- [ ] Order created successfully
- [ ] Orders page shows data
- [ ] Backorders visible

### Full Verification (30 min)
- [ ] All automated tests pass
- [ ] SQL verification queries complete
- [ ] Performance within baseline
- [ ] No data integrity issues
- [ ] Connection pool healthy

---

## 🔍 What Each Test Does

### Test 1: Health Check
```
Query: SELECT current_database()
Tests: API connectivity to database
Result: Returns "hotbray" if connected
```

### Test 2: Product Search
```
Query: SELECT product JOIN pricing WHERE q LIKE ...
Tests: Complex query with JOINs and filtering
Result: Returns products matching search with prices
```

### Test 3: Add to Cart
```
Query: INSERT INTO cartItem
Tests: Write operation and atomicity
Result: Item appears in cart immediately
```

### Test 4: Checkout (Transaction)
```
Query: BEGIN; INSERT orderHeader; INSERT orderLine[]; COMMIT;
Tests: Multi-table transaction handling
Result: Order created with all lines or rollback on error
```

### Test 5: Concurrent Requests
```
Query: 10× SELECT current_database() in parallel
Tests: Connection pooling under load
Result: All requests complete, connections efficient
```

---

## 📊 Performance Baseline

| Operation | Expected | Warning | Critical |
|-----------|----------|---------|----------|
| Health Check | < 50ms | > 100ms | > 500ms |
| Login | < 150ms | > 300ms | > 1000ms |
| Search | < 200ms | > 500ms | > 2000ms |
| Get Orders | < 150ms | > 300ms | > 1000ms |
| Add to Cart | < 100ms | > 200ms | > 1000ms |
| Checkout | < 500ms | > 1000ms | > 3000ms |
| Page Load | < 1s | > 2s | > 5s |

---

## 🛠️ Troubleshooting Quick Links

| Issue | Quick Fix | Full Guide |
|-------|-----------|-----------|
| "Cannot connect to database" | `sudo systemctl start postgresql` | QUICK_START.md |
| "API won't start" | Check port 3001: `lsof -i :3001` | QUICK_START.md |
| "Search returns empty" | `pnpm seed` in packages/db | QUICK_START.md |
| "Tests failing" | `curl http://localhost:3001/health` | TESTING.md |
| "Slow queries" | Run SQL perf test | DATABASE_VERIFICATION.sql |

---

## 📈 Success Metrics

✅ **All tests pass** when:
- Health check returns "connected"
- 10/10 automated tests pass
- Search < 200ms response time
- Orders load with correct data
- Cart persists across refreshes
- Concurrent requests don't fail
- No SQL errors in logs
- Data integrity verified

---

## 📚 Document Map

```
DATABASE_CONNECTION_TESTING.md (Main Guide)
├── 1. Environment Setup
├── 2. Automated API Tests (10 tests)
├── 3. UI-Based Tests (5 scenarios)
├── 4. Error Handling
├── 5. ACID Properties
├── 6. Performance Tests
├── 7. Security Tests
├── 8. Manual Checklist
├── 9. Troubleshooting
└── 10. Test Results Template

DATABASE_CONNECTION_QUICK_START.md (Fast Reference)
├── Quick Test (2 min)
├── Automated Tests (5 min)
├── Manual Checklist
├── Troubleshooting
├── Performance Baseline
└── Support

test-db-connection.ts (Automated Tests)
├── Health Check
├── Login (Admin/Dealer)
├── List Dealers
├── Product Search
├── Get Orders
├── Get Backorders
├── Add to Cart
├── Get Cart
└── Concurrent Requests

DATABASE_VERIFICATION.sql (SQL Queries)
├── Connectivity Tests
├── Data Verification
├── Dealer Tests
├── Product Tests
├── Pricing Tests
├── Order Tests
├── Cart Tests
├── Backorder Tests
├── Audit Logs
├── Performance
├── Connection Monitoring
├── Data Integrity
└── Health Checks
```

---

## 🎓 Learning Path

### Level 1: Basic (Beginner)
1. Run health check
2. Check database status
3. Read QUICK_START guide
4. Verify basic operations from UI

### Level 2: Intermediate (Developer)
1. Run automated test suite
2. Execute SQL verification queries
3. Monitor performance metrics
4. Check data integrity

### Level 3: Advanced (DBA/Engineer)
1. Deep dive into TESTING.md
2. Run all SQL diagnostic queries
3. Monitor connection pool
4. Analyze query plans
5. Performance tuning

---

## 🔗 Related Documentation

- [DEALER_UI_BUTTON_TESTING.md](DEALER_UI_BUTTON_TESTING.md) - UI button testing
- [DEALER_TEST_GUIDE.md](DEALER_TEST_GUIDE.md) - Complete test guide
- [DEALER_TESTING_OVERVIEW.md](DEALER_TESTING_OVERVIEW.md) - Testing framework
- [README.md](README.md) - Project overview

---

## 💬 Getting Help

**Quick Questions?**
- See: DATABASE_CONNECTION_QUICK_START.md (Troubleshooting)
- Run: `curl http://localhost:3001/health`

**Detailed Testing?**
- See: DATABASE_CONNECTION_TESTING.md (Full Guide)
- Run: `npx tsx test-db-connection.ts`

**Database Issues?**
- Use: DATABASE_VERIFICATION.sql (50+ diagnostic queries)
- Run: `psql -U postgres -d hotbray -f DATABASE_VERIFICATION.sql`

**Performance Concerns?**
- See: DATABASE_CONNECTION_TESTING.md (Section 6)
- Check: Performance baseline table above

---

## ✅ Test Execution Summary

**Date:** ________________
**Tester:** ________________

### Tests Run
- [ ] Health Check
- [ ] Automated Suite (10 tests)
- [ ] Manual Checklist
- [ ] SQL Verification
- [ ] Performance Testing

### Results
- Health Check: ✅ / ❌
- Automated Tests: ____ / 10 passed
- Manual Tests: ____ / ____ passed
- SQL Queries: ✅ / ❌
- Performance: Within baseline ✅ / ❌

### Notes
_________________________________
_________________________________

---

**Ready to test? Start with DATABASE_CONNECTION_QUICK_START.md** 🚀

