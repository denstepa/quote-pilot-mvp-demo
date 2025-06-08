import { NextRequest, NextResponse } from "next/server";
import prisma from "@/libs/prisma";
import { buildAvailableRoutes } from "@/utils/routing";
import { calculateRoutePrice } from "@/utils/pricing";
import { RouteOptionWithSegments } from "../../../../../../types";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const requestData = await prisma.request.findUnique({
      where: { id },
      include: {
        routeOptions: {
          include: {
            segments: true
          }
        }
      }
    });

    if (!requestData) {
      return NextResponse.json(
        { error: "Request not found" },
        { status: 404 }
      );
    }

    if (requestData.routeOptions.length > 0) {
      await prisma.routeOption.deleteMany({
        where: {
          requestId: id
        }
      });
    }

    const routes: RouteOptionWithSegments[] = await buildAvailableRoutes(requestData);

    const routesWithPrices: RouteOptionWithSegments[] = [];
    for (const route of routes) {
      const routeWithPrice = await calculateRoutePrice(route);
      routesWithPrices.push(routeWithPrice);
    }

    return NextResponse.json(routesWithPrices);
  } catch (error) {
    console.error("Error calculating routes:", error);
    return NextResponse.json(
      { error: "Failed to calculate routes" },
      { status: 500 }
    );
  }
} 