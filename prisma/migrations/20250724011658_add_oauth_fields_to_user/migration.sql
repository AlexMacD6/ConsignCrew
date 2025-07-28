-- AlterTable
ALTER TABLE "User" ADD COLUMN     "oauthAccessToken" TEXT,
ADD COLUMN     "oauthExpiresAt" TIMESTAMP(3),
ADD COLUMN     "oauthProvider" TEXT,
ADD COLUMN     "oauthProviderId" TEXT,
ADD COLUMN     "oauthRefreshToken" TEXT,
ALTER COLUMN "passwordHash" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "User_oauthProvider_oauthProviderId_idx" ON "User"("oauthProvider", "oauthProviderId");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");
