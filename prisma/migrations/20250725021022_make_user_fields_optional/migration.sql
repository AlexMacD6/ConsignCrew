-- AlterTable
ALTER TABLE "user" ALTER COLUMN "preferredContact" DROP NOT NULL,
ALTER COLUMN "shippingAddress" DROP NOT NULL,
ALTER COLUMN "payoutMethod" DROP NOT NULL,
ALTER COLUMN "payoutAccount" DROP NOT NULL;
