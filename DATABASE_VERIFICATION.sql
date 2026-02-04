-- =============================================================================
-- DATABASE CONNECTION VERIFICATION - SQL QUERIES
-- =============================================================================
-- These SQL queries allow you to verify database connectivity and data 
-- integrity directly from PostgreSQL.
--
-- Run with: psql -U postgres -d hotbray -f DATABASE_VERIFICATION.sql
-- Or connect interactively: psql -U postgres -d hotbray
-- =============================================================================

-- =============================================================================
-- 1. BASIC CONNECTIVITY TEST
-- =============================================================================

-- Test 1.1: Verify database connection
SELECT current_database() as "Connected Database",
       current_user as "Current User",
       now() as "Server Time";

-- Expected Output:
-- Connected Database | Current User | Server Time
-- hotbray            | postgres     | 2024-01-16 10:30:00

-- Test 1.2: Check database size
SELECT 
    pg_database.datname,
    pg_size_pretty(pg_database_size(pg_database.datname)) AS size
FROM pg_database
WHERE datname = 'hotbray';

-- Expected Output:
-- datname | size
-- hotbray | 15 MB

-- Test 1.3: List all tables (data exists)
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Expected Output: Shows all Prisma tables with sizes


-- =============================================================================
-- 2. DATA VERIFICATION TESTS
-- =============================================================================

-- Test 2.1: Count records in each table
SELECT 
    'Product' as table_name, COUNT(*) as record_count FROM "Product"
UNION ALL
SELECT 'ProductStock', COUNT(*) FROM "ProductStock"
UNION ALL
SELECT 'DealerAccount', COUNT(*) FROM "DealerAccount"
UNION ALL
SELECT 'DealerUser', COUNT(*) FROM "DealerUser"
UNION ALL
SELECT 'AppUser', COUNT(*) FROM "AppUser"
UNION ALL
SELECT 'PricingRule', COUNT(*) FROM "PricingRule"
UNION ALL
SELECT 'OrderHeader', COUNT(*) FROM "OrderHeader"
UNION ALL
SELECT 'OrderLine', COUNT(*) FROM "OrderLine"
UNION ALL
SELECT 'CartItem', COUNT(*) FROM "CartItem"
UNION ALL
SELECT 'Cart', COUNT(*) FROM "Cart"
ORDER BY record_count DESC;

-- Expected Output: Shows record counts for all tables


-- =============================================================================
-- 3. DEALER-SPECIFIC TESTS
-- =============================================================================

-- Test 3.1: List all dealers
SELECT 
    id,
    accountNo,
    companyName,
    status,
    entitlement,
    createdAt
FROM "DealerAccount"
ORDER BY createdAt DESC
LIMIT 10;

-- Expected Output: Shows recent dealers

-- Test 3.2: Get specific dealer with user info
SELECT 
    d.id,
    d.accountNo,
    d.companyName,
    d.status,
    d.entitlement,
    u.firstName,
    u.lastName,
    au.email,
    au.isActive,
    au.lastLoginAt
FROM "DealerAccount" d
LEFT JOIN "DealerUser" du ON d.id = du.dealerAccountId
LEFT JOIN "AppUser" au ON du.userId = au.id
LEFT JOIN "User" u ON du.userId = u.id
WHERE d.accountNo = 'DEALER-001'  -- Change to your dealer account
ORDER BY au.createdAt DESC;

-- Expected Output: Full dealer profile with contact info

-- Test 3.3: Check dealer entitlements
SELECT DISTINCT
    entitlement,
    COUNT(*) as dealer_count
FROM "DealerAccount"
GROUP BY entitlement;

-- Expected Output:
-- entitlement      | dealer_count
-- GENUINE_ONLY     | 5
-- AFTERMARKET_ONLY | 3
-- SHOW_ALL         | 2


-- =============================================================================
-- 4. PRODUCT CATALOG TESTS
-- =============================================================================

-- Test 4.1: List products by type
SELECT 
    partType,
    COUNT(*) as count,
    MIN(price) as min_price,
    MAX(price) as max_price,
    AVG(price) as avg_price
FROM "Product"
GROUP BY partType
ORDER BY count DESC;

-- Expected Output:
-- partType    | count | min_price | max_price | avg_price
-- GENUINE     | 150   | 10.00     | 500.00    | 125.50
-- AFTERMARKET | 100   | 5.00      | 300.00    | 85.00
-- BRANDED     | 75    | 20.00     | 400.00    | 150.00

-- Test 4.2: Search for products (like UI search)
SELECT 
    productCode,
    description,
    partType,
    price,
    ps.freeStock,
    ps.allocatedStock,
    ps.reservedStock
FROM "Product" p
LEFT JOIN "ProductStock" ps ON p.id = ps.productId
WHERE LOWER(p.description) LIKE LOWER('%bearing%')
OR LOWER(p.productCode) LIKE LOWER('%bearing%')
LIMIT 20;

-- Expected Output: Products matching "bearing"

-- Test 4.3: Check stock levels
SELECT 
    p.productCode,
    p.description,
    ps.freeStock,
    ps.allocatedStock,
    ps.reservedStock,
    (ps.freeStock + ps.allocatedStock + ps.reservedStock) as total_stock
FROM "Product" p
LEFT JOIN "ProductStock" ps ON p.id = ps.productId
WHERE ps.freeStock <= 5
ORDER BY ps.freeStock ASC
LIMIT 20;

-- Expected Output: Low stock items


-- =============================================================================
-- 5. PRICING TESTS
-- =============================================================================

-- Test 5.1: Check pricing rules for a dealer
SELECT 
    pr.id,
    pr.dealerAccountId,
    p.productCode,
    p.description,
    pr.bandLevel,
    pr.bandPrice,
    pr.minimumPrice,
    pr.discountPercent,
    pr.effectiveFrom,
    pr.effectiveTo
FROM "PricingRule" pr
JOIN "Product" p ON pr.productId = p.id
WHERE pr.dealerAccountId = (
    SELECT id FROM "DealerAccount" LIMIT 1
)
LIMIT 20;

-- Expected Output: Pricing rules for dealer

-- Test 5.2: Compare pricing across dealers
SELECT 
    d.companyName,
    p.productCode,
    p.price as base_price,
    pr.bandPrice,
    pr.minimumPrice,
    ROUND(100.0 * (pr.bandPrice - p.price) / p.price, 2) as discount_percent
FROM "PricingRule" pr
JOIN "DealerAccount" d ON pr.dealerAccountId = d.id
JOIN "Product" p ON pr.productId = p.id
WHERE p.productCode = 'LR071485'  -- Change to your product
ORDER BY pr.bandPrice DESC
LIMIT 10;

-- Expected Output: Pricing for same product across dealers


-- =============================================================================
-- 6. ORDER TESTS
-- =============================================================================

-- Test 6.1: List recent orders
SELECT 
    oh.orderNo,
    oh.createdAt,
    d.companyName,
    oh.status,
    oh.subtotal,
    COUNT(ol.id) as line_count
FROM "OrderHeader" oh
JOIN "DealerAccount" d ON oh.dealerAccountId = d.id
LEFT JOIN "OrderLine" ol ON oh.id = ol.orderHeaderId
GROUP BY oh.id, d.id
ORDER BY oh.createdAt DESC
LIMIT 10;

-- Expected Output: Recent orders with line counts

-- Test 6.2: Get order details with line items
SELECT 
    oh.orderNo,
    ol.lineNo,
    p.productCode,
    p.description,
    ol.qty,
    ol.price,
    (ol.qty * ol.price) as line_total
FROM "OrderHeader" oh
JOIN "OrderLine" ol ON oh.id = ol.orderHeaderId
JOIN "Product" p ON ol.productId = p.id
WHERE oh.orderNo = 'ORD-2024-001234'  -- Change to your order
ORDER BY ol.lineNo;

-- Expected Output: Order line items with totals

-- Test 6.3: Order status distribution
SELECT 
    status,
    COUNT(*) as order_count,
    SUM(subtotal) as total_value
FROM "OrderHeader"
GROUP BY status
ORDER BY order_count DESC;

-- Expected Output:
-- status     | order_count | total_value
-- PROCESSING | 15          | 12500.00
-- SHIPPED    | 8           | 8900.00
-- CANCELLED  | 2           | 1200.00


-- =============================================================================
-- 7. CART TESTS
-- =============================================================================

-- Test 7.1: Check active carts
SELECT 
    c.id,
    du.dealerAccountId,
    d.companyName,
    COUNT(ci.id) as item_count,
    c.subtotal,
    c.updatedAt
FROM "Cart" c
LEFT JOIN "DealerUser" du ON c.dealerUserId = du.userId
LEFT JOIN "DealerAccount" d ON du.dealerAccountId = d.id
LEFT JOIN "CartItem" ci ON c.id = ci.cartId
GROUP BY c.id, du.dealerAccountId, d.id
ORDER BY c.updatedAt DESC
LIMIT 10;

-- Expected Output: Active shopping carts

-- Test 7.2: Get cart items for a user
SELECT 
    ci.id,
    p.productCode,
    p.description,
    ci.qty,
    ci.price,
    (ci.qty * ci.price) as line_total
FROM "CartItem" ci
JOIN "Cart" c ON ci.cartId = c.id
JOIN "Product" p ON ci.productId = p.id
WHERE c.id = 'cart_id_here'  -- Change to your cart ID
ORDER BY ci.createdAt DESC;

-- Expected Output: Items in cart


-- =============================================================================
-- 8. BACKORDER TESTS
-- =============================================================================

-- Test 8.1: Check backorder datasets
SELECT 
    id,
    "createdAt",
    "completedAt",
    "isActive",
    COUNT(*) OVER() as line_count
FROM "BackorderDataset"
ORDER BY "createdAt" DESC
LIMIT 10;

-- Expected Output: Backorder batches

-- Test 8.2: Get backorders for a dealer
SELECT 
    bl.accountNo,
    bl.part as productCode,
    bl.description,
    bl.qtyOrdered,
    bl.qtyOutstanding,
    bl.inWh as inWarehouse
FROM "BackorderLine" bl
JOIN "BackorderDataset" bd ON bl.datasetId = bd.id
WHERE bd.isActive = true
AND bl.accountNo = 'ACC-001'  -- Change to your account
ORDER BY bl.part ASC
LIMIT 20;

-- Expected Output: Outstanding backorders


-- =============================================================================
-- 9. AUDIT LOG TESTS
-- =============================================================================

-- Test 9.1: Recent audit entries
SELECT 
    id,
    "createdAt",
    action,
    "entityType",
    "entityId",
    "actorType",
    "statusCode"
FROM "AuditLog"
ORDER BY "createdAt" DESC
LIMIT 20;

-- Expected Output: Recent audit trail

-- Test 9.2: Activity by action type
SELECT 
    action,
    COUNT(*) as count,
    MAX("createdAt") as last_action
FROM "AuditLog"
WHERE "createdAt" > NOW() - INTERVAL '7 days'
GROUP BY action
ORDER BY count DESC;

-- Expected Output: Recent activity summary

-- Test 9.3: User activity
SELECT 
    au.email,
    COUNT(*) as action_count,
    MAX(al."createdAt") as last_action
FROM "AuditLog" al
LEFT JOIN "AppUser" au ON al."actorUserId" = au.id
WHERE "createdAt" > NOW() - INTERVAL '7 days'
GROUP BY au.email
ORDER BY action_count DESC
LIMIT 20;

-- Expected Output: Activity by user


-- =============================================================================
-- 10. PERFORMANCE TESTS
-- =============================================================================

-- Test 10.1: Query performance - Product search
EXPLAIN ANALYZE
SELECT p.id, p.productCode, p.description, p.price, ps.freeStock
FROM "Product" p
LEFT JOIN "ProductStock" ps ON p.id = ps.productId
WHERE LOWER(p.description) LIKE LOWER('%bearing%')
LIMIT 20;

-- Look for: Seq Scan vs Index Scan (Index is faster)

-- Test 10.2: Query performance - Order retrieval
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
WHERE oh.dealerAccountId = 'dealer_123'
ORDER BY oh.createdAt DESC;

-- Look for: Uses indexes on foreign keys

-- Test 10.3: Table size analysis
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - 
        pg_relation_size(schemaname||'.'||tablename)) as indexes_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Expected Output: Table and index sizes


-- =============================================================================
-- 11. CONNECTION POOL MONITORING
-- =============================================================================

-- Test 11.1: Active connections
SELECT 
    usename,
    application_name,
    state,
    COUNT(*) as connection_count,
    MAX(query_start) as last_query_start
FROM pg_stat_activity
WHERE datname = 'hotbray'
GROUP BY usename, application_name, state
ORDER BY connection_count DESC;

-- Expected Output: ~5-20 connections under normal load

-- Test 11.2: Long-running queries
SELECT 
    pid,
    usename,
    application_name,
    state,
    query_start,
    NOW() - query_start as duration,
    query
FROM pg_stat_activity
WHERE datname = 'hotbray'
AND state != 'idle'
AND query_start < NOW() - INTERVAL '30 seconds'
ORDER BY query_start;

-- Expected Output: Should be empty (no long-running queries)

-- Test 11.3: Connection limits
SHOW max_connections;
-- Expected: 100+ (default is usually 100)

SELECT 
    count(*) as active_connections,
    max_conn::text as max_connections,
    ROUND(100.0 * count(*) / max_conn, 2) as utilization_percent
FROM (
    SELECT COUNT(*) FROM pg_stat_activity WHERE datname = 'hotbray'
) active,
(
    SELECT setting::int as max_conn FROM pg_settings WHERE name = 'max_connections'
) limits;

-- Expected Output:
-- active_connections | max_connections | utilization_percent
-- 12                 | 100             | 12.00


-- =============================================================================
-- 12. DATA INTEGRITY CHECKS
-- =============================================================================

-- Test 12.1: Check referential integrity - Orders
SELECT 
    oh.id as order_id,
    oh.orderNo,
    ol.id as line_id,
    CASE WHEN p.id IS NULL THEN 'MISSING_PRODUCT' ELSE 'OK' END as product_status
FROM "OrderHeader" oh
LEFT JOIN "OrderLine" ol ON oh.id = ol.orderHeaderId
LEFT JOIN "Product" p ON ol.productId = p.id
WHERE p.id IS NULL
LIMIT 20;

-- Expected Output: Empty (no orphaned records)

-- Test 12.2: Check for duplicate products
SELECT 
    productCode,
    COUNT(*) as count
FROM "Product"
GROUP BY productCode
HAVING COUNT(*) > 1;

-- Expected Output: Empty (unique product codes)

-- Test 12.3: Validate pricing consistency
SELECT 
    p.id,
    p.productCode,
    pr.bandPrice,
    pr.minimumPrice,
    CASE 
        WHEN pr.bandPrice < pr.minimumPrice THEN 'PRICING_ERROR'
        ELSE 'OK'
    END as status
FROM "PricingRule" pr
JOIN "Product" p ON pr.productId = p.id
WHERE pr.bandPrice < pr.minimumPrice;

-- Expected Output: Empty (pricing rules valid)


-- =============================================================================
-- 13. CUSTOM DIAGNOSTIC QUERIES
-- =============================================================================

-- Test 13.1: Full system health check
SELECT 
    'Database Connection' as check_name,
    CASE WHEN current_database() = 'hotbray' THEN 'PASS' ELSE 'FAIL' END as status
UNION ALL
SELECT 'Table Count',
    CASE WHEN (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public') > 20 
        THEN 'PASS' ELSE 'FAIL' END
UNION ALL
SELECT 'Data Exists (Products)',
    CASE WHEN (SELECT COUNT(*) FROM "Product") > 0 THEN 'PASS' ELSE 'FAIL' END
UNION ALL
SELECT 'Data Exists (Dealers)',
    CASE WHEN (SELECT COUNT(*) FROM "DealerAccount") > 0 THEN 'PASS' ELSE 'FAIL' END
UNION ALL
SELECT 'Data Exists (Orders)',
    CASE WHEN (SELECT COUNT(*) FROM "OrderHeader") > 0 THEN 'PASS' ELSE 'FAIL' END
UNION ALL
SELECT 'No Long Queries',
    CASE WHEN (SELECT COUNT(*) FROM pg_stat_activity 
        WHERE datname = 'hotbray' 
        AND state != 'idle'
        AND query_start < NOW() - INTERVAL '1 minute') = 0 
    THEN 'PASS' ELSE 'FAIL' END
UNION ALL
SELECT 'Connection Pool Healthy',
    CASE WHEN (SELECT COUNT(*) FROM pg_stat_activity WHERE datname = 'hotbray') < 50
        THEN 'PASS' ELSE 'FAIL' END;

-- Expected Output: All checks PASS


-- =============================================================================
-- CLEANUP / RESET (USE WITH CAUTION!)
-- =============================================================================

-- WARNING: These queries DELETE data! Only use for testing!

-- Clear test cart items (keep one cart for testing)
-- DELETE FROM "CartItem" WHERE "createdAt" < NOW() - INTERVAL '1 day';

-- Clear old test orders (keep recent orders)
-- DELETE FROM "OrderHeader" WHERE "createdAt" < NOW() - INTERVAL '30 days';

-- Verify deletion
-- SELECT COUNT(*) FROM "OrderHeader";

