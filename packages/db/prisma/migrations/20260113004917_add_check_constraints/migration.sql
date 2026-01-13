-- 1. Ensure email format is valid
ALTER TABLE "AppUser" 
ADD CONSTRAINT email_format_check 
CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- 2. Ensure band codes are valid (1-4)
ALTER TABLE "DealerBandAssignment"
ADD CONSTRAINT bandcode_valid_check
CHECK ("bandCode" IN ('1', '2', '3', '4'));

ALTER TABLE "ProductPriceBand"
ADD CONSTRAINT productband_bandcode_check
CHECK ("bandCode" IN ('1', '2', '3', '4'));

-- 3. Ensure prices are positive
ALTER TABLE "ProductPriceBand"
ADD CONSTRAINT price_positive_check
CHECK (price > 0);

ALTER TABLE "ProductPriceReference"
ADD CONSTRAINT refprice_positive_check
CHECK (
  ("costPrice" IS NULL OR "costPrice" >= 0) AND
  ("retailPrice" IS NULL OR "retailPrice" >= 0) AND
  ("tradePrice" IS NULL OR "tradePrice" >= 0) AND
  ("listPrice" IS NULL OR "listPrice" >= 0) AND
  ("minimumPrice" IS NULL OR "minimumPrice" >= 0)
);

-- 4. Ensure order totals are non-negative
ALTER TABLE "OrderHeader"
ADD CONSTRAINT order_totals_check
CHECK (subtotal >= 0 AND total >= 0);

-- 5. Ensure quantities are positive
ALTER TABLE "CartItem"
ADD CONSTRAINT cart_qty_positive_check
CHECK (qty > 0);

ALTER TABLE "OrderLine"
ADD CONSTRAINT orderline_qty_positive_check
CHECK (qty > 0);

-- 6. Ensure stock quantities are non-negative
ALTER TABLE "ProductStock"
ADD CONSTRAINT stock_nonnegative_check
CHECK ("freeStock" >= 0);

-- 7. Ensure account numbers are not empty
ALTER TABLE "DealerAccount"
ADD CONSTRAINT accountno_not_empty_check
CHECK (LENGTH(TRIM("accountNo")) > 0);

-- 8. Ensure company name is not empty
ALTER TABLE "DealerAccount"
ADD CONSTRAINT companyname_not_empty_check
CHECK (LENGTH(TRIM("companyName")) > 0);

-- 9. Ensure product code is not empty
ALTER TABLE "Product"
ADD CONSTRAINT productcode_not_empty_check
CHECK (LENGTH(TRIM("productCode")) > 0);

-- 10. Ensure description is not empty
ALTER TABLE "Product"
ADD CONSTRAINT description_not_empty_check
CHECK (LENGTH(TRIM(description)) > 0);
