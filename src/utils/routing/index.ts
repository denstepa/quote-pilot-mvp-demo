import { Request, PrismaClient, RouteStatus, RouteOption } from '@prisma/client';
import { buildRouteOptions } from './route_segment_builder';

const prisma = new PrismaClient();

/**
 * Process a request to find nearby airports and build route options
 * @param request The request containing origin and destination coordinates
 * @returns Array of route options with airport pairs
 */
export async function findAvailableRoutes(request: Request): Promise<RouteOption[]> {
  if (!request.originLatitude || !request.originLongitude || 
      !request.destinationLatitude || !request.destinationLongitude) {
    throw new Error('Request is missing geocoding information');
  }

  // Build route options
  const airportPairs = await buildRouteOptions(request);
  const routeOptions: RouteOption[] = [];

  // Process each airport pair one by one
  for (const { origin: originAirport, destination: destinationAirport } of airportPairs) {
    // Create route option in database
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
