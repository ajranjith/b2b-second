/*
  Warnings:

  - Added the required column `fileType` to the `UploadTemplate` table without a default value. This is not possible if the table is not empty.
  - Added the required column `importType` to the `UploadTemplate` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "UploadTemplate" ADD COLUMN     "delimiter" TEXT,
ADD COLUMN     "fileType" TEXT NOT NULL,
ADD COLUMN     "hasHeader" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "importType" TEXT NOT NULL,
ADD COLUMN     "mappingJson" JSONB,
ADD COLUMN     "validationJson" JSONB;
