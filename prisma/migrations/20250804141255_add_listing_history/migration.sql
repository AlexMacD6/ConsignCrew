-- CreateTable
CREATE TABLE "public"."listing_history" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "eventTitle" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "listing_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "listing_history_listingId_idx" ON "public"."listing_history"("listingId");

-- CreateIndex
CREATE INDEX "listing_history_eventType_idx" ON "public"."listing_history"("eventType");

-- CreateIndex
CREATE INDEX "listing_history_createdAt_idx" ON "public"."listing_history"("createdAt");

-- AddForeignKey
ALTER TABLE "public"."listing_history" ADD CONSTRAINT "listing_history_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "public"."Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
