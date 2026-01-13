/*
  Warnings:

  - You are about to alter the column `price` on the `ProductPriceBand` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.

*/
-- AlterTable
ALTER TABLE "ProductPriceBand" ALTER COLUMN "price" SET DATA TYPE DECIMAL(10,2);

-- CreateIndex
CREATE INDEX "AppUser_email_idx" ON "AppUser"("email");

-- CreateIndex
CREATE INDEX "AppUser_role_isActive_idx" ON "AppUser"("role", "isActive");

-- CreateIndex
CREATE INDEX "DealerAccount_accountNo_idx" ON "DealerAccount"("accountNo");

-- CreateIndex
CREATE INDEX "DealerAccount_status_entitlement_idx" ON "DealerAccount"("status", "entitlement");

-- CreateIndex
CREATE INDEX "DealerAccount_mainEmail_idx" ON "DealerAccount"("mainEmail");

-- CreateIndex
CREATE INDEX "Product_productCode_idx" ON "Product"("productCode");

-- CreateIndex
CREATE INDEX "Product_partType_isActive_idx" ON "Product"("partType", "isActive");

-- CreateIndex
CREATE INDEX "Product_description_idx" ON "Product"("description");
