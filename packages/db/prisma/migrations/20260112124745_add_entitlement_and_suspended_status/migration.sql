/*
  Warnings:

  - A unique constraint covering the columns `[erpAccountNo]` on the table `DealerAccount` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "Entitlement" AS ENUM ('GENUINE_ONLY', 'AFTERMARKET_ONLY', 'SHOW_ALL');

-- AlterEnum
ALTER TYPE "DealerStatus" ADD VALUE 'SUSPENDED';

-- AlterTable
ALTER TABLE "DealerAccount" ADD COLUMN     "contactFirstName" TEXT,
ADD COLUMN     "contactLastName" TEXT,
ADD COLUMN     "entitlement" "Entitlement" NOT NULL DEFAULT 'SHOW_ALL',
ADD COLUMN     "erpAccountNo" TEXT;

-- AlterTable
ALTER TABLE "DealerUser" ADD COLUMN     "firstName" TEXT,
ADD COLUMN     "lastName" TEXT;

-- CreateTable
CREATE TABLE "EmailLog" (
    "id" TEXT NOT NULL,
    "recipientEmail" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "bodyText" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL,
    "errorMessage" TEXT,

    CONSTRAINT "EmailLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UploadTemplate" (
    "id" TEXT NOT NULL,
    "templateName" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "blobPath" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UploadTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EmailLog_recipientEmail_idx" ON "EmailLog"("recipientEmail");

-- CreateIndex
CREATE INDEX "EmailLog_sentAt_idx" ON "EmailLog"("sentAt");

-- CreateIndex
CREATE UNIQUE INDEX "UploadTemplate_templateName_key" ON "UploadTemplate"("templateName");

-- CreateIndex
CREATE INDEX "UploadTemplate_isActive_idx" ON "UploadTemplate"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "DealerAccount_erpAccountNo_key" ON "DealerAccount"("erpAccountNo");
