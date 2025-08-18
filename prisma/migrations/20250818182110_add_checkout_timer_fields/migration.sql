-- AlterTable
ALTER TABLE "public"."Listing" ADD COLUMN     "heldUntil" TIMESTAMP(3),
ADD COLUMN     "isHeld" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "public"."orders" ADD COLUMN     "checkoutExpiresAt" TIMESTAMP(3),
ADD COLUMN     "isHeld" BOOLEAN NOT NULL DEFAULT false;
