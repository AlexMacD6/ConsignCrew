-- AlterTable
ALTER TABLE "public"."Listing" ADD COLUMN     "ageGroup" TEXT,
ADD COLUMN     "color" TEXT,
ADD COLUMN     "gender" TEXT,
ADD COLUMN     "itemGroupId" TEXT,
ADD COLUMN     "material" TEXT,
ADD COLUMN     "pattern" TEXT,
ADD COLUMN     "productType" TEXT,
ADD COLUMN     "quantity" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "salePrice" DOUBLE PRECISION,
ADD COLUMN     "salePriceEffectiveDate" TIMESTAMP(3),
ADD COLUMN     "size" TEXT,
ADD COLUMN     "style" TEXT,
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];
