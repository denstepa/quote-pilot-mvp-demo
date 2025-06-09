import { RouteSegment } from "@prisma/client";
import { calculateDistanceBetweenCoordinates, type GeoCoordinates } from "@/utils/geocoding/google-geocoder";
import { getCountryName } from "@/utils/countries";
import prisma from "@/libs/prisma";
import moment from 'moment';
import { convertToEur, type SupportedCurrency } from "@/utils/currency";

export const calculateTruckingRouteSegmentDistance = async (segment: RouteSegment): Promise<number> => {
  if (!segment.originLatitude || !segment.originLongitude || 
      !segment.destinationLatitude || !segment.destinationLongitude) {
    throw new Error('Route segment is missing required coordinates');
  }

  const origin: GeoCoordinates = {
    latitude: segment.originLatitude,
    longitude: segment.originLongitude, 
  };

  const destination: GeoCoordinates = {
    latitude: segment.destinationLatitude,
    longitude: segment.destinationLongitude,
  };

  return calculateDistanceBetweenCoordinates(origin, destination);
}

export const calculateTruckingRouteSegmentPrice = async (segment: RouteSegment, startTime: Date): Promise<RouteSegment> => {
  const distance = await calculateTruckingRouteSegmentDistance(segment);

  if (!segment.originCountryCode || !segment.destinationCountryCode) {
    throw new Error('Route segment is missing required country codes');
  }

  const originCountry = getCountryName(segment.originCountryCode);

  // here we have only 1 option for now. In the future we could extend the calculation.
  const truckingRate = await prisma.truckingRate.findFirst({
    where: {
      origin: originCountry,
    },
    orderBy: {
      basePrice: 'asc',
    },
  });

  if (!truckingRate) {
    throw new Error(`No trucking rate found for route in ${originCountry}`);
  }

  const totalPrice = truckingRate.basePrice + (distance * truckingRate.kmPrice);
  const priceInEur = convertToEur(totalPrice, truckingRate.currency as SupportedCurrency);
  const duration = calculateTruckingRouteSegmentDuration(distance);
  const startMoment = moment(startTime);
  const arrivalMoment = startMoment.clone().add(duration, 'hours');

  return await prisma.routeSegment.update({
    where: { id: segment.id },
    data: {
      price: priceInEur,
      currency: 'EUR',
      distance: distance,
      duration: duration,
      departureTime: startTime,
      arrivalTime: arrivalMoment.toDate(),
    },
  });
}

const calculateTruckingRouteSegmentDuration = (distance: number): number => {
  return distance / 70;
}