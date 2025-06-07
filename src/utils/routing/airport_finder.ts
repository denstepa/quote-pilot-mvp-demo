import { Airport, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Find the N closest airports to given coordinates
 * @param latitude The latitude of the point
 * @param longitude The longitude of the point
 * @param limit The number of closest airports to return (default: 3)
 * @returns Array of closest airports, sorted by distance
 */
export async function findClosestAirports(
  latitude: number, 
  longitude: number, 
  limit: number = 3
): Promise<Airport[]> {
  const result = await prisma.$queryRaw<Airport[]>`
    SELECT 
      a.station_code as "stationCode",
      a.name,
      a.country_code as "countryCode",
      a.latitude,
      a.longitude,
      ST_Distance(
        ST_SetSRID(ST_MakePoint(a.longitude, a.latitude), 4326)::geography,
        ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography
      ) / 1000 as distance
    FROM airports a
    ORDER BY distance ASC
    LIMIT ${limit}
  `;

  return result;
}

// For backward compatibility
export async function findClosestAirport(latitude: number, longitude: number): Promise<Airport | null> {
  const airports = await findClosestAirports(latitude, longitude, 1);
  return airports[0] || null;
} 