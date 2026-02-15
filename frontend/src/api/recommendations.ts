/**
 * Story 4.3: Frontend integration for Recommendations API
 * Fetches zone recommendations from backend /api/recommendations endpoint
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

/**
 * Event data for scoring zones
 * Matches backend EventData model
 */
export interface EventData {
  name: string
  date: string
  time: string
  venue_lat: number
  venue_lon: number
  target_audience: string[]
  event_type: string
}

/**
 * Timing window for a zone
 */
export interface TimingWindow {
  days: string // e.g., "Mon-Thu"
  hours: string // e.g., "5-7pm"
  reasoning: string // e.g., "commuters planning weekends"
}

/**
 * Data source information for transparency (Story 4.10)
 */
export interface DataSource {
  name: string // e.g., "Metro transit schedules"
  status: 'detected' | 'not_detected'
  details: string | null // e.g., "Orange Line, high confidence"
  last_updated: string // ISO date
}

/**
 * Risk warning for deceptive hotspots (Story 7.1-7.7)
 */
export interface RiskWarning {
  type: 'low_dwell_time' | 'poor_audience_match' | 'visual_noise' | 'timing_misalignment'
  severity: 'warning' | 'caution'
  title: string
  explanation: string
  data_citation: string
  alternatives?: number[] // Ranks of better alternative zones
}

/**
 * Scored zone recommendation
 * Matches backend ZoneScore model
 */
export interface ZoneRecommendation {
  zone_id: string
  zone_name: string
  total_score: number // 0-100
  rank: number

  // Scoring breakdown
  audience_match_score: number // 0-40
  temporal_score: number // 0-30
  distance_score: number // 0-20
  dwell_time_score: number // 0-10

  // Zone details
  distance_miles: number
  timing_windows: TimingWindow[]
  dwell_time_seconds: number
  cost_tier: string

  // Transparency features
  reasoning: string // Plain language explanation
  matched_signals: string[] // Matched audience signals
  data_sources: DataSource[] // Story 4.10: Data sources used

  // Story 7.1-7.7: Risk warnings for deceptive hotspots
  risk_warning?: RiskWarning

  // Geographic data
  latitude: number
  longitude: number
}

/**
 * API response for recommendations
 */
export interface RecommendationsResponse {
  recommendations: ZoneRecommendation[]
  total_zones_scored: number
  event_data: EventData
}

/**
 * Error response from API
 */
export interface RecommendationsError {
  detail: string
}

/**
 * Get top N zone recommendations for an event
 *
 * Story 4.3 AC:
 * - Returns top N zones ranked #1 to #N
 * - Each shows: rank badge, zone name, audience match %, distance, timing windows
 * - Sorted by score (highest first)
 * - Fewer than N zones shown if not enough qualify
 * - Loads within 60 seconds total (NFR-P1)
 *
 * @param eventData - Event details for scoring
 * @param limit - Maximum number of recommendations (default 10, 3 for anonymous users)
 * @returns Array of top zone recommendations
 * @throws Error with user-friendly message
 */
export async function getTopRecommendations(
  eventData: EventData,
  limit: number = 10
): Promise<ZoneRecommendation[]> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/recommendations/top?limit=${limit}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      }
    )

    if (!response.ok) {
      // Parse error response
      const errorData: RecommendationsError = await response.json()
      throw new Error(errorData.detail || 'Failed to get recommendations')
    }

    const recommendations: ZoneRecommendation[] = await response.json()

    // Add rank to each recommendation (backend returns sorted)
    return recommendations.map((rec, index) => ({
      ...rec,
      rank: index + 1,
    }))
  } catch (error) {
    // Re-throw with user-friendly message
    if (error instanceof Error) {
      throw error
    }
    throw new Error('Recommendation service unavailable. Please try again later.')
  }
}

/**
 * Score all zones for an event (returns full list)
 *
 * Story 4.2 AC:
 * - Scoring formula: audience_match (40%) + temporal_alignment (30%) +
 *   distance (20%) + dwell_time (10%)
 * - Returns zones sorted by score (highest first)
 * - Final score 0-100%
 * - Completes within 5 seconds
 *
 * @param eventData - Event details for scoring
 * @returns Array of all zone recommendations (sorted)
 * @throws Error with user-friendly message
 */
export async function scoreAllZones(
  eventData: EventData
): Promise<ZoneRecommendation[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/recommendations/score`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventData),
    })

    if (!response.ok) {
      const errorData: RecommendationsError = await response.json()
      throw new Error(errorData.detail || 'Failed to score zones')
    }

    const recommendations: ZoneRecommendation[] = await response.json()

    // Add rank to each recommendation
    return recommendations.map((rec, index) => ({
      ...rec,
      rank: index + 1,
    }))
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('Scoring service unavailable. Please try again later.')
  }
}

/**
 * Check recommendations service health
 *
 * @returns Service health status
 */
export async function checkRecommendationsHealth(): Promise<{
  status: string
  zones_loaded: number
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/recommendations/health`)

    if (!response.ok) {
      throw new Error('Health check failed')
    }

    return await response.json()
  } catch (error) {
    throw new Error('Recommendations service unavailable')
  }
}
