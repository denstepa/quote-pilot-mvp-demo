import { Prisma, RouteSegment as PrismaRouteSegment, RouteStatus, SegmentType } from '@prisma/client';

export type RouteSegment = PrismaRouteSegment & {
  // Add any additional fields or overrides here
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const requestWithRouteOptions = Prisma.validator<Prisma.RequestDefaultArgs>()({
  include: {
    cheapestRoute: true,
    fastestRoute: true,
    routeOptions: {
      include: {
        segments: {
        }
      }
    }
  }
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const routeOptionWithSegments = Prisma.validator<Prisma.RouteOptionDefaultArgs>()({ 
  include: {
    segments: true,
  },
});

export type RouteOptionWithSegments = Prisma.RouteOptionGetPayload<typeof routeOptionWithSegments>;

export type RequestWithRouteOptions = Prisma.RequestGetPayload<typeof requestWithRouteOptions>;

export { RouteStatus, SegmentType };
