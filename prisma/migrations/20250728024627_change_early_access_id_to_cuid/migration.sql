/*
  Warnings:

  - The primary key for the `early_access_signups` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE "early_access_signups" DROP CONSTRAINT "early_access_signups_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "early_access_signups_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "early_access_signups_id_seq";
