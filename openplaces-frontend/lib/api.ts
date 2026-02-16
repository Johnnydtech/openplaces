import axios from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // 60 second timeout (backend has 45s + 15s buffer)
  headers: {
    'Accept': 'application/json',
  },
})

// Request interceptor (optional - add auth headers later)
apiClient.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`)
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for consistent error handling
apiClient.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    console.error('API Error:', error.response?.data || error.message)
    return Promise.reject(error)
  }
)

/**
 * Upload flyer image to backend for AI analysis
 * POST /api/analyze
 *
 * @param file - Image file (JPG, PNG, PDF)
 * @returns Extracted event details
 */
export async function analyzeFlyer(file: File) {
  const formData = new FormData()
  formData.append('file', file)

  const response = await apiClient.post('/api/analyze', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })

  return response.data
}

/**
 * Geocode venue address to latitude/longitude coordinates
 * POST /api/geocode
 * Story 3.6: Venue geocoding integration
 *
 * @param venueAddress - Venue address string (e.g., "123 Main St, Arlington, VA")
 * @returns Geocoding result with coordinates and metadata
 */
export async function geocodeVenue(venueAddress: string) {
  const response = await apiClient.post('/api/geocode', {
    venue_address: venueAddress
  }, {
    timeout: 2500, // 2 seconds + 500ms buffer
  })

  return response.data
}

/**
 * Get top placement recommendations for an event
 * POST /api/recommendations/top
 * Story 4.4: Display recommendations with audience match scores
 * Story 6.2: Dynamic scoring adjustment based on time period
 *
 * @param eventData - Event details for scoring
 * @returns Array of zone recommendations with scores
 */
export type TimePeriod = 'morning' | 'lunch' | 'evening'

export interface EventDataForRecommendations {
  name: string
  date: string
  time: string
  venue_lat: number
  venue_lon: number
  target_audience: string[]
  event_type: string
  time_period?: TimePeriod  // Story 6.2: Optional time period for temporal scoring
}

export interface TimingWindow {
  days: string
  hours: string
  reasoning: string
}

export interface DataSource {
  name: string
  status: string
  details?: string
  last_updated: string
}

export interface WarningCategory {
  category_type: 'low_dwell_time' | 'poor_audience_match' | 'visual_noise' | 'timing_misalignment'
  display_name: string
  icon: string
  description: string
  severity: 'high' | 'medium' | 'low'
  metric_value?: number
}

export interface RiskWarning {
  is_flagged: boolean
  warning_type: string
  reason: string
  severity: string
  details: {
    foot_traffic_daily: number
    dwell_time_seconds: number
    audience_match_score: number
    audience_match_percent: number
    threshold_traffic: number
    threshold_dwell_time: number
    threshold_audience_match: number
  }
  alternative_zones?: Array<{  // Story 7.4: Better alternatives
    zone_id: string
    zone_name: string
    rank: number
    total_score: number
    reason: string
  }>
  warning_categories?: WarningCategory[]  // Story 7.5: Category breakdown
}

export interface HourlyTraffic {
  hour: string
  traffic: number
}

export interface GenderDistribution {
  name: string
  value: number
}

export interface BusiestDay {
  day: string
  traffic: number
}

export interface AnalyticsMetrics {
  average_hourly_audience: number
  peak_hour_audience: number
  total_daily_traffic: number
}

export interface Analytics {
  hourly_traffic: HourlyTraffic[]
  gender_distribution: GenderDistribution[]
  busiest_days: BusiestDay[]
  metrics: AnalyticsMetrics
}

export interface ZoneRecommendation {
  zone_id: string
  zone_name: string
  total_score: number
  audience_match_score: number
  temporal_score: number
  distance_score: number
  dwell_time_score: number
  distance_miles: number
  timing_windows: TimingWindow[]
  dwell_time_seconds: number
  cost_tier: string
  reasoning: string
  matched_signals: string[]
  data_sources: DataSource[]
  latitude: number
  longitude: number
  risk_warning?: RiskWarning  // Story 7.1: Risk detection
  analytics?: Analytics  // Real traffic analytics data
}

export async function getRecommendations(eventData: EventDataForRecommendations): Promise<ZoneRecommendation[]> {
  const response = await apiClient.post('/api/recommendations/top', eventData, {
    timeout: 60000  // 60 second timeout (NFR-P1: <60s total)
  })
  return response.data
}

/**
 * Save a recommendation for the current user
 * POST /api/saved-recommendations/save
 * Story 2.6: Save recommendation functionality
 *
 * @param userId - Clerk user ID
 * @param zoneId - Zone identifier
 * @param zoneName - Zone name
 * @param eventData - Event details
 * @param notes - Optional user notes
 * @returns Success response
 */
export interface SaveRecommendationRequest {
  user_id: string
  zone_id: string
  zone_name: string
  event_name: string
  event_date: string
  notes?: string
}

export async function saveRecommendation(
  userId: string,
  zoneId: string,
  zoneName: string,
  eventName: string,
  eventDate: string,
  notes?: string
): Promise<{ message: string; saved_recommendation_id: string }> {
  const response = await apiClient.post('/api/saved-recommendations/save', {
    user_id: userId,
    zone_id: zoneId,
    zone_name: zoneName,
    event_name: eventName,
    event_date: eventDate,
    notes: notes || null
  }, {
    headers: {
      'X-Clerk-User-Id': userId
    }
  })
  return response.data
}

/**
 * Remove a saved recommendation
 * POST /api/saved-recommendations/unsave
 * Story 2.6: Save recommendation functionality
 *
 * @param userId - Clerk user ID
 * @param zoneId - Zone identifier
 * @returns Success response
 */
export async function unsaveRecommendation(
  userId: string,
  zoneId: string
): Promise<{ message: string }> {
  const response = await apiClient.post('/api/saved-recommendations/unsave', {
    user_id: userId,
    zone_id: zoneId
  }, {
    headers: {
      'X-Clerk-User-Id': userId
    }
  })
  return response.data
}

/**
 * Check if a zone is already saved for the user
 * GET /api/saved-recommendations/check/{user_id}/{zone_id}
 * Story 2.6: Save recommendation functionality
 *
 * @param userId - Clerk user ID
 * @param zoneId - Zone identifier
 * @returns Whether the zone is saved
 */
export async function checkIfSaved(
  userId: string,
  zoneId: string
): Promise<{ is_saved: boolean }> {
  const response = await apiClient.get(`/api/saved-recommendations/check/${userId}/${zoneId}`, {
    headers: {
      'X-Clerk-User-Id': userId
    }
  })
  return response.data
}

/**
 * Get all saved recommendations for the current user
 * GET /api/saved-recommendations/{user_id}
 * Story 2.7: View saved recommendations history
 *
 * @param userId - Clerk user ID
 * @returns Array of saved recommendations
 */
export interface SavedRecommendation {
  id: string
  user_id: string
  zone_id: string
  zone_name: string
  event_name: string
  event_date: string
  notes: string | null
  created_at: string
}

export async function getSavedRecommendations(
  userId: string
): Promise<SavedRecommendation[]> {
  const response = await apiClient.get(`/api/saved-recommendations/${userId}`, {
    headers: {
      'X-Clerk-User-Id': userId
    }
  })
  return response.data
}

/**
 * Update notes for a saved recommendation
 * PATCH /api/saved-recommendations/{saved_recommendation_id}/notes
 * Story 2.8: Add/edit notes on saved recommendations
 *
 * @param userId - Clerk user ID
 * @param savedRecommendationId - Saved recommendation ID
 * @param notes - Updated notes text (max 500 characters)
 * @returns Success response
 */
export async function updateSavedRecommendationNotes(
  userId: string,
  savedRecommendationId: string,
  notes: string
): Promise<{ message: string }> {
  const response = await apiClient.patch(
    `/api/saved-recommendations/${savedRecommendationId}/notes`,
    { notes },
    {
      headers: {
        'X-Clerk-User-Id': userId
      }
    }
  )
  return response.data
}

/**
 * Delete a saved recommendation
 * DELETE /api/saved-recommendations/{saved_recommendation_id}
 * Story 2.9: Delete saved recommendations
 *
 * @param userId - Clerk user ID
 * @param savedRecommendationId - Saved recommendation ID
 * @returns Success response
 */
export async function deleteSavedRecommendation(
  userId: string,
  savedRecommendationId: string
): Promise<{ message: string }> {
  const response = await apiClient.delete(
    `/api/saved-recommendations/${savedRecommendationId}`,
    {
      headers: {
        'X-Clerk-User-Id': userId
      }
    }
  )
  return response.data
}
