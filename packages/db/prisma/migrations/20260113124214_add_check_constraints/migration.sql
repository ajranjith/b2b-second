-- =====================================================
-- MIGRATION: Add CHECK Constraints for Data Integrity
-- =====================================================

-- 1. BAND CODE VALIDATION (Must be 1, 2, 3, or 4)
-- =====================================================

ALTER TABLE "DealerBandAssignment" DROP CONSTRAINT IF EXISTS bandcode_valid_check;
ALTER TABLE "DealerBandAssignment"
ADD CONSTRAINT bandcode_valid_check
CHECK ("bandCode" IN ('1', '2', '3', '4'));

ALTER TABLE "ProductPriceBand" DROP CONSTRAINT IF EXISTS productband_bandcode_check;
ALTER TABLE "ProductPriceBand"
ADD CONSTRAINT productband_bandcode_check
CHECK ("bandCode" IN ('1', '2', '3', '4'));

-- 2. PRICE VALIDATION (Must be positive)
-- =====================================================
ALTER TABLE "ProductPriceBand" DROP CONSTRAINT IF EXISTS price_positive_check;
ALTER TABLE "ProductPriceBand"
ADD CONSTRAINT price_positive_check
CHECK (price > 0);

ALTER TABLE "ProductPriceReference" DROP CONSTRAINT IF EXISTS refprice_positive_check;
ALTER TABLE "ProductPriceReference"
ADD CONSTRAINT refprice_positive_check
CHECK (
  ("costPrice" IS NULL OR "costPrice" >= 0) AND
  ("retailPrice" IS NULL OR "retailPrice" >= 0) AND
  ("tradePrice" IS NULL OR "tradePrice" >= 0) AND
  ("listPrice" IS NULL OR "listPrice" >= 0) AND
  ("minimumPrice" IS NULL OR "minimumPrice" >= 0)
);

-- 3. ORDER VALIDATION (Totals must be non-negative)
-- =====================================================
ALTER TABLE "OrderHeader" DROP CONSTRAINT IF EXISTS order_totals_check;
ALTER TABLE "OrderHeader"
ADD CONSTRAINT order_totals_check
CHECK (subtotal >= 0 AND total >= 0);

-- 4. QUANTITY VALIDATION (Must be positive)
-- =====================================================
ALTER TABLE "CartItem" DROP CONSTRAINT IF EXISTS cart_qty_positive_check;
ALTER TABLE "CartItem"
ADD CONSTRAINT cart_qty_positive_check
CHECK (qty > 0);

ALTER TABLE "OrderLine" DROP CONSTRAINT IF EXISTS orderline_qty_positive_check;
ALTER TABLE "OrderLine"
ADD CONSTRAINT orderline_qty_positive_check
CHECK (qty > 0);

-- 5. STOCK VALIDATION (Cannot be negative)
-- =====================================================
ALTER TABLE "ProductStock" DROP CONSTRAINT IF EXISTS stock_nonnegative_check;
ALTER TABLE "ProductStock"
ADD CONSTRAINT stock_nonnegative_check
CHECK ("freeStock" >= 0);

-- 6. STRING VALIDATION (Not empty after trim)
-- =====================================================
ALTER TABLE "DealerAccount" DROP CONSTRAINT IF EXISTS accountno_not_empty_check;
ALTER TABLE "DealerAccount"
ADD CONSTRAINT accountno_not_empty_check
CHECK (LENGTH(TRIM("accountNo")) > 0);

ALTER TABLE "DealerAccount" DROP CONSTRAINT IF EXISTS companyname_not_empty_check;
ALTER TABLE "DealerAccount"
ADD CONSTRAINT companyname_not_empty_check
CHECK (LENGTH(TRIM("companyName")) > 0);

ALTER TABLE "Product" DROP CONSTRAINT IF EXISTS productcode_not_empty_check;
ALTER TABLE "Product"
ADD CONSTRAINT productcode_not_empty_check
CHECK (LENGTH(TRIM("productCode")) > 0);

ALTER TABLE "Product" DROP CONSTRAINT IF EXISTS description_not_empty_check;
ALTER TABLE "Product"
ADD CONSTRAINT description_not_empty_check
CHECK (LENGTH(TRIM(description)) > 0);

-- 7. EMAIL VALIDATION (Basic format check)
-- =====================================================
ALTER TABLE "AppUser" DROP CONSTRAINT IF EXISTS email_format_check;
ALTER TABLE "AppUser"
ADD CONSTRAINT email_format_check
CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- =====================================================
-- VERIFICATION
-- =====================================================
-- Check that all constraints were created
SELECT 
    'CHECK Constraints Added: ' || COUNT(*)::text as result
FROM pg_constraint 
WHERE contype = 'c' 
  AND conname LIKE '%_check';