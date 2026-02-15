/**
 * API Client for OpenPlaces Backend
 * Story 1.3: Frontend-Backend Communication
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * Generic fetch wrapper with error handling
 */
async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API fetch error for ${endpoint}:`, error);
    throw error;
  }
}

/**
 * Health check endpoint
 * Story 1.3 AC: Frontend can fetch successfully
 */
export async function checkHealth(): Promise<{ status: string }> {
  return apiFetch<{ status: string }>('/api/health');
}

/**
 * Extended status endpoint
 */
export async function getApiStatus(): Promise<{
  status: string;
  environment: string;
  features: {
    openai_configured: boolean;
    supabase_configured: boolean;
    mapbox_configured: boolean;
  };
}> {
  return apiFetch('/api/status');
}

export default {
  checkHealth,
  getApiStatus,
};
