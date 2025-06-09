import { PrismaClient } from '@prisma/client';
import { geocodeAddress, GeoCoordinatesWithAddress } from '../src/utils/geocoding/google-geocoder';

const prisma = new PrismaClient();

async function main() {
  const requestId = process.argv[2];
  if (!requestId) {
    console.error('Usage: tsx scripts/geocode-request.ts <requestId>');
    process.exit(1);
  }

  const request = await prisma.request.findUnique({ where: { id: requestId } });
  if (!request) {
    console.error('Request not found');
    process.exit(1);
  }

  const origin = await geocodeAddress(request.originAddress);
  const destination = await geocodeAddress(request.destinationAddress);

  if (origin.error || destination.error) {
    console.error('Geocoding error:', origin.error || destination.error);
    process.exit(1);
  }

  await prisma.request.update({
    where: { id: requestId },
    data: {
      originLatitude: origin.coordinates.latitude,
      originLongitude: origin.coordinates.longitude,
      originFormattedAddress: origin.coordinates.formattedAddress,
      originPlaceId: origin.coordinates.placeId,
      originCountryCode: origin.coordinates.countryCode,
      destinationLatitude: destination.coordinates.latitude,
      destinationLongitude: destination.coordinates.longitude,
      destinationFormattedAddress: destination.coordinates.formattedAddress,
      destinationPlaceId: destination.coordinates.placeId,
      destinationCountryCode: destination.coordinates.countryCode,
    },
  });

  console.log('Geocoding complete:', {
    origin: origin.coordinates,
    destination: destination.coordinates,
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
}); 