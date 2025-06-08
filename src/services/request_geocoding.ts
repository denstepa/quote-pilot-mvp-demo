import { PrismaClient } from '@prisma/client';
import { geocodeAddress, type GeoCoordinates } from '@/utils/geocoding/google_geocoder';

const prisma = new PrismaClient();

export interface GeocodedRequest {
  id: string;
  originCoordinates: GeoCoordinates;
  destinationCoordinates: GeoCoordinates;
  distance: number;
  error?: string;
}

/**
 * Geocode a transport request's addresses
 */
export async function geocodeRequest(requestId: string): Promise<GeocodedRequest | null> {
  try {
    // Get the request
    const request = await prisma.request.findUnique({
      where: { id: requestId }
    });

    if (!request) {
      throw new Error('Request not found');
    }

    // Check if already geocoded
    const existingGeocoding = await prisma.requestGeocodingCache.findUnique({
      where: { requestId }
    });

    if (existingGeocoding) {
      return {
        id: requestId,
        originCoordinates: {
          latitude: existingGeocoding.originLatitude,
          longitude: existingGeocoding.originLongitude,
          formattedAddress: existingGeocoding.originFormattedAddress,
          placeId: existingGeocoding.originPlaceId,
          countryCode: existingGeocoding.originCountryCode
        },
        destinationCoordinates: {
          latitude: existingGeocoding.destinationLatitude,
          longitude: existingGeocoding.destinationLongitude,
          formattedAddress: existingGeocoding.destinationFormattedAddress,
          placeId: existingGeocoding.destinationPlaceId,
          countryCode: existingGeocoding.destinationCountryCode
        },
        distance: existingGeocoding.distance
      };
    }

    // Geocode both addresses
    const [originResult, destinationResult] = await Promise.all([
      geocodeAddress(request.originAddress),
      geocodeAddress(request.destinationAddress)
    ]);

    if (originResult.error || destinationResult.error) {
      throw new Error(
        `Geocoding failed: ${originResult.error || ''} ${destinationResult.error || ''}`
      );
    }

    // Calculate distance
    const distance = calculateDistance(
      originResult.coordinates,
      destinationResult.coordinates
    );

    // Save geocoding results
    await prisma.requestGeocoding.create({
      data: {
        requestId,
        originLatitude: originResult.coordinates.latitude,
        originLongitude: originResult.coordinates.longitude,
        originFormattedAddress: originResult.coordinates.formattedAddress,
        originPlaceId: originResult.coordinates.placeId,
        originCountryCode: originResult.coordinates.countryCode,
        destinationLatitude: destinationResult.coordinates.latitude,
        destinationLongitude: destinationResult.coordinates.longitude,
        destinationFormattedAddress: destinationResult.coordinates.formattedAddress,
        destinationPlaceId: destinationResult.coordinates.placeId,
        destinationCountryCode: destinationResult.coordinates.countryCode,
        distance
      }
    });

    return {
      id: requestId,
      originCoordinates: originResult.coordinates,
      destinationCoordinates: destinationResult.coordinates,
      distance
    };

  } catch (error) {
    console.error('Error geocoding request:', error);
    return null;
  }
}

/**
 * Calculate distance between two coordinates in kilometers
 */
function calculateDistance(origin: GeoCoordinates, destination: GeoCoordinates): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(destination.latitude - origin.latitude);
  const dLon = toRad(destination.longitude - origin.longitude);
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRad(origin.latitude)) * Math.cos(toRad(destination.latitude)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
} 