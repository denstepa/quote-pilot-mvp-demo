import { NextRequest, NextResponse } from "next/server";
import prisma from "@/libs/prisma";
import { parseEmailToRequest } from "@/utils/request_parser";
import { geocodeAddress } from "@/utils/geocoding/google_geocoder";

interface EmailAddress {
  address: string;
  name?: string;
}

interface EmailMetadata {
  from: EmailAddress;
  to: EmailAddress[];
  subject: string;
  date: string;
  messageId: string;
  text: string;
  html?: string;
}

export async function POST(req: NextRequest) {
  console.log("Received request at /api/webhook/owlrelay");

  try {
    const formData = await req.formData();
    
    if (formData) {
      console.log("Form data received:", Object.fromEntries(formData.entries()));

      // Get form data entries as an array of keys
      const formDataEntries = Array.from(formData.entries());
      console.log("Form data entries:", formDataEntries.map(entry => entry[0]));
      
      // Parse the email JSON from the form data
      const emailJsonString = formData.get('email') as string;
      if (!emailJsonString) {
        throw new Error("No email data found in form data");
      }

      let emailData;
      try {
        emailData = JSON.parse(emailJsonString);
      } catch (parseError) {
        throw new Error(`Failed to parse email JSON: ${parseError}`);
      }

      // Extract email metadata from the parsed JSON
      const emailMetadata: EmailMetadata = {
        from: emailData.from || { address: 'unknown' },
        to: emailData.to || [{ address: 'unknown' }],
        subject: emailData.subject || '',
        date: emailData.date || new Date().toISOString(),
        messageId: emailData.messageId || '',
        text: emailData.text || '',
        html: emailData.html || ''
      };

      // Get email address from metadata
      const fromAddress = emailMetadata.from.address;
      const toAddress = emailMetadata.to[0]?.address || 'unknown';
      const emailContent = emailMetadata.text;
      
      console.log("Processed email metadata:", emailMetadata);
      
      if (!emailContent.trim()) {
        throw new Error("No email content found to parse");
      }

      // Parse the email content to extract request data
      console.log("Parsing email content for transport request...");
      const parsedRequest = await parseEmailToRequest(`Subject: ${emailMetadata.subject}\n\n${emailContent}`);
      
      // Geocode both addresses
      const [originResult, destinationResult] = await Promise.all([
        geocodeAddress(parsedRequest.originAddress),
        geocodeAddress(parsedRequest.destinationAddress)
      ]);

      if (originResult.error || destinationResult.error) {
        throw new Error(
          `Geocoding failed: ${originResult.error || ''} ${destinationResult.error || ''}`
        );
      }

      console.log("Parsed request data:", parsedRequest);

      // Convert parsed data to Prisma-compatible format and save to database
      const savedRequest = await prisma.request.create({
        data: {
          // Raw email data
          rawBody: emailContent,
          subject: emailMetadata.subject,
          from: fromAddress,
          to: toAddress,
          
          // Parsed shipping details
          company: parsedRequest.company,
          pickupDate: parsedRequest.pickupDate ? new Date(parsedRequest.pickupDate) : null,
          deliveryDate: parsedRequest.deliveryDate ? new Date(parsedRequest.deliveryDate) : null,
          
          // Dimensions and weight
          height: parsedRequest.height,
          width: parsedRequest.width,
          length: parsedRequest.length,
          weight: parsedRequest.weight,
          
          // Addresses
          originAddress: parsedRequest.originAddress,
          destinationAddress: parsedRequest.destinationAddress,
          
          // Contact information
          contactEmail: parsedRequest.contactEmail,
          
          // Additional metadata
          status: 'PENDING',
          priority: parsedRequest.priority,
          notes: parsedRequest.notes,

          // Geocoding fields
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
        }
      });
      
      if (!savedRequest || !savedRequest.id) {
        throw new Error("Failed to create request record");
      }

      console.log(`✅ Successfully created request: ${savedRequest.id}`);
      
      return NextResponse.json({ 
        status: 'success', 
        requestId: savedRequest.id,
        parsedData: parsedRequest
      }, { status: 200 });
    }
    
    throw new Error("No form data received");

  } catch (e: unknown) {
    console.error("Error processing webhook:", e);
    return NextResponse.json(
      { status: 'error', message: (e as Error).message },
      { status: (e as { status?: number }).status || 500 }
    );
  }
}
