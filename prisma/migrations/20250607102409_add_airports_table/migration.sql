-- CreateTable
CREATE TABLE "airports" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "station_code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "country_code" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "place_id" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "notes" TEXT,

    CONSTRAINT "airports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "airports_station_code_key" ON "airports"("station_code");

-- CreateIndex
CREATE INDEX "airports_station_code_idx" ON "airports"("station_code");

-- CreateIndex
CREATE INDEX "airports_country_code_idx" ON "airports"("country_code");

-- CreateIndex
CREATE INDEX "airports_region_idx" ON "airports"("region");
