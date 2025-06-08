import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface GenerationOptions {
  startDate?: Date;
  endDate?: Date;
  daysAhead?: number;
  clearExisting?: boolean;
}

function parseTimeToMilliseconds(timeString: string | null): number | null {
  if (!timeString) return null;
  
  try {
    let hours = 0;
    let minutes = 0;
    let isNextDay = false;

    // Handle +1 indicator for next day
    if (timeString.includes('+1')) {
      isNextDay = true;
      timeString = timeString.replace('+1', '');
    }

    // Parse HH:MM format
    if (timeString.includes(':')) {
      const parts = timeString.split(':');
      hours = parseInt(parts[0], 10);
      minutes = parseInt(parts[1], 10);
    }

    // Validate time values
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      return null;
    }

    // Convert to milliseconds since midnight
    let totalMilliseconds = (hours * 60 + minutes) * 60 * 1000;
    
    // Add 24 hours if it's next day
    if (isNextDay) {
      totalMilliseconds += 24 * 60 * 60 * 1000;
    }

    return totalMilliseconds;
  } catch {
    return null;
  }
}

async function generateScheduledFlights(options: GenerationOptions = {}): Promise<void> {
  const {
    startDate = new Date(),
    daysAhead = 30,
  } = options;

  const endDate = options.endDate || new Date(startDate.getTime() + daysAhead * 24 * 60 * 60 * 1000);

  console.log(`🚀 Generating scheduled flights from ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`);

  // Get all weekly flight schedules
  const weeklySchedules = await prisma.weeklyFlightSchedule.findMany({
    include: {
      importBatch: true
    }
  });

  console.log(`📋 Found ${weeklySchedules.length} weekly flight schedules`);

   let totalGenerated = 0;
   let totalSkipped = 0;
   let totalErrors = 0;

   for (const schedule of weeklySchedules) {
     console.log(`\n📅 Processing ${schedule.airline} ${schedule.flightNumber} (${schedule.originCode} → ${schedule.destinationCode})`);
     
     const depTimeMs = parseTimeToMilliseconds(schedule.departureTime);
     const arrTimeMs = parseTimeToMilliseconds(schedule.arrivalTime);

     if (depTimeMs === null || arrTimeMs === null) {
       console.log(`❌ Invalid times for ${schedule.flightNumber}, skipping`);
       totalErrors++;
       continue;
     }

     let flightCount = 0;
     let skippedCount = 0;

    // Generate flights for each day in the range
    for (let currentDate = new Date(startDate); currentDate <= endDate; currentDate.setDate(currentDate.getDate() + 1)) {
      const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
      
      const shouldFly = (
        (dayOfWeek === 1 && schedule.monday) ||
        (dayOfWeek === 2 && schedule.tuesday) ||
        (dayOfWeek === 3 && schedule.wednesday) ||
        (dayOfWeek === 4 && schedule.thursday) ||
        (dayOfWeek === 5 && schedule.friday) ||
        (dayOfWeek === 6 && schedule.saturday) ||
        (dayOfWeek === 0 && schedule.sunday)
      );

      if (shouldFly) {
         try {
           // Create departure datetime
           const departureAt = new Date(currentDate);
           departureAt.setHours(0, 0, 0, 0);
           departureAt.setMilliseconds(depTimeMs);

           // Create arrival datetime
           const arrivalAt = new Date(currentDate);
           arrivalAt.setHours(0, 0, 0, 0);
           arrivalAt.setMilliseconds(arrTimeMs);

           // Check if flight already exists
           const existingFlight = await prisma.scheduledFlight.findFirst({
             where: {
               airline: schedule.airline,
               flightNumber: schedule.flightNumber,
               originCode: schedule.originCode,
               destinationCode: schedule.destinationCode,
               departureAt: departureAt,
             }
           });

           if (existingFlight) {
             // Flight already exists, skip creation
             skippedCount++;
             totalSkipped++;
             continue;
           }

           await prisma.scheduledFlight.create({
             data: {
               airline: schedule.airline,
               flightNumber: schedule.flightNumber,
               originCode: schedule.originCode,
               destinationCode: schedule.destinationCode,
               departureTime: schedule.departureTime,
               arrivalTime: schedule.arrivalTime,
               departureDate: new Date(currentDate),
               departureAt,
               arrivalAt,
               scheduleType: 'weekly',
               weeklyFlightScheduleId: schedule.id,
               carrier: schedule.carrier,
               notes: `Generated from weekly schedule for ${currentDate.toISOString().split('T')[0]}`,
               importBatchId: schedule.importBatchId,
             }
           });

           flightCount++;
           totalGenerated++;
         } catch (error) {
           console.error(`❌ Error creating flight for ${currentDate.toISOString().split('T')[0]}:`, (error as Error).message);
           totalErrors++;
         }
       }
    }

    console.log(`✅ Generated ${flightCount} flights for ${schedule.flightNumber}${skippedCount > 0 ? `, skipped ${skippedCount} existing` : ''}`);
  }

  console.log(`\n🎯 Generation complete: ${totalGenerated} flights generated, ${totalSkipped} skipped, ${totalErrors} errors`);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0];

  if (command === 'generate') {
    const daysAhead = args[1] ? parseInt(args[1], 10) : 30;

    console.log('🛫 Scheduled Flight Generator');
    console.log(`Generating flights for the next ${daysAhead} days`);

    try {
      await generateScheduledFlights({
        daysAhead,
      });
      console.log('\n🎉 Flight generation completed successfully!');
    } catch (error) {
      console.error('\n💥 Fatal error during generation:', error);
      process.exit(1);
    }
  } else {
    console.log('🛫 Scheduled Flight Generator');
    console.log('');
    console.log('This script generates ScheduledFlight instances from WeeklyFlightSchedule records.');
    console.log('It creates actual flight instances with specific dates and times based on weekly patterns.');
    console.log('');
    console.log('Usage:');
    console.log('  npx ts-node scripts/generate-scheduled-flights.ts generate [days] [clearExisting]');
    console.log('');
    console.log('Parameters:');
    console.log('  days - Number of days ahead to generate (default: 30)');
    console.log('  clearExisting - Whether to clear existing flights (default: true, set to false to keep)');
    console.log('');
    console.log('Examples:');
    console.log('  npx ts-node scripts/generate-scheduled-flights.ts generate');
    console.log('  npx ts-node scripts/generate-scheduled-flights.ts generate 60');
    console.log('  npx ts-node scripts/generate-scheduled-flights.ts generate 30 false');
  }

  await prisma.$disconnect();
}

if (require.main === module) {
  main().catch(console.error);
}

export { generateScheduledFlights }; 