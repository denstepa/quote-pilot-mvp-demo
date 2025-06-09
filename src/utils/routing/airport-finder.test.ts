import { PrismaClient } from '@prisma/client';
import { findClosestAirports } from './airport-finder';

describe('findClosestAirports', () => {
  let prisma: PrismaClient;

  beforeAll(async () => {
    prisma = new PrismaClient();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should return the closest airports sorted by distance', async () => {
    // Test coordinates (Berlin)
    const latitude = 52.5200;
    const longitude = 13.4050;

    const result = await findClosestAirports(latitude, longitude);

    expect(result).toHaveLength(3);

    expect(result.map(airport => airport.stationCode)).toStrictEqual(['FRA', 'MUC', 'AMS']);  
  });

}); 