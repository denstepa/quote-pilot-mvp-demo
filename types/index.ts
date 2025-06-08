import { RouteOption as PrismaRouteOption, RouteSegment as PrismaRouteSegment, RouteStatus, SegmentType } from '@prisma/client';

export type RouteSegment = PrismaRouteSegment & {
  // Add any additional fields or overrides here
};

export type RouteOptionWithSegments = PrismaRouteOption & {
  // Add any additional fields or overrides here
  segments: RouteSegment[];
};

export { RouteStatus, SegmentType };
