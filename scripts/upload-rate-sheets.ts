import * as XLSX from 'xlsx';
import { PrismaClient } from '@prisma/client';
import path from 'path';

const prisma = new PrismaClient();

interface RateSheetData {
  [key: string]: any;
}

interface UploadResult {
  totalRows: number;
  processedRows: number;
  successfulRows: number;
  errorRows: number;
  batchId: string;
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

// Data processors for each model
async function processTruckingRates(jsonData: RateSheetData[], sheetName: string, batchId: string): Promise<UploadResult> {
  console.log(`Processing trucking rates from ${sheetName}...`);
  
  const region = sheetName.includes('Europe') ? 'Europe' : 'Mexico';
  let successfulRows = 0;
  let errorRows = 0;
  
  const validRows = jsonData.filter(row => row.Origin && row.Destination && row['Base Price']);
  console.log(`Found ${validRows.length} valid trucking rate rows out of ${jsonData.length} total`);
  
  for (const row of validRows) {
    try {
      await prisma.truckingRate.create({
        data: {
          origin: String(row.Origin),
          destination: String(row.Destination),
          basePrice: parseFloat(row['Base Price']) || 0,
          kmPrice: parseFloat(row['km Price']) || 0,
          currency: String(row.Currency || 'EUR'),
          region,
          notes: `Original data: ${JSON.stringify(row)}`,
          importBatchId: batchId,
        }
      });
      successfulRows++;
      console.log(`✓ Trucking rate: ${row.Origin} → ${row.Destination}`);
    } catch (error) {
      errorRows++;
      console.error(`✗ Error creating trucking rate:`, (error as Error).message);
    }
  }
  
  return {
    totalRows: jsonData.length,
    processedRows: validRows.length,
    successfulRows,
    errorRows,
    batchId
  };
}

async function processAirportRates(jsonData: RateSheetData[], sheetName: string, batchId: string): Promise<UploadResult> {
  console.log(`Processing airport rates from ${sheetName}...`);
  
  const region = sheetName.includes('Europe') ? 'Europe' : 'Mexico';
  const serviceType = sheetName.includes('Europe') ? 'Export' : 'Import';
  let successfulRows = 0;
  let errorRows = 0;
  
  const validRows = jsonData.filter(row => row['Station Code'] && row['Country Code']);
  console.log(`Found ${validRows.length} valid airport rate rows out of ${jsonData.length} total`);
  
  for (const row of validRows) {
    try {
      await prisma.airportRate.create({
        data: {
          stationCode: String(row['Station Code']),
          countryCode: String(row['Country Code']),
          airline: row.Airline ? String(row.Airline) : null,
          exportHandling: serviceType === 'Export' ? (parseFloat(row['Export Handling']) || null) : null,
          exportCustoms: serviceType === 'Export' ? (parseFloat(row['Export Customs ']) || null) : null,
          importHandling: serviceType === 'Import' ? (parseFloat(row['Import Handling']) || null) : null,
          importCustoms: serviceType === 'Import' ? (parseFloat(row['Import Customs ']) || null) : null,
          currency: String(row.Currency || (region === 'Europe' ? 'EUR' : 'USD')),
          region,
          serviceType,
          notes: `Original data: ${JSON.stringify(row)}`,
          importBatchId: batchId,
        }
      });
      successfulRows++;
      console.log(`✓ Airport rate: ${row['Station Code']} (${row.Airline || 'Unknown'})`);
    } catch (error) {
      errorRows++;
      console.error(`✗ Error creating airport rate:`, (error as Error).message);
    }
  }
  
  return {
    totalRows: jsonData.length,
    processedRows: validRows.length,
    successfulRows,
    errorRows,
    batchId
  };
}

async function processAirlineRates(sheet: XLSX.WorkSheet, sheetName: string, batchId: string): Promise<UploadResult> {
  console.log(`Processing airline rates from ${sheetName}...`);
  
  // Use array format to properly handle multi-row headers
  const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
  
  let successfulRows = 0;
  let errorRows = 0;
  
  // Data starts from row 3 (index 2) - skip the two header rows
  const dataRows = jsonData.slice(2).filter(row => 
    row && row.length > 0 && row[0] // Has station code
  );
  
  console.log(`Found ${dataRows.length} valid airline rate rows out of ${jsonData.length - 2} data rows`);
  
  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    try {
      // Map columns by index based on the analyzed structure
      const record = {
        stationCode: String(row[0] || ''),
        originCountryCode: String(row[1] || ''),
        destinationCountryCode: String(row[2] || ''),
        airline: String(row[3] || ''),
        fuelChargePerKg: parseFloat(String(row[4])) || 0,
        basePrice: parseFloat(String(row[5])) || 0,
        priceUnder45kg: parseFloat(String(row[6])) || null,
        priceUnder100kg: parseFloat(String(row[7])) || null,
        priceUnder250kg: parseFloat(String(row[8])) || null,
        priceUnder300kg: parseFloat(String(row[9])) || null,
        priceUnder500kg: parseFloat(String(row[10])) || null,
        priceUnder1000kg: parseFloat(String(row[11])) || null,
        priceOver1000kg: parseFloat(String(row[12])) || null,
        currency: String(row[13] || 'EUR'),
        notes: `Row data: [${row.join(', ')}]`,
        importBatchId: batchId,
      };
      
      // Validate required fields
      if (!record.stationCode || !record.originCountryCode || !record.destinationCountryCode || !record.airline) {
        throw new Error(`Missing required fields: station=${record.stationCode}, origin=${record.originCountryCode}, dest=${record.destinationCountryCode}, airline=${record.airline}`);
      }
      
      await prisma.airlineRate.create({ data: record });
      successfulRows++;
      console.log(`✓ Airline rate: ${record.airline} ${record.stationCode} (${record.originCountryCode} → ${record.destinationCountryCode}) - Base: ${record.basePrice} ${record.currency}, Fuel: ${record.fuelChargePerKg} ${record.currency}/kg`);
    } catch (error) {
      errorRows++;
      console.error(`✗ Error creating airline rate (row ${i + 3}):`, (error as Error).message);
      console.error('Row data:', JSON.stringify(row, null, 2));
    }
  }
  
  return {
    totalRows: jsonData.length - 2, // Subtract header rows
    processedRows: dataRows.length,
    successfulRows,
    errorRows,
    batchId
  };
}

async function processFlightSchedules(jsonData: RateSheetData[], sheetName: string, batchId: string): Promise<UploadResult> {
  console.log(`Processing flight schedules from ${sheetName}...`);
  
  let successfulRows = 0;
  let errorRows = 0;
  let validRows: RateSheetData[] = [];
  
  if (sheetName.includes('Lufthansa')) {
    // Lufthansa format - Excel uses __EMPTY, __EMPTY_1, etc. for unnamed columns
    validRows = jsonData.filter(row => 
      // Check for actual flight data rows (not header rows)
      row.__EMPTY && 
      row.__EMPTY_1 && 
      row.__EMPTY_2 && 
      row.__EMPTY_3 &&
      row.__EMPTY === 'LH' && // Airline code
      typeof row.__EMPTY_1 === 'string' && row.__EMPTY_1.startsWith('LH') && // Flight number
      typeof row.__EMPTY_2 === 'string' && row.__EMPTY_2.length === 3 && // Origin code
      typeof row.__EMPTY_3 === 'string' && row.__EMPTY_3.length === 3 // Destination code
    );
    
    console.log(`Found ${validRows.length} valid Lufthansa schedule rows out of ${jsonData.length} total`);
    console.log('Sample row data:', JSON.stringify(jsonData.slice(0, 3), null, 2));
    
    for (const row of validRows) {
      try {
        // Handle different column formats for Lufthansa data
        let airline, flightNumber, originCode, destinationCode, departureTime, arrivalTime;
        let monday, tuesday, wednesday, thursday, friday, saturday, sunday;
        
        // Use the __EMPTY column format that Excel generates
        airline = String(row.__EMPTY || 'LH');
        flightNumber = String(row.__EMPTY_1 || '');
        originCode = String(row.__EMPTY_2 || '');
        destinationCode = String(row.__EMPTY_3 || '');
        departureTime = formatTime(row.__EMPTY_4);
        arrivalTime = formatTime(row.__EMPTY_5);
        
        // Days of the week mapping based on Excel column structure
        // From the sample: "Days on which the flight takes place" can be "x" for Monday
        monday = !!(row['Days on which the flight takes place'] === 'x');
        tuesday = !!(row.__EMPTY_6 === 'x');
        wednesday = !!(row.__EMPTY_7 === 'x');
        thursday = !!(row.__EMPTY_8 === 'x');
        friday = !!(row.__EMPTY_9 === 'x');
        saturday = !!(row.__EMPTY_10 === 'x');
        sunday = !!(row.__EMPTY_11 === 'x');
        
        await prisma.flightSchedule.create({
          data: {
            airline,
            flightNumber,
            originCode,
            destinationCode,
            departureTime,
            arrivalTime,
            monday,
            tuesday,
            wednesday,
            thursday,
            friday,
            saturday,
            sunday,
            scheduleType: 'weekly',
            carrier: 'LH',
            notes: `Weekly schedule. Original data: ${JSON.stringify(row)}`,
            importBatchId: batchId,
          }
        });
        successfulRows++;
        console.log(`✓ LH Flight: ${flightNumber} ${originCode} → ${destinationCode}`);
      } catch (error) {
        errorRows++;
        console.error(`✗ Error creating LH flight schedule:`, (error as Error).message);
        console.error('Row data:', JSON.stringify(row, null, 2));
      }
    }
  } else {
    // Aeromexico format
    validRows = jsonData.filter(row => row.Origin && row.Destination && row.Carrier);
    console.log(`Found ${validRows.length} valid Aeromexico schedule rows out of ${jsonData.length} total`);
    
    for (const row of validRows) {
      try {
        await prisma.flightSchedule.create({
          data: {
            airline: String(row.Carrier),
            flightNumber: String(row['Flight#']),
            originCode: String(row.Origin),
            destinationCode: String(row.Destination),
            departureTime: formatAMTime(row['Dep. Time (2225 = 22:55)']),
            arrivalTime: formatAMTime(row['Arr. Time (+1 = day after)']),
            departureDate: parseAMDate(row['Departure Date']),
            monday: false,
            tuesday: false,
            wednesday: false,
            thursday: false,
            friday: false,
            saturday: false,
            sunday: false,
            scheduleType: 'specific',
            carrier: 'AM',
            notes: `Specific date schedule. Original data: ${JSON.stringify(row)}`,
            importBatchId: batchId,
          }
        });
        successfulRows++;
        console.log(`✓ AM Flight: ${row['Flight#']} ${row.Origin} → ${row.Destination} on ${row['Departure Date']}`);
      } catch (error) {
        errorRows++;
        console.error(`✗ Error creating AM flight schedule:`, (error as Error).message);
      }
    }
  }
  
  return {
    totalRows: jsonData.length,
    processedRows: validRows.length,
    successfulRows,
    errorRows,
    batchId
  };
}

// Sheet processors mapping
const SheetProcessors: Record<string, (data: RateSheetData[], sheetName: string, batchId: string) => Promise<UploadResult>> = {
  'Trucking Rates Europe': processTruckingRates,
  'Trucking Rates Mexico': processTruckingRates,
  'Airport Rates Europe': processAirportRates,
  'Airport Rates Mexico': processAirportRates,
  'Airline Rates': processAirlineRates,
  'Schedule Lufthansa Cargo (LH)': processFlightSchedules,
  'Schedule Aeromexico (AM)': processFlightSchedules
};

async function createImportBatch(fileName: string, sheetName: string): Promise<string> {
  const batch = await prisma.importBatch.create({
    data: {
      fileName,
      sheetName,
      totalRows: 0,
      processedRows: 0,
      successfulRows: 0,
      errorRows: 0,
    }
  });
  return batch.id;
}

async function updateImportBatch(batchId: string, result: UploadResult): Promise<void> {
  await prisma.importBatch.update({
    where: { id: batchId },
    data: {
      totalRows: result.totalRows,
      processedRows: result.processedRows,
      successfulRows: result.successfulRows,
      errorRows: result.errorRows,
    }
  });
}

// Function to truncate tables before import
async function truncateTables(): Promise<void> {
  console.log('🗑️  Truncating existing data...');
  
  // Delete in order to respect foreign key constraints
  await prisma.truckingRate.deleteMany({});
  await prisma.airportRate.deleteMany({});
  await prisma.airlineRate.deleteMany({});
  await prisma.flightSchedule.deleteMany({});
  await prisma.importBatch.deleteMany({});
  
  console.log('✅ All rate sheet tables truncated');
}

async function processExcelFile(sheetName?: string, shouldTruncate: boolean = true): Promise<UploadResult[]> {
  const fileName = 'Quotepilot - Rate Sheets and Schedules.xlsx';
  const filePath = path.join(process.cwd(), 'data', fileName);
  const workbook = XLSX.readFile(filePath);
  
  const sheetsToProcess = sheetName ? [sheetName] : workbook.SheetNames.filter(name => 
    name !== 'Version' && SheetProcessors[name]
  );
  
  console.log(`Processing sheets: ${sheetsToProcess.join(', ')}`);
  
  // Truncate tables if requested
  if (shouldTruncate) {
    await truncateTables();
  }
  
  const results: UploadResult[] = [];
  
  for (const targetSheetName of sheetsToProcess) {
    console.log(`\n=== Processing ${targetSheetName} ===`);
    
    // Create import batch for tracking
    const batchId = await createImportBatch(fileName, targetSheetName);
    
    const worksheet = workbook.Sheets[targetSheetName];
    
    let result: UploadResult;
    
    if (targetSheetName === 'Airline Rates') {
      // Special handling for airline rates due to multi-row headers
      result = await processAirlineRates(worksheet, targetSheetName, batchId);
    } else if (SheetProcessors[targetSheetName]) {
      const jsonData = XLSX.utils.sheet_to_json(worksheet) as RateSheetData[];
      console.log(`Found ${jsonData.length} raw rows`);
      result = await SheetProcessors[targetSheetName](jsonData, targetSheetName, batchId);
    } else {
      console.log(`No processor found for sheet: ${targetSheetName}`);
      continue;
    }
    
    // Update the import batch with final results
    await updateImportBatch(batchId, result);
    
    results.push(result);
    
    console.log(`\n${targetSheetName} completed:`);
    console.log(`  Total rows: ${result.totalRows}`);
    console.log(`  Processed: ${result.processedRows}`);
    console.log(`  Successful: ${result.successfulRows}`);
    console.log(`  Errors: ${result.errorRows}`);
  }
  
  return results;
}

// Main execution
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (command === 'upload') {
    const sheetName = args[1]; // Optional sheet name
    
    console.log('🚀 Starting Rate Sheet Upload to Database...');
    console.log('This will upload data to dedicated rate sheet models\n');
    
    try {
      const results = await processExcelFile(sheetName);
      
      console.log('\n' + '='.repeat(50));
      console.log('📊 UPLOAD SUMMARY');
      console.log('='.repeat(50));
      
      let totalSuccess = 0;
      let totalErrors = 0;
      let totalProcessed = 0;
      
      results.forEach(result => {
        console.log(`\n📋 ${result.batchId.slice(-8)}... (Batch ID)`);
        console.log(`   📥 Total rows: ${result.totalRows}`);
        console.log(`   ⚙️  Processed: ${result.processedRows}`);
        console.log(`   ✅ Successful: ${result.successfulRows}`);
        console.log(`   ❌ Errors: ${result.errorRows}`);
        
        totalSuccess += result.successfulRows;
        totalErrors += result.errorRows;
        totalProcessed += result.processedRows;
      });
      
      console.log('\n' + '='.repeat(50));
      console.log(`🎯 TOTALS: ${totalSuccess} successful, ${totalErrors} errors, ${totalProcessed} processed`);
      console.log('='.repeat(50));
      
      if (totalErrors === 0) {
        console.log('\n🎉 All data uploaded successfully!');
      } else if (totalSuccess > 0) {
        console.log(`\n⚠️  Partial success: ${totalSuccess} records uploaded, ${totalErrors} failed`);
      } else {
        console.log('\n💥 Upload failed - no records were successfully imported');
      }
      
    } catch (error) {
      console.error('\n💥 Fatal error during upload:', error);
      process.exit(1);
    }
    
  } else {
    console.log('📊 Rate Sheet Upload Script');
    console.log('');
    console.log('This script uploads Excel rate sheet data to dedicated database models:');
    console.log('  🚛 TruckingRate - Ground transportation rates');
    console.log('  ✈️  AirportRate - Airport handling fees');
    console.log('  🛫 AirlineRate - Air cargo rates with weight tiers');
    console.log('  📅 FlightSchedule - Flight schedules');
    console.log('  📝 ImportBatch - Import tracking metadata');
    console.log('');
    console.log('Usage:');
    console.log('  npx ts-node scripts/upload-rate-sheets.ts upload [sheet]');
    console.log('');
    console.log('Available sheets:');
    Object.keys(SheetProcessors).forEach(sheet => {
      console.log(`  • "${sheet}"`);
    });
    console.log('');
    console.log('Examples:');
    console.log('  npx ts-node scripts/upload-rate-sheets.ts upload');
    console.log('  npx ts-node scripts/upload-rate-sheets.ts upload "Trucking Rates Europe"');
    console.log('  npx ts-node scripts/upload-rate-sheets.ts upload "Airline Rates"');
  }
  
  await prisma.$disconnect();
}

if (require.main === module) {
  main().catch(console.error);
}

export { processExcelFile, SheetProcessors }; 