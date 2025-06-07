-- AlterTable
ALTER TABLE "requests" ADD COLUMN     "destination_country_code" TEXT,
ADD COLUMN     "destination_formatted_address" TEXT,
ADD COLUMN     "destination_latitude" DOUBLE PRECISION,
ADD COLUMN     "destination_longitude" DOUBLE PRECISION,
ADD COLUMN     "destination_place_id" TEXT,
ADD COLUMN     "distance" DOUBLE PRECISION,
ADD COLUMN     "origin_country_code" TEXT,
ADD COLUMN     "origin_formatted_address" TEXT,
ADD COLUMN     "origin_latitude" DOUBLE PRECISION,
ADD COLUMN     "origin_longitude" DOUBLE PRECISION,
ADD COLUMN     "origin_place_id" TEXT;

-- CreateTable
CREATE TABLE "geocoding_cache" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_updated" TIMESTAMP(3) NOT NULL,
    "address" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "formatted_address" TEXT NOT NULL,
    "place_id" TEXT NOT NULL,
    "country_code" TEXT NOT NULL,

    CONSTRAINT "geocoding_cache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "geocoding_cache_address_key" ON "geocoding_cache"("address");

-- CreateIndex
CREATE INDEX "geocoding_cache_address_idx" ON "geocoding_cache"("address");

-- CreateIndex
CREATE INDEX "geocoding_cache_country_code_idx" ON "geocoding_cache"("country_code");
