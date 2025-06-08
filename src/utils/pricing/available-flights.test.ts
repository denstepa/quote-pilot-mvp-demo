import { findFirstAvailableFlight } from './available-flights';
import { PrismaClient } from '@prisma/client';

describe('findFirstAvailableFlight', () => {
  let prisma: PrismaClient;

  beforeAll(async () => {
    prisma = new PrismaClient();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should find an available flight within the given time range', async () => {
    const result = await findFirstAvailableFlight({
      originCode: 'MUC',
      destinationCode: 'MEX',
      airline: 'LH',
      startTime: new Date('2025-06-10T09:00:00Z'),
      deliveryDeadline: new Date('2025-06-30T14:00:00Z')
    });

    expect(result).not.toBeNull();
    expect(result?.originCode).toBe('MUC');
    expect(result?.destinationCode).toBe('MEX');
    expect(result?.airline).toBe('LH');
    expect(result?.departureAt).toStrictEqual(new Date('2025-06-11T16:45:00'));
    expect(result?.arrivalAt).toStrictEqual(new Date('2025-06-11T21:00:00'));
  });

}); 