/**
 * Analytics tracking utility for warning engagement
 * Story 7.8: Track user interactions with warning system
 *
 * This module provides non-intrusive tracking of how users interact with
 * risk warnings to measure the effectiveness of the "Permission to Say No" feature.
 *
 * Events tracked:
 * - warning_opened: User clicks warning badge to view details
 * - alternative_clicked: User clicks suggested alternative zone
 * - warned_zone_saved: User saves a zone despite warning
 * - warning_closed: User closes warning panel
 */

export interface WarningEngagementEvent {
  event_type: 'warning_opened' | 'alternative_clicked' | 'warned_zone_saved' | 'warning_closed'
  user_id?: string  // Optional - Clerk user ID if authenticated
  zone_id: string
  zone_name: string
  timestamp: string
  metadata?: Record<string, any>
}

/**
 * Track warning engagement events
 * Currently uses console.log for development
 * TODO: Integrate with production analytics service (PostHog, Mixpanel, etc.)
 */
export function trackWarningEvent(event: WarningEngagementEvent): void {
  // Development logging
  console.log('[Warning Analytics]', {
    ...event,
    timestamp: new Date().toISOString()
  })

  // TODO: Production analytics integration
  // Example PostHog integration:
  // if (typeof window !== 'undefined' && window.posthog) {
  //   window.posthog.capture(event.event_type, {
  //     ...event,
  //     timestamp: new Date().toISOString()
  //   })
  // }

  // Example Mixpanel integration:
  // if (typeof window !== 'undefined' && window.mixpanel) {
  //   window.mixpanel.track(event.event_type, {
  //     ...event,
  //     timestamp: new Date().toISOString()
  //   })
  // }
}

/**
 * Track when warning panel is opened
 *
 * @param zoneId - ID of the zone with warning
 * @param zoneName - Display name of the zone
 * @param warningType - Type of warning (e.g., "deceptive_hotspot")
 * @param warningCategories - Array of category types (e.g., ["low_dwell_time", "poor_audience_match"])
 * @param userId - Optional Clerk user ID if authenticated
 */
export function trackWarningOpened(
  zoneId: string,
  zoneName: string,
  warningType: string,
  warningCategories: string[],
  userId?: string
): void {
  trackWarningEvent({
    event_type: 'warning_opened',
    user_id: userId,
    zone_id: zoneId,
    zone_name: zoneName,
    timestamp: new Date().toISOString(),
    metadata: {
      warning_type: warningType,
      warning_categories: warningCategories
    }
  })
}

/**
 * Track when user clicks alternative zone suggestion
 *
 * @param originalZoneId - ID of the warned zone
 * @param originalZoneName - Name of the warned zone
 * @param alternativeZoneId - ID of the alternative zone clicked
 * @param alternativeZoneName - Name of the alternative zone clicked
 * @param alternativeRank - Rank of the alternative zone (1-3)
 * @param userId - Optional Clerk user ID if authenticated
 */
export function trackAlternativeClicked(
  originalZoneId: string,
  originalZoneName: string,
  alternativeZoneId: string,
  alternativeZoneName: string,
  alternativeRank: number,
  userId?: string
): void {
  trackWarningEvent({
    event_type: 'alternative_clicked',
    user_id: userId,
    zone_id: originalZoneId,
    zone_name: originalZoneName,
    timestamp: new Date().toISOString(),
    metadata: {
      alternative_zone_id: alternativeZoneId,
      alternative_zone_name: alternativeZoneName,
      alternative_rank: alternativeRank
    }
  })
}

/**
 * Track when user saves a warned zone anyway
 *
 * @param zoneId - ID of the warned zone being saved
 * @param zoneName - Name of the warned zone being saved
 * @param warningType - Type of warning (e.g., "deceptive_hotspot")
 * @param warningCategories - Array of category types
 * @param userId - Optional Clerk user ID if authenticated
 */
export function trackWarnedZoneSaved(
  zoneId: string,
  zoneName: string,
  warningType: string,
  warningCategories: string[],
  userId?: string
): void {
  trackWarningEvent({
    event_type: 'warned_zone_saved',
    user_id: userId,
    zone_id: zoneId,
    zone_name: zoneName,
    timestamp: new Date().toISOString(),
    metadata: {
      warning_type: warningType,
      warning_categories: warningCategories,
      user_ignored_warning: true
    }
  })
}

/**
 * Track when warning panel is closed
 *
 * @param zoneId - ID of the zone with warning
 * @param zoneName - Name of the zone with warning
 * @param timeSpentSeconds - Time spent viewing the warning panel in seconds
 * @param userId - Optional Clerk user ID if authenticated
 */
export function trackWarningClosed(
  zoneId: string,
  zoneName: string,
  timeSpentSeconds: number,
  userId?: string
): void {
  trackWarningEvent({
    event_type: 'warning_closed',
    user_id: userId,
    zone_id: zoneId,
    zone_name: zoneName,
    timestamp: new Date().toISOString(),
    metadata: {
      time_spent_viewing: timeSpentSeconds
    }
  })
}
