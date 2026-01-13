/*
  Warnings:

  - A unique constraint covering the columns `[dealerAccountId,partType]` on the table `DealerBandAssignment` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE INDEX "DealerBandAssignment_dealerAccountId_partType_idx" ON "DealerBandAssignment"("dealerAccountId", "partType");

-- CreateIndex
CREATE UNIQUE INDEX "DealerBandAssignment_dealerAccountId_partType_key" ON "DealerBandAssignment"("dealerAccountId", "partType");
