-- Check recent orders with dealer information
SELECT 
    oh."orderNo", 
    oh.status, 
    da."accountNo", 
    da."companyName", 
    oh."poRef", 
    oh."dispatchMethod", 
    oh.total, 
    oh."createdAt" 
FROM "OrderHeader" oh 
JOIN "DealerAccount" da ON oh."dealerAccountId" = da.id 
ORDER BY oh."createdAt" DESC 
LIMIT 5;

-- Count orders by status for DEAL001
SELECT 
    COUNT(*) as total_orders, 
    oh.status 
FROM "OrderHeader" oh 
JOIN "DealerAccount" da ON oh."dealerAccountId" = da.id 
WHERE da."accountNo" = 'DEAL001' 
GROUP BY oh.status;

-- Check order lines (using correct column name)
SELECT 
    ol."productCodeSnapshot", 
    ol."descriptionSnapshot", 
    ol.qty, 
    ol."unitPriceSnapshot", 
    oh."orderNo" 
FROM "OrderLine" ol 
JOIN "OrderHeader" oh ON ol."orderHeaderId" = oh.id 
ORDER BY oh."createdAt" DESC 
LIMIT 10;
