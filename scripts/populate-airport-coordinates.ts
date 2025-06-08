import { PrismaClient } from '@prisma/client';
import { geocodeAddress, type GeoCoordinatesWithAddress } from '../src/utils/geocoding/google_geocoder';

const prisma = new PrismaClient();

async function getAirportCoordinates(stationCode: string, countryCode: string): Promise<{
  name: string;
  coordinates: GeoCoordinatesWithAddress;
} | null> {
  try {
    // Format the address for geocoding
    const address = `${stationCode} Airport, ${countryCode}`;
    const result = await geocodeAddress(address);

    if (result.error) {
      console.error(`Error geocoding ${stationCode}: ${result.error}`);
      return null;
    }

    return {
      name: result.coordinates.formattedAddress,
      coordinates: result.coordinates
    };
  } catch (error) {
    console.error(`Error getting coordinates for ${stationCode}:`, error);
    return null;
  }
}

async function main() {
  try {
    // Get all unique airport rates
    const airportRates = await prisma.airportRate.findMany({
      select: {
        stationCode: true,
        countryCode: true,
        region: true
      },
      distinct: ['stationCode', 'countryCode']
    });

    console.log(`Found ${airportRates.length} unique airports to process`);

    for (const rate of airportRates) {
      // Check if airport already exists
      const existingAirport = await prisma.airport.findUnique({
        where: { stationCode: rate.stationCode }
      });

      if (existingAirport) {
        console.log(`Airport ${rate.stationCode} already exists, skipping...`);
        continue;
      }

      console.log(`Processing ${rate.stationCode} in ${rate.countryCode}...`);
      
      const result = await getAirportCoordinates(rate.stationCode, rate.countryCode);
      
      if (result) {
        await prisma.airport.create({
          data: {
            stationCode: rate.stationCode,
            name: result.name,
            countryCode: rate.countryCode,
            latitude: result.coordinates.latitude,
            longitude: result.coordinates.longitude,
            placeId: result.coordinates.placeId,
            region: rate.region,
          }
        });
        console.log(`✓ Added ${rate.stationCode} (${result.name})`);
      } else {
        console.log(`✗ Failed to get coordinates for ${rate.stationCode}`);
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('Finished processing airports');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 