

export function parseTimeToString(timeValue: unknown): { timeString: string | null; milliseconds: number | null } {
  try {
    let hours = 0;
    let minutes = 0;
    let isNextDay = false;

    if (typeof timeValue === 'string') {
      // Lufthansa format: "22:10"
      if (timeValue.includes(':')) {
        const parts = timeValue.split(':');
        hours = parseInt(parts[0], 10);
        minutes = parseInt(parts[1], 10);
      }
      // AM format with +1 indicator: "0205+1"
      else if (timeValue.includes('+')) {
        const cleanTime = timeValue.replace('+1', '');
        if (cleanTime.length >= 3) {
          hours = parseInt(cleanTime.slice(0, -2), 10);
          minutes = parseInt(cleanTime.slice(-2), 10);
          isNextDay = true;
        }
      }
      // AM format as string: "2225"
      else if (timeValue.length >= 3) {
        hours = parseInt(timeValue.slice(0, -2), 10);
        minutes = parseInt(timeValue.slice(-2), 10);
      }
    }
    // AM format as number: 2225 or Excel decimal time format: 0.5659722222222222
    else if (typeof timeValue === 'number') {
      // Check if it's an Excel decimal time format (between 0 and 1)
      if (timeValue > 0 && timeValue < 1) {
        // Excel time format: decimal fraction of a day
        const totalHours = timeValue * 24;
        hours = Math.floor(totalHours);
        minutes = Math.round((totalHours - hours) * 60);
        
        // Handle edge case where rounding minutes gives 60
        if (minutes >= 60) {
          hours += 1;
          minutes = 0;
        }
      } else {
        // AM format as integer: 2225
        const timeStr = timeValue.toString();
        if (timeStr.length >= 3) {
          hours = parseInt(timeStr.slice(0, -2), 10);
          minutes = parseInt(timeStr.slice(-2), 10);
        }
      }
    }

    // Validate time values
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      return { timeString: null, milliseconds: null };
    }

    // Format as HH:MM string (with next day indicator if applicable)
    const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}${isNextDay ? '+1' : ''}`;
    
    // Convert to milliseconds since midnight
    let totalMilliseconds = (hours * 60 + minutes) * 60 * 1000;
    
    // Add 24 hours if it's next day
    if (isNextDay) {
      totalMilliseconds += 24 * 60 * 60 * 1000;
    }

    return { timeString, milliseconds: totalMilliseconds };
  } catch {
    console.warn('Could not parse time:', timeValue);
    return { timeString: null, milliseconds: null };
  }
}


export function parseAMDate(dateStr: unknown): Date | null {
  try {
    if (typeof dateStr === 'string' && dateStr.includes('.')) {
      // Format: "19.06.25" -> "2025-06-19"
      const parts = dateStr.split('.');
      const day = parts[0];
      const month = parts[1];
      const year = '20' + parts[2];
      return new Date(`${year}-${month}-${day}`);
    }
  } catch {
    console.warn('Could not parse date:', dateStr);
  }
  return null;
}


export function parseTimeToMilliseconds(timeString: string | null): number | null {
  if (!timeString) return null;
  
  try {
    let hours = 0;
    let minutes = 0;
    let isNextDay = false;

    if (timeString.includes('+1')) {
      isNextDay = true;
      timeString = timeString.replace('+1', '');
    }

    if (timeString.includes(':')) {
      const parts = timeString.split(':');
      hours = parseInt(parts[0], 10);
      minutes = parseInt(parts[1], 10);
    } else {
      return null; // Return null if not in HH:MM format
    }

    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      return null;
    }

    let totalMilliseconds = (hours * 60 + minutes) * 60 * 1000;
    
    if (isNextDay) {
      totalMilliseconds += 24 * 60 * 60 * 1000;
    }

    return totalMilliseconds;
  } catch {
    return null;
  }
}
