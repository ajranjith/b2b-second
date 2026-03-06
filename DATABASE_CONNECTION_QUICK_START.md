# Database Connection Testing - Quick Start

Fast guide to test database connectivity from the UI.

## 🚀 Quick Test (2 minutes)

### Step 1: Start Services

```bash
# Terminal 1: Start PostgreSQL
sudo systemctl start postgresql

# Terminal 2: Start API server
cd apps/api
npm run dev

# Terminal 3: Start Web app
cd apps/web
npm run dev
```

### Step 2: Run Health Check

```bash
# Simple health check
curl http://localhost:3001/health
```

**Expected Output:**

```json
{
  "status": "ok",
  "database": "connected",
  "dbName": "hotbray"
}
```

### Step 3: Test from Browser

1. Open `http://localhost:3000`
2. Login with dealer credentials
3. Go to Search page
4. Search for "bearing" → Should return results from database
5. Add item to cart → Should update database
6. Go to Orders → Should display orders from database

---

## 🧪 Automated Tests (5 minutes)

### Run Complete Test Suite

```bash
npx tsx test-db-connection.ts
```

**Output:**

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

---

## 🔍 What Gets Tested

| Test                | Operation                                      | Expected               |
| ------------------- | ---------------------------------------------- | ---------------------- |
| Health Check        | `SELECT current_database()`                    | Connected to "hotbray" |
| Admin Login         | `SELECT appUser WHERE email = ...`             | JWT token returned     |
| Dealer Login        | `SELECT appUser WHERE email = ...`             | JWT token returned     |
| List Dealers        | `SELECT dealerAccount LIMIT 10`                | Array of dealers       |
| Product Search      | `SELECT product JOIN pricing WHERE q LIKE ...` | Search results         |
| Get Orders          | `SELECT orderHeader JOIN orderLine`            | Dealer's orders        |
| Get Backorders      | `SELECT backorderLine WHERE accountNo = ...`   | Backorder list         |
| Add to Cart         | `INSERT INTO cartItem`                         | Item added             |
| Get Cart            | `SELECT cart JOIN cartItem JOIN product`       | Cart with items        |
| Concurrent Requests | 10× `SELECT current_database()`                | All succeed            |

---

## 🛠️ Manual Testing Checklist

### Before Testing

- [ ] PostgreSQL running: `psql -U postgres`
- [ ] API server started (no errors in logs)
- [ ] Web app started (can access localhost:3000)
- [ ] Health check passes: `curl http://localhost:3001/health`

### Test Scenarios

#### 1️⃣ Search → Results from Database

```
Navigate: /dealer/search
Action: Search for "bearing"
Verify:
  - Results displayed from Product table
  - Filtered by dealer entitlement
  - Prices from PricingRule table
  - Stock from ProductStock table
```

#### 2️⃣ Add to Cart → Database Inserts

```
Navigate: /dealer/search
Action: Add 3 units of item to cart
Verify:
  - CartItem record created
  - Cart total updated
  - Item count updates in header
  - Persists on page refresh
```

#### 3️⃣ Checkout → Transaction

```
Navigate: /dealer/cart
Action: Complete order
Verify:
  - OrderHeader record created
  - OrderLine records created (one per item)
  - Cart cleared
  - Order appears in /dealer/orders
  - Audit log created
```

#### 4️⃣ Orders Page → Data Persistence

```
Navigate: /dealer/orders
Verify:
  - All placed orders displayed
  - Recent first (ORDER BY createdAt DESC)
  - Order totals correct
  - Pagination works (20 per page)
  - Click to expand shows line items
```

#### 5️⃣ Backorders Page → Complex Query

```
Navigate: /dealer/backorders
Verify:
  - Table displays all backorder lines
  - Filtered by dealer account
  - Data from BackorderDataset
  - Refresh button updates data
  - Sort by columns works
```

---

## 🔧 Troubleshooting

### "Cannot connect to database"

**Check if PostgreSQL is running:**

```bash
sudo systemctl status postgresql

# If not running:
sudo systemctl start postgresql

# Verify connection:
psql -U postgres -d hotbray -c "SELECT 1;"
```

**Check DATABASE_URL:**

```bash
cat packages/db/.env | grep DATABASE_URL
# Should be: postgresql://postgres:postgres@localhost:5432/hotbray
```

**Check API logs:**

```bash
# Look for database connection error
tail -20 logs/api.log | grep -i "database\|error\|prisma"
```

---

### "Health check failed"

**Verify API is running:**

```bash
curl http://localhost:3001/health
```

**If no response, API not running:**

```bash
# Start API
cd apps/api
npm run dev

# Check for startup errors
# Look for: "✅ Routes registered successfully"
```

---

### "Search returns empty results"

**Check data in database:**

```bash
psql -U postgres -d hotbray -c "SELECT COUNT(*) FROM \"Product\";"
```

**If count is 0, seed data:**

```bash
cd packages/db
pnpm seed
```

---

### "Concurrent test fails"

**Check connection pool:**

```sql
-- Connect to PostgreSQL
psql -U postgres -d hotbray

-- Check active connections
SELECT count(*) FROM pg_stat_activity WHERE datname = 'hotbray';

-- Should be ~10-20 under test load
```

**If too many connections:**

1. Restart API server
2. Check for connection leaks
3. Increase max_connections if needed

---

## 📊 Performance Baseline

Expected response times for database operations:

| Operation    | Expected Time | Warning  | Critical |
| ------------ | ------------- | -------- | -------- |
| Health Check | < 50ms        | > 100ms  | > 500ms  |
| Login        | < 150ms       | > 300ms  | > 1000ms |
| Search       | < 200ms       | > 500ms  | > 2000ms |
| Get Orders   | < 150ms       | > 300ms  | > 1000ms |
| Add to Cart  | < 100ms       | > 200ms  | > 1000ms |
| Checkout     | < 500ms       | > 1000ms | > 3000ms |

---

## 📋 Test Execution Log

**Date:** **\*\***\_\_\_\_**\*\***
**Tester:** **\*\***\_\_\_\_**\*\***

### Health Check

```
curl http://localhost:3001/health
Status: ✅ / ❌
Response Time: _______ ms
```

### Login Test

```
Email: [test credentials]
Status: ✅ / ❌
Response Time: _______ ms
Token Received: Yes / No
```

### Search Test

```
Query: "bearing"
Status: ✅ / ❌
Results Count: _______
Response Time: _______ ms
Filtered by Entitlement: Yes / No
```

### Cart Test

```
Add Item: "bearing" qty:3
Status: ✅ / ❌
Response Time: _______ ms
Data Persisted: Yes / No
```

### Order Test

```
Checkout: [cart items]
Status: ✅ / ❌
Response Time: _______ ms
Order Created: Yes / No
Order ID: _______
```

### Automated Test Suite

```
npx tsx test-db-connection.ts
Total Tests: _______
Passed: _______
Failed: _______
Errors: _______
Total Duration: _______ seconds
```

---

## 🎯 Success Criteria

All database connection tests pass when:

✅ Health check returns "connected"
✅ All CRUD operations work (Create, Read, Update, Delete)
✅ Complex queries with JOINs return correct data
✅ Transactions work (order + line items created atomically)
✅ Concurrent requests don't fail
✅ Data persists across page refreshes
✅ Response times within baseline
✅ Error handling is graceful
✅ No SQL errors in logs
✅ Audit logs created for actions

---

## 📚 Related Documentation

- [DATABASE_CONNECTION_TESTING.md](DATABASE_CONNECTION_TESTING.md) - Full testing guide
- [DEALER_UI_BUTTON_TESTING.md](DEALER_UI_BUTTON_TESTING.md) - UI button tests
- [DEALER_TEST_GUIDE.md](DEALER_TEST_GUIDE.md) - Complete test guide

---

## 💡 Tips

1. **Test during off-peak hours** - Less server load for accurate metrics
2. **Clear browser cache** - Ensures fresh data from API
3. **Check API logs** - Look for SQL queries and errors
4. **Monitor database** - Watch connections and query time
5. **Use DevTools** - Check network tab for request times

---

## 🚨 Quick Support

**API won't start?**

```bash
# Check port 3001
lsof -i :3001

# Kill process using port
pkill -f "node.*3001"

# Try again
npm run dev
```

**Database won't connect?**

```bash
# Check PostgreSQL
sudo systemctl status postgresql

# Restart
sudo systemctl restart postgresql

# Verify
psql -U postgres -c "SELECT 1;"
```

**Tests failing?**

```bash
# Check environment
cat packages/db/.env

# Run health check
curl http://localhost:3001/health -v

# Check logs
tail -50 logs/api.log
```
