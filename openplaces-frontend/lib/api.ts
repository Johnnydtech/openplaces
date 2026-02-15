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
 *
 * @param eventData - Event details for scoring
 * @returns Array of zone recommendations with scores
 */
export interface EventDataForRecommendations {
  name: string
  date: string
  time: string
  venue_lat: number
  venue_lon: number
  target_audience: string[]
  event_type: string
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
}

export async function getRecommendations(eventData: EventDataForRecommendations): Promise<ZoneRecommendation[]> {
  const response = await apiClient.post('/api/recommendations/top', eventData, {
    timeout: 60000  // 60 second timeout (NFR-P1: <60s total)
  })
  return response.data
}
