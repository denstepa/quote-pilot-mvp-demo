import { PrismaClient } from '@prisma/client';
import { findClosestAirport, findClosestAirports } from '../../src/utils/routing/airport_finder';

describe('Airport Finder', () => {
  let prisma: PrismaClient;

  beforeAll(async () => {
    prisma = new PrismaClient();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('findClosestAirport (single airport)', () => {
    it('should find the closest airport to given coordinates', async () => {
      // Test coordinates (near Frankfurt)
      const latitude = 52.53288420000001;
      const longitude = 13.3992845;

      const result = await findClosestAirport(latitude, longitude);

      expect(result).not.toBeNull();
      expect(result?.stationCode).toBe('FRA');
    });

    it('should find the closest airport to Mexico City coordinates', async () => {
      // Test coordinates (near Mexico City)
      const latitude = 20.6777099;
      const longitude = -103.3897781;

      const result = await findClosestAirport(latitude, longitude);

      expect(result).not.toBeNull();
      expect(result?.stationCode).toBe('GDL');
    });
  });

  describe('findClosestAirports (multiple airports)', () => {
    it('should return 3 closest airports to given coordinates', async () => {
      // Test coordinates (near Frankfurt)
      const latitude = 52.53288420000001;
      const longitude = 13.3992845;

      const results = await findClosestAirports(latitude, longitude);

      expect(results).toHaveLength(3);
      expect(results[0].stationCode).toBe('FRA');
      // Verify distances are in ascending order
      expect(results[0].distance).toBeLessThan(results[1].distance);
      expect(results[1].distance).toBeLessThan(results[2].distance);
    });

    it('should return custom number of closest airports', async () => {
      // Test coordinates (near Mexico City)
      const latitude = 20.6777099;
      const longitude = -103.3897781;

      const results = await findClosestAirports(latitude, longitude, 2);

      expect(results).toHaveLength(2);
      expect(results[0].stationCode).toBe('GDL');
      expect(results[0].distance).toBeLessThan(results[1].distance);
    });
  });
}); 