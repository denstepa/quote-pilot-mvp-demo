import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface GeoCoordinates {
  latitude: number;
  longitude: number;
  formattedAddress: string;
  placeId: string;
  countryCode: string;
}

export interface GeocodingResult {
  coordinates: GeoCoordinates;
  error?: string;
}

interface GoogleAddressComponent {
  long_name: string;
  short_name: string;
  types: string[];
}

interface GoogleGeocodingResult {
  status: string;
  results: Array<{
    formatted_address: string;
    place_id: string;
    geometry: {
      location: {
        lat: number;
        lng: number;
      };
    };
    address_components: GoogleAddressComponent[];
  }>;
}

/**
 * Geocode an address using Google Maps API
 */
export async function geocodeAddress(address: string): Promise<GeocodingResult> {
  try {
    // First check if we have cached coordinates
    const cachedResult = await getCachedCoordinates(address);
    if (cachedResult) {
      return { coordinates: cachedResult };
    }

    // If not in cache, call Google API
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      throw new Error('Google Maps API key is not configured');
    }

    const encodedAddress = encodeURIComponent(address);
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${apiKey}`;
    
    const response = await fetch(url);
    const data = await response.json() as GoogleGeocodingResult;

    if (data.status !== 'OK') {
      throw new Error(`Geocoding failed: ${data.status}`);
    }

    const result = data.results[0];
    const coordinates: GeoCoordinates = {
      latitude: result.geometry.location.lat,
      longitude: result.geometry.location.lng,
      formattedAddress: result.formatted_address,
      placeId: result.place_id,
      countryCode: extractCountryCode(result.address_components)
    };

    // Cache the result
    await cacheCoordinates(address, coordinates);

    return { coordinates };
  } catch (error) {
    console.error('Geocoding error:', error);
    return {
      coordinates: {
        latitude: 0,
        longitude: 0,
        formattedAddress: address,
        placeId: '',
        countryCode: ''
      },
      error: error instanceof Error ? error.message : 'Unknown geocoding error'
    };
  }
}

/**
 * Geocode multiple addresses in parallel
 */
export async function geocodeAddresses(addresses: string[]): Promise<GeocodingResult[]> {
  return Promise.all(addresses.map(address => geocodeAddress(address)));
}

/**
 * Get cached coordinates for an address
 */
async function getCachedCoordinates(address: string): Promise<GeoCoordinates | null> {
  const cached = await prisma.geocodingCache.findUnique({
    where: { address }
  });

  if (!cached) return null;

  return {
    latitude: cached.latitude,
    longitude: cached.longitude,
    formattedAddress: cached.formattedAddress,
    placeId: cached.placeId,
    countryCode: cached.countryCode
  };
}

/**
 * Cache coordinates for an address
 */
async function cacheCoordinates(address: string, coordinates: GeoCoordinates): Promise<void> {
  await prisma.geocodingCache.upsert({
    where: { address },
    update: {
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      formattedAddress: coordinates.formattedAddress,
      placeId: coordinates.placeId,
      countryCode: coordinates.countryCode,
      lastUpdated: new Date()
    },
    create: {
      address,
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      formattedAddress: coordinates.formattedAddress,
      placeId: coordinates.placeId,
      countryCode: coordinates.countryCode,
      lastUpdated: new Date()
    }
  });
}

/**
 * Extract country code from Google address components
 */
function extractCountryCode(addressComponents: GoogleAddressComponent[]): string {
  const countryComponent = addressComponents.find(
    component => component.types.includes('country')
  );
  return countryComponent?.short_name || '';
}

/**
 * Calculate distance between two coordinates in kilometers
 */
export function calculateDistance(
  origin: GeoCoordinates,
  destination: GeoCoordinates
): number {
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