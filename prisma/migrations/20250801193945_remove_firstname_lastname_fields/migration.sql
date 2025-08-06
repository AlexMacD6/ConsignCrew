/*
  Warnings:

  - You are about to drop the column `firstName` on the `user` table. All the data in the column will be lost.
  - You are about to drop the column `lastName` on the `user` table. All the data in the column will be lost.
  - Made the column `name` on table `user` required. This step will fail if there are existing NULL values in that column.

*/

-- First, populate the name field with existing firstName and lastName data
UPDATE "user" 
SET "name" = CONCAT("firstName", ' ', "lastName")
WHERE "firstName" IS NOT NULL AND "lastName" IS NOT NULL;

-- For users with only firstName or only lastName, use what's available
UPDATE "user" 
SET "name" = COALESCE("firstName", "lastName")
WHERE "name" IS NULL AND ("firstName" IS NOT NULL OR "lastName" IS NOT NULL);

-- For any remaining NULL names, set a default value
UPDATE "user" 
SET "name" = 'Unknown User'
WHERE "name" IS NULL;

-- AlterTable
ALTER TABLE "user" DROP COLUMN "firstName",
DROP COLUMN "lastName",
ALTER COLUMN "name" SET NOT NULL;
