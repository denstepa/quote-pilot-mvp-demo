import * as XLSX from 'xlsx';
import { PrismaClient } from '@prisma/client';
import path from 'path';

const prisma = new PrismaClient();

interface RateSheetData {
  [key: string]: any;
}

interface ProcessedRecord {
  company: string;
  originAddress: string;
  destinationAddress: string;
  pickupDate?: Date | null;
  deliveryDate?: Date | null;
  height?: number | null;
  width?: number | null;
  length?: number | null;
  weight?: number | null;
  contactEmail?: string | null;
  notes?: string | null;
  rawData: any;
}

interface UploadResult {
  successCount: number;
  errorCount: number;
}

// Data processors for different sheet types
const SheetProcessors: Record<string, (data: RateSheetData[], sheetName: string) => ProcessedRecord[]> = {
  'Trucking Rates Europe': processTruckingRates,
  'Trucking Rates Mexico': processTruckingRates,
  'Airport Rates Europe': processAirportRates,
  'Airport Rates Mexico': processAirportRates,
  'Airline Rates': processAirlineRates,
  'Schedule Lufthansa Cargo (LH)': processFlightSchedule,
  'Schedule Aeromexico (AM)': processFlightSchedule
};

function processTruckingRates(jsonData: RateSheetData[], sheetName: string): ProcessedRecord[] {  
  console.log(`Processing trucking rates from ${sheetName}...`);
  
  return jsonData
    .filter(row => row.Origin && row.Destination && row['Base Price'])
    .map(row => ({
      company: `Trucking Service - ${row.Origin} to ${row.Destination}`,
      originAddress: row.Origin,
      destinationAddress: row.Destination,
      notes: `Base Price: ${row['Base Price']} ${row.Currency}, km Price: ${row['km Price']} ${row.Currency}`,
      rawData: {
        type: 'trucking_rates',
        sheet: sheetName,
        basePrice: row['Base Price'],
        kmPrice: row['km Price'],
        currency: row.Currency
      }
    }));
}

function processAirportRates(jsonData: RateSheetData[], sheetName: string): ProcessedRecord[] {
  console.log(`Processing airport rates from ${sheetName}...`);
  
  return jsonData
    .filter(row => row['Station Code'] && row['Country Code'])
    .map(row => ({
      company: `${row.Airline || 'Unknown'} - ${row['Station Code']} Airport`,
      originAddress: `${row['Station Code']} Airport, ${row['Country Code']}`,
      destinationAddress: 'Various destinations',
      notes: `Export Handling: ${row['Export Handling']} ${row.Currency}, Export Customs: ${row['Export Customs ']} ${row.Currency}`,
      rawData: {
        type: 'airport_rates',
        sheet: sheetName,
        stationCode: row['Station Code'],
        countryCode: row['Country Code'],
        airline: row.Airline,
        exportHandling: row['Export Handling'],
        exportCustoms: row['Export Customs '],
        currency: row.Currency
      }
    }));
}

function processAirlineRates(jsonData: RateSheetData[], sheetName: string): ProcessedRecord[] {
  console.log(`Processing airline rates from ${sheetName}...`);
  
  return jsonData
    .filter(row => row['Station Code'] && row['Origin Country Code'] && row['Destination Country Code'])
    .map(row => ({
      company: `${row.Airline || 'Unknown'} Airline - ${row['Station Code']}`,
      originAddress: `${row['Station Code']} Airport, ${row['Origin Country Code']}`,
      destinationAddress: `Destination: ${row['Destination Country Code']}`,
      notes: `Base Price: ${row['Base Price']} ${row.Currency}, Fuel Charge: ${row['Fuel Charge per kg']} ${row.Currency}/kg`,
      weight: row['kg Price\n(for shipments <45kg)'] ? 45 : null,
      rawData: {
        type: 'airline_rates',
        sheet: sheetName,
        stationCode: row['Station Code'],
        originCountry: row['Origin Country Code'],
        destinationCountry: row['Destination Country Code'],
        airline: row.Airline,
        fuelCharge: row['Fuel Charge per kg'],
        basePrice: row['Base Price'],
        currency: row.Currency,
        rateTable: {
          under45kg: row['kg Price\n(for shipments <45kg)'],
          under100kg: row['kg Price\n(for shipments <100kg)'],
          under250kg: row['kg Price\n(for shipments <250kg)'],
          under300kg: row['kg Price\n(for shipments <300kg)'],
          under500kg: row['kg Price\n(for shipments <500kg)'],
          under1000kg: row['kg Price\n(for shipments <1000kg)'],
          over1000kg: row['kg Price\n(for shipments >=1000kg)']
        }
      }
    }));
}

function processFlightSchedule(jsonData: RateSheetData[], sheetName: string): ProcessedRecord[] {
  console.log(`Processing flight schedule from ${sheetName}...`);
  
  if (sheetName.includes('Lufthansa')) {
    return jsonData
      .filter(row => row.AL && row.FNR && row.DEP && row.ARR)
      .map(row => ({
        company: `${row.AL} Flight ${row.FNR}`,
        originAddress: `${row.DEP} Airport`,
        destinationAddress: `${row.ARR} Airport`,
        notes: `Flight Schedule - Departure: ${formatTime(row['(Departure Time'])}, Arrival: ${formatTime(row['Arrival Time'])}`,
        rawData: {
          type: 'flight_schedule',
          sheet: sheetName,
          airline: row.AL,
          flightNumber: row.FNR,
          departure: row.DEP,
          arrival: row.ARR,
          departureTime: row['(Departure Time'],
          arrivalTime: row['Arrival Time'],
          schedule: {
            monday: !!row.Mo,
            tuesday: !!row.Tu,
            wednesday: !!row.We,
            thursday: !!row.Th,
            friday: !!row.Fr,
            saturday: !!row.Sa,
            sunday: !!row.Su
          }
        }
      }));
  } else {
    // Aeromexico format
    return jsonData
      .filter(row => row.Origin && row.Destination && row.Carrier)
      .map(row => ({
        company: `${row.Carrier} Flight ${row['Flight#']}`,
        originAddress: `${row.Origin} Airport`,
        destinationAddress: `${row.Destination} Airport`,
        pickupDate: parseAMDate(row['Departure Date']),
        notes: `Flight ${row['Flight#']} - Departure: ${formatAMTime(row['Dep. Time (2225 = 22:55)'])}, Arrival: ${formatAMTime(row['Arr. Time (+1 = day after)'])}`,
        rawData: {
          type: 'flight_schedule',
          sheet: sheetName,
          origin: row.Origin,
          destination: row.Destination,
          carrier: row.Carrier,
          flightNumber: row['Flight#'],
          departureDate: row['Departure Date'],
          departureTime: row['Dep. Time (2225 = 22:55)'],
          arrivalTime: row['Arr. Time (+1 = day after)']
        }
      }));
  }
}

// Helper functions
function formatTime(excelTime: unknown): string {
  if (typeof excelTime === 'number') {
    const hours = Math.floor(excelTime * 24);
    const minutes = Math.floor((excelTime * 24 * 60) % 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }
  return String(excelTime);
}

function formatAMTime(timeValue: unknown): string {
  if (typeof timeValue === 'number') {
    const timeStr = timeValue.toString();
    if (timeStr.length >= 3) {
      const hours = timeStr.slice(0, -2);
      const minutes = timeStr.slice(-2);
      return `${hours}:${minutes}`;
    }
  }
  return String(timeValue);
}

function parseAMDate(dateStr: unknown): Date | null {
  try {
    if (typeof dateStr === 'string' && dateStr.includes('.')) {
      // Format: "19.06.25" -> "2025-06-19"
      const parts = dateStr.split('.');
      const day = parts[0];
      const month = parts[1];
      const year = '20' + parts[2];
      return new Date(`${year}-${month}-${day}`);
    }
  } catch (error) {
    console.warn('Could not parse date:', dateStr);
  }
  return null;
}

async function parseExcelFile(): Promise<void> {
  try {
    // Read the Excel file
    const filePath = path.join(process.cwd(), 'data', 'Quotepilot - Rate Sheets and Schedules.xlsx');
    const workbook = XLSX.readFile(filePath);
    
    console.log('Available worksheets:', workbook.SheetNames);
    
    // Let's examine each sheet to understand the structure
    for (const sheetName of workbook.SheetNames) {
      console.log(`\n=== Sheet: ${sheetName} ===`);
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      // Show first few rows to understand structure
      console.log('First 5 rows:');
      jsonData.slice(0, 5).forEach((row: unknown, index: number) => {
        console.log(`Row ${index + 1}:`, row);
      });
      
      // Show headers if they exist
      if (jsonData.length > 0) {
        console.log('Potential headers:', jsonData[0]);
      }
      
      console.log(`Total rows in ${sheetName}: ${jsonData.length}`);
    }
    
  } catch (error) {
    console.error('Error parsing Excel file:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function uploadToDatabase(data: ProcessedRecord[], sheetName: string): Promise<UploadResult> {
  try {
    console.log(`Starting database upload for ${sheetName}...`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const item of data) {
      try {
        const requestData = {
          // Required fields
          rawBody: JSON.stringify(item.rawData || item),
          subject: `${sheetName} Import - ${item.company}`,
          from: 'excel-import@quotepilot.com',
          to: 'system@quotepilot.com',
          company: item.company,
          originAddress: item.originAddress,
          destinationAddress: item.destinationAddress,
          
          // Optional fields
          pickupDate: item.pickupDate || null,
          deliveryDate: item.deliveryDate || null,
          height: item.height || null,
          width: item.width || null,
          length: item.length || null,
          weight: item.weight || null,
          contactEmail: item.contactEmail || null,
          notes: item.notes || null,
          status: 'PENDING' as const,
          priority: 'NORMAL' as const,
        };
        
        await prisma.request.create({
          data: requestData
        });
        
        successCount++;
        console.log(`✓ Uploaded: ${item.company}`);
        
      } catch (rowError) {
        errorCount++;
        console.error(`✗ Error uploading item:`, (rowError as Error).message);
        console.error('Item data:', JSON.stringify(item, null, 2));
      }
    }
    
    console.log(`\n${sheetName} upload completed!`);
    console.log(`✓ Successfully uploaded: ${successCount} records`);
    console.log(`✗ Failed to upload: ${errorCount} records`);
    
    return { successCount, errorCount };
    
  } catch (error) {
    console.error('Error uploading to database:', error);
    return { successCount: 0, errorCount: data.length };
  }
}

// Helper function to process Excel data
async function processExcelData(sheetName?: string): Promise<Array<{
  sheet: string;
  totalRows: number;
  processedRows: number;
  successCount: number;
  errorCount: number;
}>> {
  const filePath = path.join(process.cwd(), 'data', 'Quotepilot - Rate Sheets and Schedules.xlsx');
  const workbook = XLSX.readFile(filePath);
  
  const sheetsToProcess = sheetName ? [sheetName] : workbook.SheetNames.filter(name => 
    name !== 'Version' && SheetProcessors[name]
  );
  
  console.log(`Processing sheets: ${sheetsToProcess.join(', ')}`);
  
  const results = [];
  
  for (const targetSheetName of sheetsToProcess) {
    console.log(`\n=== Processing ${targetSheetName} ===`);
    
    const worksheet = workbook.Sheets[targetSheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet) as RateSheetData[];
    
    console.log(`Found ${jsonData.length} raw rows`);
    
    if (SheetProcessors[targetSheetName]) {
      const processedData = SheetProcessors[targetSheetName](jsonData, targetSheetName);
      console.log(`Processed into ${processedData.length} valid records`);
      
      if (processedData.length > 0) {
        const uploadResult = await uploadToDatabase(processedData, targetSheetName);
        results.push({
          sheet: targetSheetName,
          totalRows: jsonData.length,
          processedRows: processedData.length,
          ...uploadResult
        });
      }
    } else {
      console.log(`No processor found for sheet: ${targetSheetName}`);
    }
  }
  
  return results;
}

// Main execution
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (command === 'analyze') {
    console.log('Starting Excel file analysis...');
    await parseExcelFile();
  } else if (command === 'upload') {
    const sheetName = args[1]; // Optional sheet name
    console.log('Starting database upload...');
    
    const results = await processExcelData(sheetName);
    
    console.log('\n=== UPLOAD SUMMARY ===');
    let totalSuccess = 0;
    let totalErrors = 0;
    
    results.forEach(result => {
      console.log(`${result.sheet}:`);
      console.log(`  Raw rows: ${result.totalRows}`);
      console.log(`  Processed: ${result.processedRows}`);
      console.log(`  Uploaded: ${result.successCount}`);
      console.log(`  Errors: ${result.errorCount}`);
      totalSuccess += result.successCount;
      totalErrors += result.errorCount;
    });
    
    console.log(`\nTOTAL: ${totalSuccess} successful uploads, ${totalErrors} errors`);
    
  } else {
    console.log('TypeScript Excel Upload Script');
    console.log('Usage:');
    console.log('  npx ts-node scripts/parse-excel.ts analyze          - Analyze Excel file structure');
    console.log('  npx ts-node scripts/parse-excel.ts upload [sheet]   - Upload data to database');
    console.log('');
    console.log('Available sheets:');
    Object.keys(SheetProcessors).forEach(sheet => {
      console.log(`  - "${sheet}"`);
    });
    console.log('');
    console.log('Examples:');
    console.log('  npx ts-node scripts/parse-excel.ts analyze');
    console.log('  npx ts-node scripts/parse-excel.ts upload');
    console.log('  npx ts-node scripts/parse-excel.ts upload "Trucking Rates Europe"');
  }
  
  await prisma.$disconnect();
}

if (require.main === module) {
  main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
}

export { parseExcelFile, uploadToDatabase, processExcelData }; 