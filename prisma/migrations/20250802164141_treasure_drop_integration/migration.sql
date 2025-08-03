/*
  Warnings:

  - You are about to drop the column `code` on the `TreasureRedemption` table. All the data in the column will be lost.
  - Added the required column `treasureCodeId` to the `TreasureRedemption` table without a default value. This is not possible if the table is not empty.

*/

-- First, create the TreasureDrop table
-- CreateTable
CREATE TABLE "TreasureDrop" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "clue" TEXT NOT NULL,
    "image" TEXT,
    "reward" TEXT NOT NULL,
    "foundBy" TEXT,
    "foundAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "treasureCodeId" TEXT,

    CONSTRAINT "TreasureDrop_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TreasureDrop_treasureCodeId_key" ON "TreasureDrop"("treasureCodeId");

-- CreateIndex
CREATE INDEX "TreasureDrop_status_idx" ON "TreasureDrop"("status");

-- CreateIndex
CREATE INDEX "TreasureDrop_createdAt_idx" ON "TreasureDrop"("createdAt");

-- CreateIndex
CREATE INDEX "TreasureDrop_treasureCodeId_idx" ON "TreasureDrop"("treasureCodeId");

-- AddForeignKey
ALTER TABLE "TreasureDrop" ADD CONSTRAINT "TreasureDrop_treasureCodeId_fkey" FOREIGN KEY ("treasureCodeId") REFERENCES "TreasureCode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Handle existing TreasureRedemption data
-- First, add the new column as nullable
ALTER TABLE "TreasureRedemption" ADD COLUMN "treasureCodeId" TEXT;

-- Update existing redemptions to link to treasure codes
UPDATE "TreasureRedemption" 
SET "treasureCodeId" = (
    SELECT "id" 
    FROM "TreasureCode" 
    WHERE "TreasureCode"."code" = "TreasureRedemption"."code"
    LIMIT 1
);

-- Make the column NOT NULL
ALTER TABLE "TreasureRedemption" ALTER COLUMN "treasureCodeId" SET NOT NULL;

-- Drop the old code column and indexes
DROP INDEX "TreasureRedemption_code_idx";
DROP INDEX "TreasureRedemption_code_key";
ALTER TABLE "TreasureRedemption" DROP COLUMN "code";

-- CreateIndex
CREATE INDEX "TreasureRedemption_treasureCodeId_idx" ON "TreasureRedemption"("treasureCodeId");

-- AddForeignKey
ALTER TABLE "TreasureRedemption" ADD CONSTRAINT "TreasureRedemption_treasureCodeId_fkey" FOREIGN KEY ("treasureCodeId") REFERENCES "TreasureCode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
