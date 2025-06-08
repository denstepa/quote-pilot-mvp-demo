import { NextRequest, NextResponse } from "next/server";
import prisma from "@/libs/prisma";
import { buildAvailableRoutes } from "@/utils/routing";

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

    const routes = await buildAvailableRoutes(requestData);

    return NextResponse.json(routes);
  } catch (error) {
    console.error("Error calculating routes:", error);
    return NextResponse.json(
      { error: "Failed to calculate routes" },
      { status: 500 }
    );
  }
} 