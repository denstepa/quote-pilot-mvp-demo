-- AlterEnum
ALTER TYPE "EmailStatus" ADD VALUE 'FAILED';

-- AlterTable
ALTER TABLE "requests" ADD COLUMN     "cheapest_route_id" TEXT,
ADD COLUMN     "fastest_route_id" TEXT;

-- AlterTable
ALTER TABLE "route_options" ADD COLUMN     "delivery_at" TIMESTAMP(3),
ADD COLUMN     "duration" DOUBLE PRECISION,
ADD COLUMN     "pickup_at" TIMESTAMP(3);

-- AddForeignKey
ALTER TABLE "requests" ADD CONSTRAINT "requests_cheapest_route_id_fkey" FOREIGN KEY ("cheapest_route_id") REFERENCES "route_options"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requests" ADD CONSTRAINT "requests_fastest_route_id_fkey" FOREIGN KEY ("fastest_route_id") REFERENCES "route_options"("id") ON DELETE SET NULL ON UPDATE CASCADE;
