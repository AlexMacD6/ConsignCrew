-- AlterTable
ALTER TABLE "public"."Listing" ADD COLUMN     "inventoryItemId" TEXT,
ADD COLUMN     "inventoryListId" TEXT;

-- CreateTable
CREATE TABLE "public"."InventoryList" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryList_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."InventoryItem" (
    "id" TEXT NOT NULL,
    "listId" TEXT NOT NULL,
    "lotNumber" TEXT,
    "itemNumber" TEXT,
    "deptCode" TEXT,
    "department" TEXT,
    "description" TEXT,
    "quantity" INTEGER,
    "unitRetail" DOUBLE PRECISION,
    "extRetail" DOUBLE PRECISION,
    "vendor" TEXT,
    "categoryCode" TEXT,
    "category" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InventoryList_createdBy_idx" ON "public"."InventoryList"("createdBy");

-- CreateIndex
CREATE INDEX "InventoryItem_listId_idx" ON "public"."InventoryItem"("listId");

-- CreateIndex
CREATE INDEX "InventoryItem_itemNumber_idx" ON "public"."InventoryItem"("itemNumber");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryItem_listId_itemNumber_key" ON "public"."InventoryItem"("listId", "itemNumber");

-- CreateIndex
CREATE INDEX "Listing_inventoryListId_idx" ON "public"."Listing"("inventoryListId");

-- CreateIndex
CREATE INDEX "Listing_inventoryItemId_idx" ON "public"."Listing"("inventoryItemId");

-- AddForeignKey
ALTER TABLE "public"."Listing" ADD CONSTRAINT "Listing_inventoryListId_fkey" FOREIGN KEY ("inventoryListId") REFERENCES "public"."InventoryList"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Listing" ADD CONSTRAINT "Listing_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "public"."InventoryItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InventoryList" ADD CONSTRAINT "InventoryList_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InventoryItem" ADD CONSTRAINT "InventoryItem_listId_fkey" FOREIGN KEY ("listId") REFERENCES "public"."InventoryList"("id") ON DELETE CASCADE ON UPDATE CASCADE;
