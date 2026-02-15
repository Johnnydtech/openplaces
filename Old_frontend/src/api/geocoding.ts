/**
 * Story 3.6: Implement Venue Geocoding to Lat/Lon
 * API client for geocoding venue addresses to coordinates
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface GeocodeResult {
  latitude: number;
  longitude: number;
  formatted_address: string;
  place_name: string;
  within_arlington: boolean;
  confidence: string;
}

export interface GeocodeRequest {
  venue_address: string;
}

export class GeocodingError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message);
    this.name = 'GeocodingError';
  }
}

/**
 * Geocode venue address to lat/lon coordinates
 *
 * Story 3.6 Acceptance Criteria:
 * - Address geocoded to lat/lon using Mapbox Geocoding API
 * - Coordinates stored with event data
 * - Failure shows "Venue not found" message
 * - Completes within 2 seconds
 * - Coordinates validated within Arlington, VA bounds
 *
 * @param venueAddress - Venue address to geocode
 * @returns GeocodeResult with coordinates and metadata
 * @throws GeocodingError if geocoding fails
 */
export async function geocodeVenue(venueAddress: string): Promise<GeocodeResult> {
  if (!venueAddress || !venueAddress.trim()) {
    throw new GeocodingError('Venue address is required', 400);
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/geocode`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ venue_address: venueAddress }),
      // Story 3.6 AC: Completes within 2 seconds (add buffer for network)
      signal: AbortSignal.timeout(3000),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Geocoding failed' }));

      // Story 3.6 AC: Failure shows "Venue not found" message
      if (response.status === 404) {
        throw new GeocodingError(
          error.detail || 'Venue not found. Please check the address and try again.',
          404
        );
      }

      throw new GeocodingError(
        error.detail || `Geocoding error: ${response.status}`,
        response.status
      );
    }

    const result: GeocodeResult = await response.json();
    return result;
  } catch (error) {
    if (error instanceof GeocodingError) {
      throw error;
    }

    if (error instanceof DOMException && error.name === 'TimeoutError') {
      throw new GeocodingError('Geocoding request timed out. Please try again.', 504);
    }

    console.error('Geocoding error:', error);
    throw new GeocodingError(
      error instanceof Error ? error.message : 'An unexpected error occurred during geocoding',
      500
    );
  }
}

export default {
  geocodeVenue,
};
