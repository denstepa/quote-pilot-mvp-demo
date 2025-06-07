-- CreateEnum
CREATE TYPE "RouteStatus" AS ENUM ('INITIALIZED', 'CALCULATING_PRICE', 'AVAILABLE', 'SELECTED');

-- CreateEnum
CREATE TYPE "SegmentType" AS ENUM ('TRUCKING', 'AIR', 'CUSTOMS');

-- CreateTable
CREATE TABLE "route_options" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "requestId" TEXT NOT NULL,
    "total_distance" DOUBLE PRECISION,
    "estimated_duration" DOUBLE PRECISION,
    "total_price" DOUBLE PRECISION,
    "currency" TEXT,
    "status" "RouteStatus" NOT NULL DEFAULT 'INITIALIZED',

    CONSTRAINT "route_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "route_segments" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "routeOptionId" TEXT NOT NULL,
    "segmentType" "SegmentType" NOT NULL,
    "sequence" INTEGER NOT NULL,
    "origin_airport_code" TEXT,
    "origin_airport_name" TEXT,
    "origin_country_code" TEXT,
    "origin_latitude" DOUBLE PRECISION,
    "origin_longitude" DOUBLE PRECISION,
    "destination_airport_code" TEXT,
    "destination_airport_name" TEXT,
    "destination_country_code" TEXT,
    "destination_latitude" DOUBLE PRECISION,
    "destination_longitude" DOUBLE PRECISION,
    "distance" DOUBLE PRECISION,
    "duration" DOUBLE PRECISION,
    "price" DOUBLE PRECISION,
    "currency" TEXT,
    "airline" TEXT,
    "flight_number" TEXT,
    "notes" TEXT,

    CONSTRAINT "route_segments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "route_options_requestId_idx" ON "route_options"("requestId");

-- CreateIndex
CREATE INDEX "route_segments_routeOptionId_idx" ON "route_segments"("routeOptionId");

-- AddForeignKey
ALTER TABLE "route_options" ADD CONSTRAINT "route_options_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "route_segments" ADD CONSTRAINT "route_segments_routeOptionId_fkey" FOREIGN KEY ("routeOptionId") REFERENCES "route_options"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
