import { Request, PrismaClient, RouteStatus } from '@prisma/client';
import { findFlightOptions } from './route_segment_builder';
import { RouteOptionWithSegments } from '../../../types';

const prisma = new PrismaClient();

/**
 * Process a request to find nearby airports and build route options
 * @param request The request containing origin and destination coordinates
 * @returns Array of route options with airport pairs
 */
export async function buildAvailableRoutes(request: Request): Promise<RouteOptionWithSegments[]> {
  if (!request.originLatitude || !request.originLongitude || 
      !request.destinationLatitude || !request.destinationLongitude) {
    throw new Error('Request is missing geocoding information');
  }

  const availableFlights = await findFlightOptions(request);
  const routeOptions: RouteOptionWithSegments[] = [];

  for (const { origin: originAirport, destination: destinationAirport, airline } of availableFlights) {

    const routeOption = await prisma.routeOption.create({
      data: {
        requestId: request.id,
        status: RouteStatus.INITIALIZED,
        segments: {
          create: [
            {
              segmentType: 'TRUCKING',
              sequence: 1,
              originLatitude: request.originLatitude,
              originLongitude: request.originLongitude,
              destinationLatitude: originAirport.latitude,
              destinationLongitude: originAirport.longitude,
              originName: request.originAddress,
              destinationName: originAirport.name,
              originCountryCode: request.originCountryCode,
              destinationCountryCode: originAirport.countryCode,
            },
            {
              segmentType: 'AIR',
              sequence: 2,
              originAirportCode: originAirport.stationCode,
              originName: originAirport.name,
              originCountryCode: originAirport.countryCode,
              originLatitude: originAirport.latitude,
              originLongitude: originAirport.longitude,
              destinationAirportCode: destinationAirport.stationCode,
              destinationName: destinationAirport.name,
              destinationCountryCode: destinationAirport.countryCode,
              destinationLatitude: destinationAirport.latitude,
              destinationLongitude: destinationAirport.longitude,
              airline: airline,
            },
            {
              segmentType: 'TRUCKING',
              sequence: 3,
              originLatitude: destinationAirport.latitude,
              originLongitude: destinationAirport.longitude,
              destinationLatitude: request.destinationLatitude,
              destinationLongitude: request.destinationLongitude,
              originName: destinationAirport.name,
              destinationName: request.destinationAddress,
              destinationCountryCode: request.destinationCountryCode,
              originCountryCode: destinationAirport.countryCode,
            }
          ]
        }
      },
      include: {
        segments: {
          orderBy: {
            sequence: 'asc'
          }
        }
      }
    });

    routeOptions.push(routeOption);
  }

  return routeOptions;
}
