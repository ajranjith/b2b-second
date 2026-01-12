-- Check table structure
\d "OrderLine"

-- Get recent orders with all details
SELECT 
    oh."orderNo", 
    oh.status, 
    da."accountNo", 
    da."companyName", 
    oh."poRef", 
    oh."dispatchMethod", 
    oh.total,
    oh."createdAt",
    COUNT(ol.id) as line_count
FROM "OrderHeader" oh 
JOIN "DealerAccount" da ON oh."dealerAccountId" = da.id 
LEFT JOIN "OrderLine" ol ON ol."orderHeaderId" = oh.id
WHERE da."accountNo" = 'DEAL001'
GROUP BY oh.id, oh."orderNo", oh.status, da."accountNo", da."companyName", oh."poRef", oh."dispatchMethod", oh.total, oh."createdAt"
ORDER BY oh."createdAt" DESC;
