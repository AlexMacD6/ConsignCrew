/*
  Warnings:

  - A unique constraint covering the columns `[facebookShopId]` on the table `Listing` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Listing" ADD COLUMN     "facebookBrand" TEXT,
ADD COLUMN     "facebookCategory" TEXT,
ADD COLUMN     "facebookCondition" TEXT,
ADD COLUMN     "facebookGtin" TEXT,
ADD COLUMN     "facebookLastSync" TIMESTAMP(3),
ADD COLUMN     "facebookShopEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "facebookShopId" TEXT,
ADD COLUMN     "facebookSyncStatus" TEXT;

-- AlterTable
ALTER TABLE "TreasureDrop" ALTER COLUMN "radius" SET DEFAULT 328;

-- CreateTable
CREATE TABLE "FacebookApiKey" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "apiKey" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastUsed" TIMESTAMP(3),
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "FacebookApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FacebookApiKey_apiKey_key" ON "FacebookApiKey"("apiKey");

-- CreateIndex
CREATE INDEX "FacebookApiKey_apiKey_idx" ON "FacebookApiKey"("apiKey");

-- CreateIndex
CREATE INDEX "FacebookApiKey_isActive_idx" ON "FacebookApiKey"("isActive");

-- CreateIndex
CREATE INDEX "FacebookApiKey_createdBy_idx" ON "FacebookApiKey"("createdBy");

-- CreateIndex
CREATE UNIQUE INDEX "Listing_facebookShopId_key" ON "Listing"("facebookShopId");

-- CreateIndex
CREATE INDEX "Listing_facebookShopEnabled_idx" ON "Listing"("facebookShopEnabled");

-- CreateIndex
CREATE INDEX "Listing_facebookLastSync_idx" ON "Listing"("facebookLastSync");
