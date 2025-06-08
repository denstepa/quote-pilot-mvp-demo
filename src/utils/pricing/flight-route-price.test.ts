
import { RouteSegment, Request, ScheduledFlight, PrismaClient, RouteOption } from "@prisma/client";
import { calculateFlightPrice } from "./flight-route-price";


describe("Flight Route Price Calculations", () => {
  let prisma: PrismaClient;

  beforeAll(async () => {
    prisma = new PrismaClient();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });


  describe("calculateFlightPrice", () => {
    it("should calculate total price for a flight with USD rates", async () => {
      
      const routeSegment: RouteSegment = await prisma.routeSegment.findFirstOrThrow({
        where: {
          originAirportCode: "MUC",
          destinationAirportCode: "MEX",
          segmentType: "AIR",
        },
      });

      const routeOption: RouteOption = await prisma.routeOption.findFirstOrThrow({
        where: {
          id: routeSegment.routeOptionId,
        },
      });

      const request: Request = await prisma.request.findFirstOrThrow({
        where: {
          id: routeOption.requestId,
        },
      });

      const scheduledFlight: ScheduledFlight = await prisma.scheduledFlight.findFirstOrThrow({
        where: {
          airline: routeSegment.airline!,
          originCode: routeSegment.originAirportCode!,
          destinationCode: routeSegment.destinationAirportCode!,
          departureAt: {
            gte: request.pickupDate!,
          }
        },
      });

      const result = await calculateFlightPrice(scheduledFlight, routeSegment, request);

      expect(result).toBe(4163.58);
    });
  });
}); 