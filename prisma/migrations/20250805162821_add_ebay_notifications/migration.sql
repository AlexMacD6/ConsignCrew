-- CreateTable
CREATE TABLE "public"."EbayNotification" (
    "id" TEXT NOT NULL,
    "notificationId" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "dataSchema" TEXT NOT NULL,
    "dataVersion" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "eventDate" TIMESTAMP(3) NOT NULL,
    "publishDate" TIMESTAMP(3) NOT NULL,
    "publishAttemptCount" INTEGER NOT NULL DEFAULT 0,
    "payload" JSONB NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "processingError" TEXT,
    "ebayItemId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "EbayNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."EbayItem" (
    "id" TEXT NOT NULL,
    "ebayItemId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "price" DECIMAL(65,30) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "condition" TEXT,
    "brand" TEXT,
    "modelNumber" TEXT,
    "gtin" TEXT,
    "marketPrice" DECIMAL(65,30),
    "priceHistory" JSONB,
    "lastPriceUpdate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'active',
    "lastNotification" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EbayItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."EbayNotificationLog" (
    "id" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "context" JSONB,
    "ebayNotificationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EbayNotificationLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EbayNotification_notificationId_key" ON "public"."EbayNotification"("notificationId");

-- CreateIndex
CREATE INDEX "EbayNotification_notificationId_idx" ON "public"."EbayNotification"("notificationId");

-- CreateIndex
CREATE INDEX "EbayNotification_topic_idx" ON "public"."EbayNotification"("topic");

-- CreateIndex
CREATE INDEX "EbayNotification_eventDate_idx" ON "public"."EbayNotification"("eventDate");

-- CreateIndex
CREATE INDEX "EbayNotification_processed_idx" ON "public"."EbayNotification"("processed");

-- CreateIndex
CREATE INDEX "EbayNotification_ebayItemId_idx" ON "public"."EbayNotification"("ebayItemId");

-- CreateIndex
CREATE UNIQUE INDEX "EbayItem_ebayItemId_key" ON "public"."EbayItem"("ebayItemId");

-- CreateIndex
CREATE INDEX "EbayItem_ebayItemId_idx" ON "public"."EbayItem"("ebayItemId");

-- CreateIndex
CREATE INDEX "EbayItem_status_idx" ON "public"."EbayItem"("status");

-- CreateIndex
CREATE INDEX "EbayItem_lastPriceUpdate_idx" ON "public"."EbayItem"("lastPriceUpdate");

-- CreateIndex
CREATE INDEX "EbayNotificationLog_level_idx" ON "public"."EbayNotificationLog"("level");

-- CreateIndex
CREATE INDEX "EbayNotificationLog_createdAt_idx" ON "public"."EbayNotificationLog"("createdAt");

-- CreateIndex
CREATE INDEX "EbayNotificationLog_ebayNotificationId_idx" ON "public"."EbayNotificationLog"("ebayNotificationId");

-- AddForeignKey
ALTER TABLE "public"."EbayNotification" ADD CONSTRAINT "EbayNotification_ebayItemId_fkey" FOREIGN KEY ("ebayItemId") REFERENCES "public"."EbayItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EbayNotificationLog" ADD CONSTRAINT "EbayNotificationLog_ebayNotificationId_fkey" FOREIGN KEY ("ebayNotificationId") REFERENCES "public"."EbayNotification"("id") ON DELETE SET NULL ON UPDATE CASCADE;
