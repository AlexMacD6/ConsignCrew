-- CreateTable
CREATE TABLE "early_access_signups" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "signupNumber" INTEGER NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'website',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "early_access_signups_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "early_access_signups_email_key" ON "early_access_signups"("email");

-- CreateIndex
CREATE UNIQUE INDEX "early_access_signups_signupNumber_key" ON "early_access_signups"("signupNumber");

-- CreateIndex
CREATE INDEX "early_access_signups_email_idx" ON "early_access_signups"("email");

-- CreateIndex
CREATE INDEX "early_access_signups_signupNumber_idx" ON "early_access_signups"("signupNumber");
