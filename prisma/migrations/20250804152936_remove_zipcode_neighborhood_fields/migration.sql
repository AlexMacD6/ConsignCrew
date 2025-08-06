/*
  Warnings:

  - You are about to drop the column `neighborhood` on the `Listing` table. All the data in the column will be lost.
  - You are about to drop the column `zipCode` on the `Listing` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "public"."Listing_zipCode_idx";

-- AlterTable
ALTER TABLE "public"."Listing" DROP COLUMN "neighborhood",
DROP COLUMN "zipCode";
