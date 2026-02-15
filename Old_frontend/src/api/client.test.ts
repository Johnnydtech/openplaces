/**
 * Tests for API Client
 * Story 1.3: Frontend-Backend Communication
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { checkHealth, getApiStatus } from './client';

// Mock fetch globally
global.fetch = vi.fn();

describe('API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('checkHealth', () => {
    it('should successfully fetch health status', async () => {
      // Story 1.3 AC: Frontend can fetch successfully
      const mockResponse = { status: 'ok' };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await checkHealth();

      expect(result).toEqual({ status: 'ok' });
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/health',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('should throw error on failed request', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      await expect(checkHealth()).rejects.toThrow('HTTP error! status: 500');
    });

    it('should handle network errors', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error('Network error')
      );

      await expect(checkHealth()).rejects.toThrow('Network error');
    });
  });

  describe('getApiStatus', () => {
    it('should fetch API status with features', async () => {
      const mockResponse = {
        status: 'running',
        environment: 'development',
        features: {
          openai_configured: true,
          supabase_configured: true,
          mapbox_configured: false,
        },
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await getApiStatus();

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/status',
        expect.any(Object)
      );
    });

    it('should handle missing features gracefully', async () => {
      const mockResponse = {
        status: 'running',
        environment: 'development',
        features: {
          openai_configured: false,
          supabase_configured: false,
          mapbox_configured: false,
        },
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await getApiStatus();

      expect(result.features.openai_configured).toBe(false);
      expect(result.features.supabase_configured).toBe(false);
      expect(result.features.mapbox_configured).toBe(false);
    });
  });

  describe('CORS handling', () => {
    it('should send requests to localhost:8000 by default', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'ok' }),
      });

      await checkHealth();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('http://localhost:8000'),
        expect.any(Object)
      );
    });
  });
});
