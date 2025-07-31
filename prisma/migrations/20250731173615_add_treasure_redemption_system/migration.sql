-- CreateTable
CREATE TABLE "TreasureRedemption" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "venmoUsername" TEXT,
    "cashAppUsername" TEXT,
    "zelleEmail" TEXT,
    "paymentMethod" TEXT NOT NULL,
    "selfieImageUrl" TEXT,
    "socialMediaPost" TEXT,
    "socialMediaBonus" BOOLEAN NOT NULL DEFAULT false,
    "paymentStatus" TEXT NOT NULL DEFAULT 'pending',
    "treasureHubCredit" BOOLEAN NOT NULL DEFAULT false,
    "earlyAccessSent" BOOLEAN NOT NULL DEFAULT false,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TreasureRedemption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TreasureCode" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "maxUses" INTEGER NOT NULL DEFAULT 1,
    "currentUses" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TreasureCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TreasureRedemption_code_key" ON "TreasureRedemption"("code");

-- CreateIndex
CREATE INDEX "TreasureRedemption_code_idx" ON "TreasureRedemption"("code");

-- CreateIndex
CREATE INDEX "TreasureRedemption_email_idx" ON "TreasureRedemption"("email");

-- CreateIndex
CREATE INDEX "TreasureRedemption_paymentStatus_idx" ON "TreasureRedemption"("paymentStatus");

-- CreateIndex
CREATE UNIQUE INDEX "TreasureCode_code_key" ON "TreasureCode"("code");

-- CreateIndex
CREATE INDEX "TreasureCode_code_idx" ON "TreasureCode"("code");

-- CreateIndex
CREATE INDEX "TreasureCode_isActive_idx" ON "TreasureCode"("isActive");
