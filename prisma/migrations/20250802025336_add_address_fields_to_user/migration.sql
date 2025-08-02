-- AlterTable
ALTER TABLE "user" ADD COLUMN     "addressLine1" TEXT,
ADD COLUMN     "addressLine2" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "neighborhood" TEXT,
ADD COLUMN     "state" TEXT,
ADD COLUMN     "zipCode" TEXT;

-- CreateIndex
CREATE INDEX "user_zipCode_idx" ON "user"("zipCode");
