-- AlterTable
ALTER TABLE "route_segments" ADD COLUMN     "arrival_time" TIMESTAMP(3),
ADD COLUMN     "departure_time" TIMESTAMP(3),
ADD COLUMN     "scheduled_flight_id" TEXT;

-- AddForeignKey
ALTER TABLE "route_segments" ADD CONSTRAINT "route_segments_scheduled_flight_id_fkey" FOREIGN KEY ("scheduled_flight_id") REFERENCES "scheduled_flights"("id") ON DELETE SET NULL ON UPDATE CASCADE;
