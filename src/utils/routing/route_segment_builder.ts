import { Airport, PrismaClient, Request } from '@prisma/client';
import { findClosestAirports } from './airport_finder';

const prisma = new PrismaClient();

interface AirportPair {
  origin: Airport;
  destination: Airport;
}

interface AirportPairWithAirline extends AirportPair {
  airline: string;
}

/**
 * Check if there are any flights available between two airports for a specific airline
 * @param origin Origin airport
 * @param destination Destination airport
 * @param airline Airline code
 * @returns true if there are flights available, false otherwise
 */
async function hasFlightsBetweenAirports(origin: Airport, destination: Airport, pickupDate: Date): Promise<string[]> {
  const flights = await prisma.scheduledFlight.findMany({
    where: {
      originCode: origin.stationCode,
      destinationCode: destination.stationCode,
      departureAt: {
        gte: pickupDate,
      },
    },
    select: {
      airline: true,
    },
    distinct: ['airline'],
  });

  return flights.map(flight => flight.airline);
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
 * @returns List of airport pairs with airline availability
 */
export async function findFlightOptions(request: Request): Promise<AirportPairWithAirline[]> {
  if (!request.originLatitude || !request.originLongitude || 
      !request.destinationLatitude || !request.destinationLongitude) {
    throw new Error('Request is missing geocoding information');
  }

  // Find closest airports to origin and destination
  const originAirports: Airport[] = await findClosestAirports(
    request.originLatitude,
    request.originLongitude,
    5
  );

  const destinationAirports: Airport[] = await findClosestAirports(
    request.destinationLatitude,
    request.destinationLongitude,
    5
  );

  // Build and filter airport pairs
  const airportPairs = await buildAirportPairs(originAirports, destinationAirports);
  const airportPairsWithAirlines: AirportPairWithAirline[] = [];
  for (const pair of airportPairs) {
    const airlines = await hasFlightsBetweenAirports(pair.origin, pair.destination, request.pickupDate || new Date());
    airlines.forEach(airline => {
      airportPairsWithAirlines.push({
        ...pair,
        airline: airline,
      });
    });
  } 

  return airportPairsWithAirlines;
}
