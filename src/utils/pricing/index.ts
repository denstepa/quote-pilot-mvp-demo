import { RouteStatus, SegmentType, Request } from "@prisma/client";
import { RequestWithRouteOptions, RouteOptionWithSegments } from "../../../types";
import { calculateTruckingRouteSegmentPrice } from "./trucking_price";
import { calculateAirRouteSegmentPrice } from "./air_pricing";
import prisma from "@/libs/prisma";
import moment from "moment";


export async function calculateRoutePrice(routeOption: RouteOptionWithSegments): Promise<RouteOptionWithSegments> {

  const request = await prisma.request.findUniqueOrThrow({
    where: {
      id: routeOption.requestId,
    },
  });
  
  let newStartTime = request?.pickupDate ?? new Date();
  let deliveryTime = newStartTime;

  let totalPrice = 0;
  let totalDuration = 0;

  for (const segment of routeOption.segments) {
    if (segment.segmentType === SegmentType.TRUCKING) {
      const calculatedSegment = await calculateTruckingRouteSegmentPrice(segment, newStartTime);
      newStartTime = calculatedSegment.arrivalTime!;
      totalPrice += calculatedSegment.price!;
      totalDuration += calculatedSegment.duration!;
      deliveryTime = calculatedSegment.arrivalTime!;
      console.log('trucking segment', calculatedSegment);
    } else if (segment.segmentType === SegmentType.AIR) {
      const calculatedSegment = await calculateAirRouteSegmentPrice(segment, request, newStartTime);
      newStartTime = calculatedSegment.arrivalTime!;
      totalPrice += calculatedSegment.price!;
      totalDuration += calculatedSegment.duration!;
      deliveryTime = calculatedSegment.arrivalTime!;
      console.log('air segment', calculatedSegment);
    }
  }

  const pickupTime = request?.pickupDate ?? new Date();
  const durationInHours = moment(deliveryTime).diff(moment(pickupTime), 'hours', true);

  const updatedRouteOption = await prisma.routeOption.update({
    where: { id: routeOption.id },
    data: {
      totalPrice: totalPrice,
      estimatedDuration: totalDuration,
      currency: 'EUR',
      status: RouteStatus.AVAILABLE,
      pickupAt: pickupTime,
      deliveryAt: deliveryTime,
      duration: durationInHours,
    },
    include: {
      segments: true
    }
  });

  return updatedRouteOption;
}

export async function calculateAllRequestRoutes(request: Request): Promise<RequestWithRouteOptions> {
  const routes = await prisma.routeOption.findMany({
    where: {
      requestId: request.id
    },
    include: {
      segments: {
        orderBy: {
          sequence: 'asc'
        }
      }
    }
  });

  const calculatedRoutes: RouteOptionWithSegments[] = [];
  for (const route of routes) {
    const calculatedRoute = await calculateRoutePrice(route);
    calculatedRoutes.push(calculatedRoute);
  }

  if (calculatedRoutes.length > 0) {
    const cheapestRoute = await selectCheapestRoute(calculatedRoutes);
    const fastestRoute = await selectFastestRoute(calculatedRoutes);

    return await prisma.request.update({
      where: { id: request.id },
      data: {
        cheapestRouteId: cheapestRoute.id,
        fastestRouteId: fastestRoute.id,
      },
      include: {
        cheapestRoute: true,
        fastestRoute: true,
        routeOptions: {
          include: {
            segments: {
              orderBy: {
                sequence: 'asc'
              }
            }
          }
        }
      }
    });
  }

  return await prisma.request.findUniqueOrThrow({
    where: { id: request.id },
    include: {
      cheapestRoute: true,
      fastestRoute: true,
      routeOptions: {
        include: {
          segments: {
            orderBy: {
              sequence: 'asc'
            }
          }
        }
      }
    }
  });
}

export async function selectFastestRoute(routes: RouteOptionWithSegments[]): Promise<RouteOptionWithSegments> {
  return routes.sort((a, b) => a.duration! - b.duration!)[0];
}

export async function selectCheapestRoute(routes: RouteOptionWithSegments[]): Promise<RouteOptionWithSegments> {
  return routes.sort((a, b) => a.totalPrice! - b.totalPrice!)[0];
}