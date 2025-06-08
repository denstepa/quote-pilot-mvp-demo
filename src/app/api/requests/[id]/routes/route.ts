import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/libs/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Request ID is required' },
        { status: 400 }
      );
    }

    // Fetch existing route options for the request
    const routeOptions = await prisma.routeOption.findMany({
      where: {
        requestId: id
      },
      include: {
        segments: {
          orderBy: {
            sequence: 'asc'
          }
        }
      }
    });

    return NextResponse.json({
      routes: routeOptions,
      message: `Found ${routeOptions.length} route options`
    });

  } catch (error) {
    console.error('Error fetching routes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch routes' },
      { status: 500 }
    );
  }
} 