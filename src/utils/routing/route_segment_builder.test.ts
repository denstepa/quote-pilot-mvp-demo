import { Airport } from '@prisma/client';
import { buildAirportPairs } from './route_segment_builder';

describe('buildAirportPairs', () => {
  it('should create all possible pairs between origin and destination airports', async () => {
    // Test data
    const originAirports: Airport[] = [
      {
        id: '1',
        createdAt: new Date(),
        updatedAt: new Date(),
        stationCode: 'FRA',
        name: 'Frankfurt Airport',
        countryCode: 'DE',
        latitude: 50.0379,
        longitude: 8.5622,
        placeId: 'place1',
        region: 'Europe'
      },
      {
        id: '2',
        createdAt: new Date(),
        updatedAt: new Date(),
        stationCode: 'MUC',
        name: 'Munich Airport',
        countryCode: 'DE',
        latitude: 48.3538,
        longitude: 11.7861,
        placeId: 'place2',
        region: 'Europe'
      }
    ];

    const destinationAirports: Airport[] = [
      {
        id: '3',
        createdAt: new Date(),
        updatedAt: new Date(),
        stationCode: 'JFK',
        name: 'John F. Kennedy International Airport',
        countryCode: 'US',
        latitude: 40.6413,
        longitude: -73.7781,
        placeId: 'place3',
        region: 'North America'
      },
      {
        id: '4',
        createdAt: new Date(),
        updatedAt: new Date(),
        stationCode: 'LAX',
        name: 'Los Angeles International Airport',
        countryCode: 'US',
        latitude: 33.9416,
        longitude: -118.4085,
        placeId: 'place4',
        region: 'North America'
      }
    ];

    const result = await buildAirportPairs(originAirports, destinationAirports);

    // Should create 4 pairs (2 origins × 2 destinations)
    expect(result).toHaveLength(4);

    // Verify all pairs are created correctly
    expect(result).toEqual([
      { origin: originAirports[0], destination: destinationAirports[0] }, // FRA -> JFK
      { origin: originAirports[0], destination: destinationAirports[1] }, // FRA -> LAX
      { origin: originAirports[1], destination: destinationAirports[0] }, // MUC -> JFK
      { origin: originAirports[1], destination: destinationAirports[1] }  // MUC -> LAX
    ]);
  });

}); 