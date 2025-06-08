import { generateObject } from 'ai';
import { z } from 'zod';
import { openai } from '@ai-sdk/openai';

// Define the schema for LLM output (raw strings)
const LLMRequestSchema = z.object({  
  company: z.string(),
  pickupDate: z.string().describe('Date and time in a parsable format, e.g. "2025-06-07T14:00:00" or "July 5th, 2025 at 2:00 PM"').nullable().transform((val) => val ? new Date(val) : null),
  deliveryDate: z.string().describe('Date and time in a parsable format, e.g. "2025-06-22T12:00:00" or "July 22nd, 2025 by noon"').nullable().transform((val) => val ? new Date(val) : null),
  
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

// Final type with parsed Date objects
export type ParsedRequest = {
  company: string;
  pickupDate: Date | null;
  deliveryDate: Date | null;
  height: number | null;
  width: number | null;
  length: number | null;
  weight: number | null;
  originAddress: string;
  destinationAddress: string;
  contactEmail: string | null;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  notes: string | null;
};


export const parseEmailToRequest = async (
  emailContent: string,
): Promise<ParsedRequest> => {
  const model = openai('gpt-4o-mini');

  const { object } = await generateObject({
    model,
    schema: LLMRequestSchema,
    prompt: `
Parse the following email content into a structured transport request. Extract all relevant shipping information:

Email Content:
${emailContent}

Instructions:
- Extract the raw email content and subject line
- Extract company name from email content or signature
- Parse pickup and delivery dates with time (include time when specified, format as "YYYY-MM-DDTHH:mm:ss", null if not specified or "TBD")
- Extract dimensions in cm (height x width x length) - convert all to numbers in cm
- Extract weight in kg - convert to number
- Extract full origin and destination addresses
- Find contact email addresses mentioned in the content
- Determine priority: URGENT if subject contains "urgent", otherwise NORMAL
- Add any special notes or additional information mentioned

Be flexible with date formats and handle complex date/time expressions:
- Standard formats: DD.MM.YYYY, "July 5th", "June 27th, 2025", etc.
- Relative dates: "around July 5th", "approximately June 15th"
- Time specifications: "at 14:00", "by noon", "before 3 PM"
- Conditional delivery: "before July 22nd", "by noon", "target: before [date]"
- Extract the most specific date possible, ignoring qualifiers like "around", "approximately"
- For delivery dates with "before" or "by", use the specified target date
- If time is specified, still format as ISO date (time info can go in notes if relevant)
- For "before" time specifications (e.g., "before 14:00"), use the specified time as the target time
- For "on or before" dates, use the specified date with time set to 12:00:00
- All dates should be in UTC timezone to ensure consistent handling

Handle dimension formats like "120 x 80 x 150 cm" (treat as 120 height, 80 width, 150 length), "100 cm high, 80 cm wide, 170 cm long"
Handle weight formats like "450 kg", "~460 kg", "500 kg"
If information is missing or unclear, use null for optional fields.

Current date: ${new Date().toISOString()}. If year or month is not specified, use the current year and month.
`,
  });

    console.log('object', object);

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