import { NextRequest, NextResponse } from "next/server";
import prisma from "@/libs/prisma";
import { parseEmailToRequest } from "@/utils/request-parser";
import { geocodeAddress } from "@/utils/geocoding/google-geocoder";
import { buildAvailableRoutes } from "@/utils/routing";
import { calculateAllRequestRoutes } from "@/utils/pricing";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existingRequest = await prisma.request.findUnique({
      where: { id },
      include: {
        routeOptions: {
          include: {
            segments: true
          }
        }
      }
    });

    if (!existingRequest) {
      return NextResponse.json(
        { error: "Request not found" },
        { status: 404 }
      );
    }

    await prisma.request.update({
      where: { id },
      data: { status: 'PROCESSING' }
    });

    try {
      console.log("Re-parsing email content for transport request...");
      const emailContent = `Subject: ${existingRequest.subject}\n\n${existingRequest.rawBody}`;
      const parsedRequest = await parseEmailToRequest(emailContent);
      
      const originResult = await geocodeAddress(parsedRequest.originAddress);
      const destinationResult = await geocodeAddress(parsedRequest.destinationAddress);

      if (originResult.error || destinationResult.error) {
        throw new Error(
          `Geocoding failed: ${originResult.error || ''} ${destinationResult.error || ''}`
        );
      }

      if (existingRequest.routeOptions.length > 0) {
        await prisma.routeOption.deleteMany({
          where: {
            requestId: id
          }
        });
      }

      const updatedRequest = await prisma.request.update({
        where: { id },
        data: {
          company: parsedRequest.company,
          pickupDate: parsedRequest.pickupDate ? new Date(parsedRequest.pickupDate) : null,
          deliveryDate: parsedRequest.deliveryDate ?? null,
          
          height: parsedRequest.height,
          width: parsedRequest.width,
          length: parsedRequest.length,
          weight: parsedRequest.weight,
          
          originAddress: parsedRequest.originAddress,
          destinationAddress: parsedRequest.destinationAddress,
          
          contactEmail: parsedRequest.contactEmail,
          
          status: 'PENDING',
          priority: parsedRequest.priority,
          notes: parsedRequest.notes,

          originLatitude: originResult.coordinates.latitude,
          originLongitude: originResult.coordinates.longitude,
          originFormattedAddress: originResult.coordinates.formattedAddress,
          originPlaceId: originResult.coordinates.placeId,
          originCountryCode: originResult.coordinates.countryCode,
          destinationLatitude: destinationResult.coordinates.latitude,
          destinationLongitude: destinationResult.coordinates.longitude,
          destinationFormattedAddress: destinationResult.coordinates.formattedAddress,
          destinationPlaceId: destinationResult.coordinates.placeId,
          destinationCountryCode: destinationResult.coordinates.countryCode,

          cheapestRouteId: null,
          fastestRouteId: null,
        }
      });

      console.log("Building available routes...");
      await buildAvailableRoutes(updatedRequest);
      
      console.log("Calculating route prices...");
      const finalRequest = await calculateAllRequestRoutes(updatedRequest);

      return NextResponse.json({
        message: "Request successfully re-parsed and routes recalculated",
        request: finalRequest
      });

    } catch (error) {
      console.error("Error during re-parsing:", error);
      
      await prisma.request.update({
        where: { id },
        data: { status: 'FAILED' }
      });

      return NextResponse.json(
        { error: "Failed to re-parse request and calculate routes" },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error("Error re-parsing request:", error);
    return NextResponse.json(
      { error: "Failed to re-parse request" },
      { status: 500 }
    );
  }
} 