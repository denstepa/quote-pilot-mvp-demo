import { RouteOption, RouteStatus, SegmentType } from "@prisma/client";
import { RouteOptionWithSegments } from "../../../types";
import { calculateTruckingRouteSegmentPrice } from "./trucking_price";
import { calculateAirRouteSegmentPrice } from "./air_pricing";
import prisma from "@/libs/prisma";


export async function calculateRoutePrice(routeOption: RouteOptionWithSegments): Promise<RouteOption> {

  const request = await prisma.request.findUniqueOrThrow({
    where: {
      id: routeOption.requestId,
    },
  });
  
  let newStartTime = request?.pickupDate ?? new Date();

  let totalPrice = 0;
  let totalDuration = 0;

  for (const segment of routeOption.segments) {
    if (segment.segmentType === SegmentType.TRUCKING) {
      const calculatedSegment = await calculateTruckingRouteSegmentPrice(segment, newStartTime);
      newStartTime = calculatedSegment.arrivalTime!;
      totalPrice += calculatedSegment.price!;
      totalDuration += calculatedSegment.duration!;
    } else if (segment.segmentType === SegmentType.AIR) {
      const calculatedSegment = await calculateAirRouteSegmentPrice(segment, request, newStartTime);
      newStartTime = calculatedSegment.arrivalTime!;
      totalPrice += calculatedSegment.price!;
      totalDuration += calculatedSegment.duration!;
    }
  }

  const updatedRouteOption = await prisma.routeOption.update({
    where: { id: routeOption.id },
    data: {
      totalPrice: totalPrice,
      estimatedDuration: totalDuration,
      currency: 'EUR',
      status: RouteStatus.AVAILABLE
    },
  });

  return updatedRouteOption;

}