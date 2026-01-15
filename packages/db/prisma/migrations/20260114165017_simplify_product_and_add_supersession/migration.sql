/*
  Warnings:

  - You are about to drop the column `jaguarNo` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `landRoverNo` on the `Product` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Product" DROP COLUMN "jaguarNo",
DROP COLUMN "landRoverNo";

-- CreateTable
CREATE TABLE "Supersession" (
    "id" TEXT NOT NULL,
    "originalPartCode" TEXT NOT NULL,
    "replacementPartCode" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Supersession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Supersession_originalPartCode_idx" ON "Supersession"("originalPartCode");
