/*
  Warnings:

  - You are about to drop the column `dimensions` on the `Listing` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Listing" DROP COLUMN "dimensions",
ADD COLUMN     "depth" TEXT,
ADD COLUMN     "height" TEXT,
ADD COLUMN     "width" TEXT;
