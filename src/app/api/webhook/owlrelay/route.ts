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

      const emailMetadata: EmailMetadata = {
        from: emailData.from || { address: 'unknown' },
        to: emailData.to || [{ address: 'unknown' }],
        subject: emailData.subject || '',
        date: emailData.date || new Date().toISOString(),
        messageId: emailData.messageId || '',
        text: emailData.text || '',
        html: emailData.html || ''
      };

      const fromAddress = emailMetadata.from.address;
      const toAddress = emailMetadata.to[0]?.address || 'unknown';
      const emailContent = emailMetadata.text;
      
      console.log("Processed email metadata:", emailMetadata);
      
      if (!emailContent.trim()) {
        throw new Error("No email content found to parse");
      }

      // First, save the email request to DB with basic information
      console.log("Creating initial request record...");
      const initialRequest = await prisma.request.create({
        data: {
          rawBody: emailContent,
          subject: emailMetadata.subject,
          from: fromAddress,
          to: toAddress,
          
          company: '',
          originAddress: '',
          destinationAddress: '',
          
          status: 'PENDING',
        }
      });

      console.log(`✅ Initial request created with ID: ${initialRequest.id}`);

      try {
        console.log("Parsing email content for transport request...");
        const parsedRequest = await parseEmailToRequest(`Subject: ${emailMetadata.subject}\n\n${emailContent}`);
        
        const [originResult, destinationResult] = await Promise.all([
          geocodeAddress(parsedRequest.originAddress),
          geocodeAddress(parsedRequest.destinationAddress)
        ]);

        if (originResult.error || destinationResult.error) {
          throw new Error(
            `Geocoding failed: ${originResult.error || ''} ${destinationResult.error || ''}`
          );
        }

        const updatedRequest = await prisma.request.update({
          where: { id: initialRequest.id },
          data: {
            company: parsedRequest.company,
            pickupDate: parsedRequest.pickupDate ? new Date(parsedRequest.pickupDate) : null,
            deliveryDate: parsedRequest.deliveryDate ? new Date(parsedRequest.deliveryDate) : null,
            
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
          }
        });

        return NextResponse.json({ 
          status: 'success', 
          requestId: updatedRequest.id,
          parsedData: parsedRequest
        }, { status: 200 });

      } catch (parseError) {
        await prisma.request.update({
          where: { id: initialRequest.id },
          data: {
            status: 'FAILED',
            notes: `Parsing failed: ${(parseError as Error).message}`
          }
        });

        return NextResponse.json({ 
          status: 'partial_success', 
          requestId: initialRequest.id,
          message: 'Email saved but parsing failed',
          error: (parseError as Error).message
        }, { status: 200 });
      }
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
