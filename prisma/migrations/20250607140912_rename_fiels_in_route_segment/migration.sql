/*
  Warnings:

  - You are about to drop the column `destination_airport_name` on the `route_segments` table. All the data in the column will be lost.
  - You are about to drop the column `origin_airport_name` on the `route_segments` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "route_segments" DROP COLUMN "destination_airport_name",
DROP COLUMN "origin_airport_name",
ADD COLUMN     "destination_name" TEXT,
ADD COLUMN     "origin_name" TEXT;
