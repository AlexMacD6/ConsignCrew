/*
  Warnings:

  - You are about to drop the column `inventoryItemId` on the `Listing` table. All the data in the column will be lost.
  - You are about to drop the column `inventoryListId` on the `Listing` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Listing" DROP CONSTRAINT "Listing_inventoryItemId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Listing" DROP CONSTRAINT "Listing_inventoryListId_fkey";

-- DropIndex
DROP INDEX "public"."Listing_inventoryItemId_idx";

-- DropIndex
DROP INDEX "public"."Listing_inventoryListId_idx";

-- AlterTable
ALTER TABLE "public"."InventoryItem" ADD COLUMN     "purchasePrice" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "public"."InventoryList" ADD COLUMN     "msrpPercentage" DOUBLE PRECISION,
ADD COLUMN     "serviceCharges" DOUBLE PRECISION,
ADD COLUMN     "shippingCharges" DOUBLE PRECISION,
ADD COLUMN     "totalExtRetailValue" DOUBLE PRECISION,
ADD COLUMN     "totalPurchasePrice" DOUBLE PRECISION,
ADD COLUMN     "winningBidAmount" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "public"."Listing" DROP COLUMN "inventoryItemId",
DROP COLUMN "inventoryListId";

-- CreateTable
CREATE TABLE "public"."_InventoryListToListing" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_InventoryListToListing_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "public"."_InventoryItemToListing" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_InventoryItemToListing_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_InventoryListToListing_B_index" ON "public"."_InventoryListToListing"("B");

-- CreateIndex
CREATE INDEX "_InventoryItemToListing_B_index" ON "public"."_InventoryItemToListing"("B");

-- AddForeignKey
ALTER TABLE "public"."_InventoryListToListing" ADD CONSTRAINT "_InventoryListToListing_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."InventoryList"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_InventoryListToListing" ADD CONSTRAINT "_InventoryListToListing_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_InventoryItemToListing" ADD CONSTRAINT "_InventoryItemToListing_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."InventoryItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_InventoryItemToListing" ADD CONSTRAINT "_InventoryItemToListing_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
