-- CreateTable
CREATE TABLE "price_history" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "price_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "price_history_listingId_idx" ON "price_history"("listingId");

-- CreateIndex
CREATE INDEX "price_history_createdAt_idx" ON "price_history"("createdAt");

-- AddForeignKey
ALTER TABLE "price_history" ADD CONSTRAINT "price_history_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
