-- CreateEnum
CREATE TYPE "public"."OrderStatus" AS ENUM ('PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'FINALIZED', 'DISPUTED', 'CANCELLED', 'REFUNDED');

-- CreateTable
CREATE TABLE "public"."orders" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "stripePaymentIntentId" TEXT,
    "stripeCheckoutSessionId" TEXT,
    "stripeChargeId" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "status" "public"."OrderStatus" NOT NULL DEFAULT 'PENDING',
    "shippingAddress" JSONB,
    "trackingNumber" TEXT,
    "deliveredAt" TIMESTAMP(3),
    "finalizedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "disputeReason" TEXT,
    "disputeCreatedAt" TIMESTAMP(3),

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "orders_stripePaymentIntentId_key" ON "public"."orders"("stripePaymentIntentId");

-- CreateIndex
CREATE UNIQUE INDEX "orders_stripeCheckoutSessionId_key" ON "public"."orders"("stripeCheckoutSessionId");

-- CreateIndex
CREATE INDEX "orders_listingId_idx" ON "public"."orders"("listingId");

-- CreateIndex
CREATE INDEX "orders_buyerId_idx" ON "public"."orders"("buyerId");

-- CreateIndex
CREATE INDEX "orders_sellerId_idx" ON "public"."orders"("sellerId");

-- CreateIndex
CREATE INDEX "orders_status_idx" ON "public"."orders"("status");

-- CreateIndex
CREATE INDEX "orders_createdAt_idx" ON "public"."orders"("createdAt");

-- AddForeignKey
ALTER TABLE "public"."orders" ADD CONSTRAINT "orders_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "public"."Listing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."orders" ADD CONSTRAINT "orders_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "public"."user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."orders" ADD CONSTRAINT "orders_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "public"."user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
