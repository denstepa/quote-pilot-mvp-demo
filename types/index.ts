import { Prisma, RouteSegment as PrismaRouteSegment, RouteStatus, SegmentType } from '@prisma/client';

export type RouteSegment = PrismaRouteSegment & {
  // Add any additional fields or overrides here
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const routeOptionWithSegments = Prisma.validator<Prisma.RouteOptionDefaultArgs>()({ 
  include: {
    segments: true,
  },
});

export type RouteOptionWithSegments = Prisma.RouteOptionGetPayload<typeof routeOptionWithSegments>;

export { RouteStatus, SegmentType };
