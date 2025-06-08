import { NextRequest, NextResponse } from 'next/server';
import { calculateRouteOptions } from '@/utils/routing/route_calculator';
import type { ParsedRequest } from '@/utils/request_parser';


// TODO: save incoming email before parsing, to be able to retry in case it fails.

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate the request body matches ParsedRequest structure
    const parsedRequest: ParsedRequest = {
      company: body.company,
      pickupDate: body.pickupDate ? new Date(body.pickupDate) : null,
      deliveryDate: body.deliveryDate ? new Date(body.deliveryDate) : null,
      height: body.height,
      width: body.width,
      length: body.length,
      weight: body.weight,
      originAddress: body.originAddress,
      destinationAddress: body.destinationAddress,
      contactEmail: body.contactEmail,
      priority: body.priority || 'NORMAL',
      notes: body.notes
    };

    // Validate required fields
    if (!parsedRequest.company || !parsedRequest.originAddress || !parsedRequest.destinationAddress) {
      return NextResponse.json(
        { error: 'Missing required fields: company, originAddress, destinationAddress' },
        { status: 400 }
      );
    }

    // Calculate route options
    const routeOptions = await calculateRouteOptions(parsedRequest);

    if (routeOptions.errors.length > 0) {
      return NextResponse.json(
        { 
          routes: routeOptions.routes,
          errors: routeOptions.errors,
          message: 'Route calculation completed with some errors'
        },
        { status: 200 }
      );
    }

    return NextResponse.json({
      routes: routeOptions.routes,
      message: `Found ${routeOptions.routes.length} route options`
    });

  } catch (error) {
    console.error('Error calculating routes:', error);
    return NextResponse.json(
      { error: 'Failed to calculate routes', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 