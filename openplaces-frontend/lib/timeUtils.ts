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
    // Parse time (format: "7:00 PM", "11:30 AM", "7PM", "11 AM", etc.)
    const timeMatch = eventTime.match(/(\d{1,2}):?(\d{2})?\s*(AM|PM)/i)

    if (!timeMatch) {
      console.log('[timeUtils] Could not parse event time, defaulting to evening:', eventTime)
      return 'evening'
    }

    let hours = parseInt(timeMatch[1], 10)
    const minutes = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0
    const period = timeMatch[3].toUpperCase()

    // Convert to 24-hour format
    if (period === 'PM' && hours !== 12) {
      hours += 12
    } else if (period === 'AM' && hours === 12) {
      hours = 0
    }

    console.log(`[timeUtils] Parsed event time: ${hours}:${minutes.toString().padStart(2, '0')} (${period})`)

    // Determine time period based on hours
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
