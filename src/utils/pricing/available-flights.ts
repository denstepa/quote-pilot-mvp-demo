import { Prisma, ScheduledFlight } from "@prisma/client";
import prisma from "../../libs/prisma";

type FindAvailableFlightParams = {
  originCode: string;
  destinationCode: string;
  airline: string;
  startTime: Date | null;
  deliveryDeadline: Date | null;
};

/**
 * Find available flights based on schedule within date range
 */
export async function findFirstAvailableFlight({
  originCode,
  destinationCode,
  airline,
  startTime,
  deliveryDeadline
}: FindAvailableFlightParams): Promise<ScheduledFlight | null> {
  if (!startTime) {
    throw new Error('Start time is required to find available flights');
  }
  
  const whereClause: Prisma.ScheduledFlightWhereInput = {
    originCode: originCode,
    destinationCode: destinationCode,
    airline,
    departureAt: {
      gte: startTime,
    },
  };

  if (deliveryDeadline) {
    whereClause.arrivalAt = {
      lte: deliveryDeadline,
    };
  }

  const flight = await prisma.scheduledFlight.findFirst({
    where: whereClause,
    orderBy: {
      departureAt: 'asc',
    },
  });

  return flight;
}
