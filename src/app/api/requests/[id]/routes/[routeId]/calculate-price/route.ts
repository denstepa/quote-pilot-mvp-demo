import { NextResponse } from 'next/server';
import { calculateRoutePrice } from '@/utils/pricing';
import prisma from '@/libs/prisma';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ routeId: string }> }
) {

  const { routeId } = await params;  
  try {
    const route = await prisma.routeOption.findUniqueOrThrow({
      where: { id: routeId },
      include: {
        segments: true,
      },
    });

    if (!route) {
      return NextResponse.json(
        { error: 'Route not found' },
        { status: 404 }
      );
    }

    await calculateRoutePrice(route);

    const completeUpdatedRoute = await prisma.routeOption.findUniqueOrThrow({
      where: { id: routeId },
      include: {
        segments: {
          orderBy: {
            sequence: 'asc'
          }
        },
      },
    });

    return NextResponse.json(completeUpdatedRoute);
  } catch (error) {
    console.error('Error calculating route price:', error);
    return NextResponse.json(
      { error: 'Failed to calculate route price' },
      { status: 500 }
    );
  }
} 
