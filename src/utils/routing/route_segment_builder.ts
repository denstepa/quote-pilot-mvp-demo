import { Airport, PrismaClient, Request } from '@prisma/client';
import { findClosestAirports } from './airport_finder';

const prisma = new PrismaClient();

interface AirportPair {
  origin: Airport;
  destination: Airport;
}

/**
 * Check if there are any flights available between two airports
 * @param originCode Origin airport code
 * @param destinationCode Destination airport code
 * @returns true if there are flights available, false otherwise
 */
async function hasFlightsBetweenAirports(origin: Airport, destination: Airport): Promise<boolean> {
  const flights = await prisma.flightSchedule.findMany({
    where: {
      originCode: origin.stationCode,
      destinationCode: destination.stationCode,
    },
    take: 1,
  });

  return flights.length > 0;
}

/**
 * Build list of airport pairs with flight availability information
 * @param originAirports List of origin airports
 * @param destinationAirports List of destination airports
 * @returns List of airport pairs with flight availability
 */
async function buildAirportPairs(
  originAirports: Airport[],
  destinationAirports: Airport[]
): Promise<AirportPair[]> {
  const airportPairs: AirportPair[] = [];
  
  for (const originAirport of originAirports) {
    for (const destinationAirport of destinationAirports) {

      airportPairs.push({
        origin: originAirport,
        destination: destinationAirport,
      });
    }
  }

  return airportPairs;
}

/**
 * Build route options for a request
 * @param request The request to build route options for
 * @returns List of airport pairs with flight availability
 */
export async function buildRouteOptions(request: Request): Promise<AirportPair[]> {
  if (!request.originLatitude || !request.originLongitude || 
      !request.destinationLatitude || !request.destinationLongitude) {
    throw new Error('Request is missing geocoding information');
  }

  // Find closest airports to origin and destination
  const originAirports: Airport[] = await findClosestAirports(
    request.originLatitude,
    request.originLongitude,
    3
  );

  const destinationAirports: Airport[] = await findClosestAirports(
    request.destinationLatitude,
    request.destinationLongitude,
    3
  );

  // Build and filter airport pairs
  const airportPairs = await buildAirportPairs(originAirports, destinationAirports);
  const airportPairsWithFlights = airportPairs.filter(pair => hasFlightsBetweenAirports(pair.origin, pair.destination));

  return airportPairsWithFlights;
}
