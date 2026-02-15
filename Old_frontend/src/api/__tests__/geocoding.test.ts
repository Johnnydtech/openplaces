/**
 * Story 3.6: Test Venue Geocoding to Lat/Lon
 * Tests for frontend geocoding API client
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { geocodeVenue, GeocodingError } from '../geocoding';

// Mock fetch
global.fetch = vi.fn();

describe('Story 3.6: Venue Geocoding', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('geocodeVenue', () => {
    it('should successfully geocode venue address', async () => {
      // Story 3.6 AC: Address geocoded to lat/lon using Mapbox API
      const mockResult = {
        latitude: 38.8816,
        longitude: -77.0910,
        formatted_address: '123 Main St, Arlington, VA 22201',
        place_name: '123 Main St',
        within_arlington: true,
        confidence: 'High',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResult,
      });

      const result = await geocodeVenue('123 Main St, Arlington, VA');

      expect(result).toEqual(mockResult);
      expect(result.latitude).toBe(38.8816);
      expect(result.longitude).toBe(-77.0910);
      expect(result.within_arlington).toBe(true);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/geocode'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ venue_address: '123 Main St, Arlington, VA' }),
        })
      );
    });

    it('should throw error for empty venue address', async () => {
      // Story 3.6 AC: Validation of input
      await expect(geocodeVenue('')).rejects.toThrow(GeocodingError);
      await expect(geocodeVenue('   ')).rejects.toThrow('Venue address is required');
    });

    it('should throw error when venue not found (404)', async () => {
      // Story 3.6 AC: Failure shows "Venue not found" message
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ detail: 'Venue not found. Please check the address and try again.' }),
      });

      await expect(geocodeVenue('Nonexistent Address XYZ')).rejects.toThrow(GeocodingError);
      await expect(geocodeVenue('Nonexistent Address XYZ')).rejects.toThrow('Venue not found');
    });

    it('should throw error on timeout', async () => {
      // Story 3.6 AC: Completes within 2 seconds (timeout handling)
      (global.fetch as any).mockRejectedValueOnce(new DOMException('Timeout', 'TimeoutError'));

      await expect(geocodeVenue('123 Main St')).rejects.toThrow(GeocodingError);
      await expect(geocodeVenue('123 Main St')).rejects.toThrow('timed out');
    });

    it('should throw error on server error (500)', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ detail: 'Geocoding service error' }),
      });

      await expect(geocodeVenue('123 Main St')).rejects.toThrow(GeocodingError);
    });

    it('should validate coordinates within Arlington bounds', async () => {
      // Story 3.6 AC: Coordinates validated within Arlington, VA bounds
      const mockResult = {
        latitude: 38.8816,
        longitude: -77.0910,
        formatted_address: 'Ballston Metro, Arlington, VA',
        place_name: 'Ballston Metro',
        within_arlington: true,
        confidence: 'High',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResult,
      });

      const result = await geocodeVenue('Ballston Metro');

      expect(result.within_arlington).toBe(true);
      expect(result.latitude).toBeGreaterThan(38.82);
      expect(result.latitude).toBeLessThan(38.93);
      expect(result.longitude).toBeGreaterThan(-77.17);
      expect(result.longitude).toBeLessThan(-77.03);
    });

    it('should handle addresses outside Arlington', async () => {
      // Story 3.6 AC: Coordinates validated within Arlington, VA bounds
      const mockResult = {
        latitude: 38.9072,
        longitude: -77.0369,
        formatted_address: 'Washington, DC',
        place_name: 'Washington DC',
        within_arlington: false,
        confidence: 'Medium',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResult,
      });

      const result = await geocodeVenue('Washington, DC');

      expect(result.within_arlington).toBe(false);
    });

    it('should handle network errors gracefully', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      await expect(geocodeVenue('123 Main St')).rejects.toThrow(GeocodingError);
    });
  });
});
