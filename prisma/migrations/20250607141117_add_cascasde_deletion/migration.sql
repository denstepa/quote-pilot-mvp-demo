-- DropForeignKey
ALTER TABLE "route_options" DROP CONSTRAINT "route_options_requestId_fkey";

-- DropForeignKey
ALTER TABLE "route_segments" DROP CONSTRAINT "route_segments_routeOptionId_fkey";

-- AddForeignKey
ALTER TABLE "route_options" ADD CONSTRAINT "route_options_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "route_segments" ADD CONSTRAINT "route_segments_routeOptionId_fkey" FOREIGN KEY ("routeOptionId") REFERENCES "route_options"("id") ON DELETE CASCADE ON UPDATE CASCADE;
