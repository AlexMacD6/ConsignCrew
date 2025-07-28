/*
  Warnings:

  - You are about to drop the `daily_sales` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `inventory` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `inventory_lists` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `tray_configs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `tray_layouts` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `tray_slots` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "daily_sales" DROP CONSTRAINT "daily_sales_inventory_list_id_fkey";

-- DropForeignKey
ALTER TABLE "inventory" DROP CONSTRAINT "inventory_inventory_list_id_fkey";

-- DropForeignKey
ALTER TABLE "tray_layouts" DROP CONSTRAINT "tray_layouts_inventory_list_id_fkey";

-- DropForeignKey
ALTER TABLE "tray_slots" DROP CONSTRAINT "tray_slots_tray_layout_id_fkey";

-- DropTable
DROP TABLE "daily_sales";

-- DropTable
DROP TABLE "inventory";

-- DropTable
DROP TABLE "inventory_lists";

-- DropTable
DROP TABLE "tray_configs";

-- DropTable
DROP TABLE "tray_layouts";

-- DropTable
DROP TABLE "tray_slots";
