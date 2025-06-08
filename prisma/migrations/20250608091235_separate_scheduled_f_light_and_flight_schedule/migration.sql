/*
  Warnings:

  - You are about to drop the `flight_schedules` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "flight_schedules" DROP CONSTRAINT "flight_schedules_import_batch_id_fkey";

-- DropTable
DROP TABLE "flight_schedules";

-- CreateTable
CREATE TABLE "scheduled_flights" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "airline" TEXT NOT NULL,
    "flight_number" TEXT NOT NULL,
    "origin_code" TEXT NOT NULL,
    "destination_code" TEXT NOT NULL,
    "departure_time" TEXT,
    "arrival_time" TEXT,
    "departure_date" TIMESTAMP(3),
    "departure_at" TIMESTAMP(3),
    "arrival_at" TIMESTAMP(3),
    "schedule_type" TEXT NOT NULL,
    "carrier" TEXT NOT NULL,
    "notes" TEXT,
    "import_batch_id" TEXT,
    "weeklyFlightScheduleId" TEXT,

    CONSTRAINT "scheduled_flights_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weekly_flight_schedules" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "airline" TEXT NOT NULL,
    "flight_number" TEXT NOT NULL,
    "origin_code" TEXT NOT NULL,
    "destination_code" TEXT NOT NULL,
    "departure_time" TEXT,
    "arrival_time" TEXT,
    "monday" BOOLEAN NOT NULL DEFAULT false,
    "tuesday" BOOLEAN NOT NULL DEFAULT false,
    "wednesday" BOOLEAN NOT NULL DEFAULT false,
    "thursday" BOOLEAN NOT NULL DEFAULT false,
    "friday" BOOLEAN NOT NULL DEFAULT false,
    "saturday" BOOLEAN NOT NULL DEFAULT false,
    "sunday" BOOLEAN NOT NULL DEFAULT false,
    "carrier" TEXT NOT NULL,
    "notes" TEXT,
    "import_batch_id" TEXT,

    CONSTRAINT "weekly_flight_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "scheduled_flights_airline_flight_number_idx" ON "scheduled_flights"("airline", "flight_number");

-- CreateIndex
CREATE INDEX "scheduled_flights_origin_code_destination_code_idx" ON "scheduled_flights"("origin_code", "destination_code");

-- CreateIndex
CREATE INDEX "scheduled_flights_carrier_idx" ON "scheduled_flights"("carrier");

-- CreateIndex
CREATE INDEX "weekly_flight_schedules_airline_flight_number_idx" ON "weekly_flight_schedules"("airline", "flight_number");

-- CreateIndex
CREATE INDEX "weekly_flight_schedules_origin_code_destination_code_idx" ON "weekly_flight_schedules"("origin_code", "destination_code");

-- CreateIndex
CREATE INDEX "weekly_flight_schedules_carrier_idx" ON "weekly_flight_schedules"("carrier");

-- AddForeignKey
ALTER TABLE "scheduled_flights" ADD CONSTRAINT "scheduled_flights_import_batch_id_fkey" FOREIGN KEY ("import_batch_id") REFERENCES "import_batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduled_flights" ADD CONSTRAINT "scheduled_flights_weeklyFlightScheduleId_fkey" FOREIGN KEY ("weeklyFlightScheduleId") REFERENCES "weekly_flight_schedules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weekly_flight_schedules" ADD CONSTRAINT "weekly_flight_schedules_import_batch_id_fkey" FOREIGN KEY ("import_batch_id") REFERENCES "import_batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
