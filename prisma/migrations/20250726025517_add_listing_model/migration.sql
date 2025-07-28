/*
  Warnings:

  - You are about to drop the column `answeredAt` on the `Question` table. All the data in the column will be lost.
  - You are about to drop the column `answeredById` on the `Question` table. All the data in the column will be lost.
  - You are about to drop the column `approvedAt` on the `Question` table. All the data in the column will be lost.
  - You are about to drop the column `approvedById` on the `Question` table. All the data in the column will be lost.
  - You are about to drop the column `createdById` on the `Question` table. All the data in the column will be lost.
  - You are about to drop the column `isApproved` on the `Question` table. All the data in the column will be lost.
  - You are about to drop the column `isPublic` on the `Question` table. All the data in the column will be lost.
  - You are about to drop the column `listingId` on the `Question` table. All the data in the column will be lost.
  - Added the required column `createdBy` to the `Question` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Question` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Question" DROP CONSTRAINT "Question_answeredById_fkey";

-- DropForeignKey
ALTER TABLE "Question" DROP CONSTRAINT "Question_approvedById_fkey";

-- DropForeignKey
ALTER TABLE "Question" DROP CONSTRAINT "Question_createdById_fkey";

-- DropIndex
DROP INDEX "Question_listingId_idx";

-- AlterTable
ALTER TABLE "Question" DROP COLUMN "answeredAt",
DROP COLUMN "answeredById",
DROP COLUMN "approvedAt",
DROP COLUMN "approvedById",
DROP COLUMN "createdById",
DROP COLUMN "isApproved",
DROP COLUMN "isPublic",
DROP COLUMN "listingId",
ADD COLUMN     "answeredBy" TEXT,
ADD COLUMN     "approvedBy" TEXT,
ADD COLUMN     "createdBy" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "Listing" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "photos" JSONB NOT NULL,
    "department" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "subCategory" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "condition" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "description" TEXT NOT NULL,
    "zipCode" TEXT NOT NULL,
    "neighborhood" TEXT NOT NULL,
    "brand" TEXT,
    "dimensions" TEXT,
    "serialNumber" TEXT,
    "modelNumber" TEXT,
    "estimatedRetailPrice" DOUBLE PRECISION,
    "discountSchedule" JSONB,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Listing_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Listing_itemId_key" ON "Listing"("itemId");

-- CreateIndex
CREATE INDEX "Listing_userId_idx" ON "Listing"("userId");

-- CreateIndex
CREATE INDEX "Listing_status_idx" ON "Listing"("status");

-- CreateIndex
CREATE INDEX "Listing_department_idx" ON "Listing"("department");

-- CreateIndex
CREATE INDEX "Listing_zipCode_idx" ON "Listing"("zipCode");

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_answeredBy_fkey" FOREIGN KEY ("answeredBy") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
