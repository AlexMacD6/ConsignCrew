/*
  Warnings:

  - You are about to drop the column `alternatePickup` on the `user` table. All the data in the column will be lost.
  - You are about to drop the column `governmentIdUrl` on the `user` table. All the data in the column will be lost.
  - You are about to drop the column `oauthAccessToken` on the `user` table. All the data in the column will be lost.
  - You are about to drop the column `oauthExpiresAt` on the `user` table. All the data in the column will be lost.
  - You are about to drop the column `oauthProvider` on the `user` table. All the data in the column will be lost.
  - You are about to drop the column `oauthProviderId` on the `user` table. All the data in the column will be lost.
  - You are about to drop the column `oauthRefreshToken` on the `user` table. All the data in the column will be lost.
  - You are about to drop the column `payoutAccount` on the `user` table. All the data in the column will be lost.
  - You are about to drop the column `payoutMethod` on the `user` table. All the data in the column will be lost.
  - You are about to drop the column `preferredContact` on the `user` table. All the data in the column will be lost.
  - You are about to drop the column `profilePhotoUrl` on the `user` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `user` table. All the data in the column will be lost.
  - You are about to drop the column `shippingAddress` on the `user` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "user_oauthProvider_oauthProviderId_idx";

-- AlterTable
ALTER TABLE "user" DROP COLUMN "alternatePickup",
DROP COLUMN "governmentIdUrl",
DROP COLUMN "oauthAccessToken",
DROP COLUMN "oauthExpiresAt",
DROP COLUMN "oauthProvider",
DROP COLUMN "oauthProviderId",
DROP COLUMN "oauthRefreshToken",
DROP COLUMN "payoutAccount",
DROP COLUMN "payoutMethod",
DROP COLUMN "preferredContact",
DROP COLUMN "profilePhotoUrl",
DROP COLUMN "role",
DROP COLUMN "shippingAddress";
