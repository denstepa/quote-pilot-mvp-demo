import { RouteSegment, Request, ScheduledFlight } from "@prisma/client";
import prisma from "@/libs/prisma";
import { findFirstAvailableFlight } from "./avaialble-flights";
import { calculateFlightPrice } from "./flight-route-price";
import moment from 'moment';

export const calculateAirRouteSegmentPrice = async (segment: RouteSegment, request: Request, startTime: Date): Promise<RouteSegment> => {
  if (!segment.originAirportCode || !segment.destinationAirportCode) {
    throw new Error('Route segment is missing required airport codes');
  }

  if (!request.weight) {
    throw new Error('Request is missing required weight information');
  }

  const availableFlight: ScheduledFlight | null = await findFirstAvailableFlight({
    originCode: segment.originAirportCode,
    destinationCode: segment.destinationAirportCode,
    airline: segment.airline!,
    startTime,
    deliveryDeadline: request.deliveryDate
  });

  if (!availableFlight) {
    throw new Error(`No flights found from ${segment.originAirportCode} to ${segment.destinationAirportCode}, by ${segment.airline} between ${startTime} and ${request.deliveryDate}`);
  }

  const price: number = await calculateFlightPrice(availableFlight, segment, request);

  return prisma.routeSegment.update({
    where: { id: segment.id },
    data: {
      price: price,
      currency: 'EUR',
      duration: calculateFlightDuration(availableFlight),
      airline: availableFlight.airline,
      flightNumber: availableFlight.flightNumber,
      scheduledFlightId: availableFlight.id,
      departureTime: availableFlight.departureAt,
      arrivalTime: availableFlight.arrivalAt,
    },
  });  
};

const calculateFlightDuration = (flight: ScheduledFlight): number => {
  const departureTime = moment(flight.departureAt);
  const arrivalTime = moment(flight.arrivalAt);
  return arrivalTime.diff(departureTime, 'minutes') / 60;
}