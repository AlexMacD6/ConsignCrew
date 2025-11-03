-- AlterTable: Add organizationId to PhotoGallery for organization-based photo sharing
ALTER TABLE "PhotoGallery" ADD COLUMN "organizationId" TEXT;

-- CreateIndex: Add index on organizationId for better query performance
CREATE INDEX "PhotoGallery_organizationId_idx" ON "PhotoGallery"("organizationId");

-- AddForeignKey: Link photos to organizations
ALTER TABLE "PhotoGallery" ADD CONSTRAINT "PhotoGallery_organizationId_fkey" 
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") 
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Data Migration: Assign existing photos to user's primary organization (if they have one)
-- This ensures existing photos are associated with an organization
UPDATE "PhotoGallery" pg
SET "organizationId" = (
  SELECT m."organizationId"
  FROM "Member" m
  WHERE m."userId" = pg."userId"
  LIMIT 1
)
WHERE pg."organizationId" IS NULL
AND EXISTS (
  SELECT 1 FROM "Member" m WHERE m."userId" = pg."userId"
);

