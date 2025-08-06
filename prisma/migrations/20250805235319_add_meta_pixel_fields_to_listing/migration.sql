-- AlterTable
ALTER TABLE "public"."Listing" ADD COLUMN     "isTreasure" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "metaCatalogId" TEXT,
ADD COLUMN     "metaErrorDetails" TEXT,
ADD COLUMN     "metaLastSync" TIMESTAMP(3),
ADD COLUMN     "metaProductId" TEXT,
ADD COLUMN     "metaSyncStatus" TEXT,
ADD COLUMN     "treasureFlaggedAt" TIMESTAMP(3),
ADD COLUMN     "treasureFlaggedBy" TEXT,
ADD COLUMN     "treasureReason" TEXT;
