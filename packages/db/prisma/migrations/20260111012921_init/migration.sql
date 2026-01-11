-- 0) EXTENSIONS (must be first)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'DEALER');

-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'OPS');

-- CreateEnum
CREATE TYPE "DealerStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "PartType" AS ENUM ('GENUINE', 'AFTERMARKET', 'BRANDED');

-- CreateEnum
CREATE TYPE "ImportType" AS ENUM ('PRODUCTS_GENUINE', 'PRODUCTS_AFTERMARKET', 'BACKORDERS', 'SUPERSESSION', 'FULFILLMENT_STATUS');

-- CreateEnum
CREATE TYPE "ImportStatus" AS ENUM ('PROCESSING', 'SUCCEEDED', 'FAILED', 'SUCCEEDED_WITH_ERRORS');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('SUSPENDED', 'PROCESSING', 'SHIPPED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ActorType" AS ENUM ('ADMIN', 'DEALER', 'SYSTEM');

-- CreateTable
CREATE TABLE "AppUser" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "adminRole" "AdminRole",
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DealerAccount" (
    "id" TEXT NOT NULL,
    "accountNo" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "status" "DealerStatus" NOT NULL DEFAULT 'ACTIVE',
    "mainEmail" TEXT,
    "phone" TEXT,
    "billingLine1" TEXT,
    "billingLine2" TEXT,
    "billingCity" TEXT,
    "billingPostcode" TEXT,
    "billingCountry" TEXT,
    "dispatchDefault" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DealerAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DealerUser" (
    "id" TEXT NOT NULL,
    "dealerAccountId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DealerUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DealerBandAssignment" (
    "id" TEXT NOT NULL,
    "dealerAccountId" TEXT NOT NULL,
    "partType" "PartType" NOT NULL,
    "bandCode" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DealerBandAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "productCode" TEXT NOT NULL,
    "supplier" TEXT,
    "description" TEXT NOT NULL,
    "discountCode" TEXT,
    "partType" "PartType" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "landRoverNo" TEXT,
    "jaguarNo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductStock" (
    "productId" TEXT NOT NULL,
    "freeStock" INTEGER NOT NULL DEFAULT 0,
    "lastImportBatchId" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductStock_pkey" PRIMARY KEY ("productId")
);

-- CreateTable
CREATE TABLE "ProductPriceReference" (
    "productId" TEXT NOT NULL,
    "costPrice" DECIMAL(65,30),
    "retailPrice" DECIMAL(65,30),
    "tradePrice" DECIMAL(65,30),
    "listPrice" DECIMAL(65,30),
    "minimumPrice" DECIMAL(65,30),
    "lastImportBatchId" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductPriceReference_pkey" PRIMARY KEY ("productId")
);

-- CreateTable
CREATE TABLE "ProductPriceBand" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "bandCode" TEXT NOT NULL,
    "price" DECIMAL(65,30) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductPriceBand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductAlias" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "aliasType" TEXT NOT NULL,
    "aliasValue" TEXT NOT NULL,

    CONSTRAINT "ProductAlias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportBatch" (
    "id" TEXT NOT NULL,
    "importType" "ImportType" NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileHash" TEXT NOT NULL,
    "filePath" TEXT,
    "status" "ImportStatus" NOT NULL DEFAULT 'PROCESSING',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "totalRows" INTEGER NOT NULL DEFAULT 0,
    "validRows" INTEGER NOT NULL DEFAULT 0,
    "invalidRows" INTEGER NOT NULL DEFAULT 0,
    "uploadedById" TEXT,

    CONSTRAINT "ImportBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportError" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "rowNumber" INTEGER NOT NULL,
    "columnName" TEXT,
    "errorCode" TEXT,
    "errorMessage" TEXT NOT NULL,
    "rawRowJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ImportError_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StgProductPriceRow" (
    "batchId" TEXT NOT NULL,
    "rowNumber" INTEGER NOT NULL,
    "partType" "PartType" NOT NULL,
    "supplier" TEXT,
    "productCode" TEXT,
    "description" TEXT,
    "discountCode" TEXT,
    "costPrice" DECIMAL(65,30),
    "retailPrice" DECIMAL(65,30),
    "tradePrice" DECIMAL(65,30),
    "listPrice" DECIMAL(65,30),
    "band1Price" DECIMAL(65,30),
    "band2Price" DECIMAL(65,30),
    "band3Price" DECIMAL(65,30),
    "band4Price" DECIMAL(65,30),
    "freeStock" INTEGER,
    "isValid" BOOLEAN NOT NULL DEFAULT false,
    "validationErrors" TEXT,
    "rawRowJson" JSONB,

    CONSTRAINT "StgProductPriceRow_pkey" PRIMARY KEY ("batchId","rowNumber")
);

-- CreateTable
CREATE TABLE "StgBackorderRow" (
    "batchId" TEXT NOT NULL,
    "rowNumber" INTEGER NOT NULL,
    "accountNo" TEXT,
    "customerName" TEXT,
    "yourOrderNo" TEXT,
    "ourNo" TEXT,
    "itemNo" TEXT,
    "part" TEXT,
    "description" TEXT,
    "qtyOrdered" INTEGER,
    "qtyOutstanding" INTEGER,
    "inWh" INTEGER,
    "isValid" BOOLEAN NOT NULL DEFAULT false,
    "validationErrors" TEXT,
    "rawRowJson" JSONB,

    CONSTRAINT "StgBackorderRow_pkey" PRIMARY KEY ("batchId","rowNumber")
);

-- CreateTable
CREATE TABLE "BackorderDataset" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "status" "ImportStatus" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BackorderDataset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BackorderLine" (
    "id" TEXT NOT NULL,
    "datasetId" TEXT NOT NULL,
    "accountNo" TEXT NOT NULL,
    "customerName" TEXT,
    "yourOrderNo" TEXT,
    "ourNo" TEXT NOT NULL,
    "itemNo" TEXT NOT NULL,
    "part" TEXT NOT NULL,
    "description" TEXT,
    "qtyOrdered" INTEGER NOT NULL DEFAULT 0,
    "qtyOutstanding" INTEGER NOT NULL DEFAULT 0,
    "inWh" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "BackorderLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cart" (
    "id" TEXT NOT NULL,
    "dealerAccountId" TEXT NOT NULL,
    "dealerUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CartItem" (
    "id" TEXT NOT NULL,
    "cartId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "qty" INTEGER NOT NULL,

    CONSTRAINT "CartItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderHeader" (
    "id" TEXT NOT NULL,
    "orderNo" TEXT NOT NULL,
    "dealerAccountId" TEXT NOT NULL,
    "dealerUserId" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'SUSPENDED',
    "dispatchMethod" TEXT,
    "poRef" TEXT,
    "notes" TEXT,
    "subtotal" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "total" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'GBP',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderHeader_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderLine" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "productCodeSnapshot" TEXT NOT NULL,
    "descriptionSnapshot" TEXT NOT NULL,
    "partTypeSnapshot" "PartType" NOT NULL,
    "qty" INTEGER NOT NULL,
    "unitPriceSnapshot" DECIMAL(65,30) NOT NULL,
    "bandCodeSnapshot" TEXT NOT NULL,
    "minPriceApplied" BOOLEAN NOT NULL DEFAULT false,
    "lineStatus" TEXT,
    "shippedQty" INTEGER NOT NULL DEFAULT 0,
    "backorderedQty" INTEGER NOT NULL DEFAULT 0,
    "trackingNo" TEXT,
    "etaDate" TIMESTAMP(3),
    "lastStatusUpdateAt" TIMESTAMP(3),

    CONSTRAINT "OrderLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemSetting" (
    "key" TEXT NOT NULL,
    "valueJson" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "NewsPost" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "bodyMd" TEXT NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NewsPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExclusiveDoc" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "blobPath" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExclusiveDoc_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExternalLink" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExternalLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentAttachment" (
    "id" TEXT NOT NULL,
    "newsPostId" TEXT,
    "exclusiveDocId" TEXT,
    "fileName" TEXT NOT NULL,
    "blobPath" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" BIGINT NOT NULL DEFAULT 0,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorType" "ActorType" NOT NULL,
    "actorUserId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "beforeJson" JSONB,
    "afterJson" JSONB,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AppUser_email_key" ON "AppUser"("email");

-- CreateIndex
CREATE UNIQUE INDEX "DealerAccount_accountNo_key" ON "DealerAccount"("accountNo");

-- CreateIndex
CREATE UNIQUE INDEX "DealerUser_userId_key" ON "DealerUser"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Product_productCode_key" ON "Product"("productCode");

-- CreateIndex
CREATE INDEX "ProductPriceBand_productId_bandCode_idx" ON "ProductPriceBand"("productId", "bandCode");

-- CreateIndex
CREATE UNIQUE INDEX "ProductPriceBand_productId_bandCode_key" ON "ProductPriceBand"("productId", "bandCode");

-- CreateIndex
CREATE INDEX "ProductAlias_aliasValue_idx" ON "ProductAlias"("aliasValue");

-- CreateIndex
CREATE UNIQUE INDEX "ProductAlias_aliasType_aliasValue_key" ON "ProductAlias"("aliasType", "aliasValue");

-- CreateIndex
CREATE INDEX "ImportError_batchId_idx" ON "ImportError"("batchId");

-- CreateIndex
CREATE INDEX "StgProductPriceRow_batchId_isValid_idx" ON "StgProductPriceRow"("batchId", "isValid");

-- CreateIndex
CREATE INDEX "StgBackorderRow_batchId_isValid_idx" ON "StgBackorderRow"("batchId", "isValid");

-- CreateIndex
CREATE INDEX "BackorderDataset_isActive_idx" ON "BackorderDataset"("isActive");

-- CreateIndex
CREATE INDEX "BackorderLine_accountNo_idx" ON "BackorderLine"("accountNo");

-- CreateIndex
CREATE INDEX "BackorderLine_datasetId_idx" ON "BackorderLine"("datasetId");



-- CreateIndex
CREATE UNIQUE INDEX "Cart_dealerUserId_key" ON "Cart"("dealerUserId");

-- CreateIndex
CREATE INDEX "CartItem_cartId_idx" ON "CartItem"("cartId");

-- CreateIndex
CREATE UNIQUE INDEX "CartItem_cartId_productId_key" ON "CartItem"("cartId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "OrderHeader_orderNo_key" ON "OrderHeader"("orderNo");

-- CreateIndex
CREATE INDEX "OrderHeader_dealerAccountId_createdAt_idx" ON "OrderHeader"("dealerAccountId", "createdAt");

-- CreateIndex
CREATE INDEX "OrderLine_orderId_idx" ON "OrderLine"("orderId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- AddForeignKey
ALTER TABLE "DealerUser" ADD CONSTRAINT "DealerUser_dealerAccountId_fkey" FOREIGN KEY ("dealerAccountId") REFERENCES "DealerAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealerUser" ADD CONSTRAINT "DealerUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "AppUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealerBandAssignment" ADD CONSTRAINT "DealerBandAssignment_dealerAccountId_fkey" FOREIGN KEY ("dealerAccountId") REFERENCES "DealerAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductStock" ADD CONSTRAINT "ProductStock_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductPriceReference" ADD CONSTRAINT "ProductPriceReference_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductPriceBand" ADD CONSTRAINT "ProductPriceBand_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductAlias" ADD CONSTRAINT "ProductAlias_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportBatch" ADD CONSTRAINT "ImportBatch_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "AppUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportError" ADD CONSTRAINT "ImportError_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "ImportBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StgProductPriceRow" ADD CONSTRAINT "StgProductPriceRow_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "ImportBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StgBackorderRow" ADD CONSTRAINT "StgBackorderRow_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "ImportBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BackorderDataset" ADD CONSTRAINT "BackorderDataset_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "ImportBatch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BackorderLine" ADD CONSTRAINT "BackorderLine_datasetId_fkey" FOREIGN KEY ("datasetId") REFERENCES "BackorderDataset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cart" ADD CONSTRAINT "Cart_dealerAccountId_fkey" FOREIGN KEY ("dealerAccountId") REFERENCES "DealerAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cart" ADD CONSTRAINT "Cart_dealerUserId_fkey" FOREIGN KEY ("dealerUserId") REFERENCES "DealerUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "Cart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderHeader" ADD CONSTRAINT "OrderHeader_dealerAccountId_fkey" FOREIGN KEY ("dealerAccountId") REFERENCES "DealerAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderHeader" ADD CONSTRAINT "OrderHeader_dealerUserId_fkey" FOREIGN KEY ("dealerUserId") REFERENCES "DealerUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderLine" ADD CONSTRAINT "OrderLine_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "OrderHeader"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderLine" ADD CONSTRAINT "OrderLine_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "AppUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- OPTIONAL: enforce only one active backorder dataset at a time
-- Prisma doesn't support partial unique indexes directly; this is safest.
CREATE UNIQUE INDEX IF NOT EXISTS ux_backorder_dataset_one_active
  ON "BackorderDataset" (( "isActive" ))
  WHERE "isActive" = true;
