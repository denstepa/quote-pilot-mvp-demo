import { generateObject } from 'ai';
import { z } from 'zod';
import { openai } from '@ai-sdk/openai';

// Define the schema matching the Prisma Request model
const RequestSchema = z.object({  
  company: z.string(),
  pickupDate: z.string().describe('Date of the event in ISO 8601 format, e.g. 2025-06-07').nullable().transform((val) => val ? new Date(val) : null),
  deliveryDate: z.string().describe('Date of the event in ISO 8601 format, e.g. 2025-06-07').nullable().transform((val) => val ? new Date(val) : null),
  
  // Dimensions and weight
  height: z.number().nullable(),
  width: z.number().nullable(),
  length: z.number().nullable(),
  weight: z.number().nullable(),
  
  // Addresses
  originAddress: z.string(),
  destinationAddress: z.string(),
  
  // Contact information
  contactEmail: z.string().nullable(),
  
  // Additional metadata
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']),
  notes: z.string().nullable(),
});

export type ParsedRequest = z.infer<typeof RequestSchema>;


export const parseEmailToRequest = async (
  emailContent: string,
): Promise<ParsedRequest> => {
  const model = openai('gpt-4o-mini');

  const { object } = await generateObject({
    model,
    schema: RequestSchema,
    prompt: `
Parse the following email content into a structured transport request. Extract all relevant shipping information:

Email Content:
${emailContent}

Instructions:
- Extract the raw email content and subject line
- Extract company name from email content or signature
- Parse pickup and delivery dates (format as ISO strings, null if not specified or "TBD")
- Extract dimensions in cm (height x width x length) - convert all to numbers in cm
- Extract weight in kg - convert to number
- Extract full origin and destination addresses
- Find contact email addresses mentioned in the content
- Determine priority: URGENT if subject contains "urgent", otherwise NORMAL
- Add any special notes or additional information mentioned

Be flexible with date formats (handle DD.MM.YYYY, "July 5th", "June 27th, 2025", etc.)
Handle dimension formats like "120 x 80 x 150 cm" (treat as 120 height, 80 width, 150 length), "100 cm high, 80 cm wide, 170 cm long"
Handle weight formats like "450 kg", "~460 kg", "500 kg"
If information is missing or unclear, use null for optional fields.
`,
  });

  return object;
};

export const parseEmailFile = async (
  filePath: string,
): Promise<ParsedRequest> => {
  const fs = await import('fs/promises');
  const emailContent = await fs.readFile(filePath, 'utf-8');
  return parseEmailToRequest(emailContent);
};

export const parseMultipleEmails = async (
  emailContents: string[],
): Promise<ParsedRequest[]> => {
  const results = await Promise.all(
    emailContents.map(content => parseEmailToRequest(content))
  );
  return results;
};