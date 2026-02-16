// Story 6.1: Time utilities for temporal intelligence

export type TimePeriod = 'morning' | 'lunch' | 'evening'

/**
 * Story 6.1 / FR31: Calculate default time period based on event date/time
 *
 * Logic:
 * - If event time is 6am-11am → morning
 * - If event time is 11am-2pm → lunch
 * - If event time is 2pm-midnight → evening
 * - If no time or can't parse → default to evening (most events)
 *
 * @param eventDate - Event date string (not currently used, but included for future)
 * @param eventTime - Event time string (e.g., "7:00 PM", "11:30 AM")
 * @returns TimePeriod - morning, lunch, or evening
 */
export function getDefaultTimePeriod(eventDate: string, eventTime: string): TimePeriod {
  try {
    // Try to parse with AM/PM first (format: "7:00 PM", "11:30 AM", "7PM", "11 AM", etc.)
    const timeMatchWithPeriod = eventTime.match(/(\d{1,2}):?(\d{2})?\s*(AM|PM)/i)

    let hours: number
    let minutes: number

    if (timeMatchWithPeriod) {
      // Has AM/PM indicator
      hours = parseInt(timeMatchWithPeriod[1], 10)
      minutes = timeMatchWithPeriod[2] ? parseInt(timeMatchWithPeriod[2], 10) : 0
      const period = timeMatchWithPeriod[3].toUpperCase()

      // Convert to 24-hour format
      if (period === 'PM' && hours !== 12) {
        hours += 12
      } else if (period === 'AM' && hours === 12) {
        hours = 0
      }

      console.log(`[timeUtils] Parsed event time with period: ${hours}:${minutes.toString().padStart(2, '0')} (${period})`)
    } else {
      // No AM/PM - try to parse as 24-hour or make reasonable assumption for 12-hour
      const timeMatchNoPeriod = eventTime.match(/(\d{1,2}):?(\d{2})?/)

      if (!timeMatchNoPeriod) {
        console.log('[timeUtils] Could not parse event time, defaulting to evening:', eventTime)
        return 'evening'
      }

      hours = parseInt(timeMatchNoPeriod[1], 10)
      minutes = timeMatchNoPeriod[2] ? parseInt(timeMatchNoPeriod[2], 10) : 0

      // If hour is already in 24-hour format (13-23), use as-is
      // Otherwise assume AM for hours 1-11 (most events during day)
      if (hours >= 13 && hours <= 23) {
        // Already 24-hour format, keep as-is
        console.log(`[timeUtils] Parsed 24-hour time: ${hours}:${minutes.toString().padStart(2, '0')}`)
      } else if (hours === 12) {
        // 12 without AM/PM - assume noon (most common)
        console.log(`[timeUtils] Assuming 12:00 is noon`)
      } else {
        // 1-11 without AM/PM - assume AM for morning/lunch events
        console.log(`[timeUtils] Parsed time without period (assuming AM for 1-11): ${hours}:${minutes.toString().padStart(2, '0')}`)
      }
    }

    // Determine time period based on hours (24-hour format)
    if (hours >= 6 && hours < 11) {
      console.log('[timeUtils] Default time period: morning')
      return 'morning'
    } else if (hours >= 11 && hours < 14) {
      console.log('[timeUtils] Default time period: lunch')
      return 'lunch'
    } else {
      console.log('[timeUtils] Default time period: evening')
      return 'evening'
    }
  } catch (error) {
    console.error('[timeUtils] Error parsing event time:', error)
    return 'evening' // Safe default
  }
}
