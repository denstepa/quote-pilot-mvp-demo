import { NextRequest, NextResponse } from "next/server";
import prisma from "@/libs/prisma";
import { parseEmailToRequest } from "@/utils/request_parser";
import { parseEmailFormData } from "@/utils/email-parser";


export async function POST(req: NextRequest) {
  console.log("Received request at /api/webhook/owlrelay");

  try {
    const formData = await req.formData();
    
    if (formData) {
      console.log("Form data received:", Object.fromEntries(formData.entries()));
      
      const emailMetadata = parseEmailFormData(formData);

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

  } catch (e: any) {
    console.error("Error processing webhook:", e);
    return NextResponse.json(
      { status: 'error', message: e.message },
      { status: e.status || 500 }
    );
  }
}
