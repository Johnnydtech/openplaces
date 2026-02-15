/**
 * Story 3.2: Frontend integration for OpenAI Vision API
 * Uploads flyer to backend /api/analyze endpoint
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export interface EventExtraction {
  event_name: string
  event_date: string
  event_time: string
  venue: string
  target_audience: string[]
  confidence: 'High' | 'Medium' | 'Low'
  extraction_notes: string
}

export interface AnalyzeResponse {
  success: boolean
  data: EventExtraction
}

export interface AnalyzeError {
  detail: string
}

/**
 * Upload flyer to backend for AI analysis
 *
 * Story 3.2 AC:
 * - Calls backend /api/analyze endpoint
 * - Returns extracted event details
 * - Handles errors with user-friendly messages
 *
 * @param file - The flyer file to analyze
 * @returns Extracted event details
 * @throws Error with user-friendly message
 */
export async function analyzeFlyer(file: File): Promise<EventExtraction> {
  try {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch(`${API_BASE_URL}/api/analyze`, {
      method: 'POST',
      body: formData,
      // Note: Don't set Content-Type header - browser will set it with boundary
    })

    if (!response.ok) {
      // Parse error response
      const errorData: AnalyzeError = await response.json()
      throw new Error(errorData.detail || 'AI extraction failed')
    }

    const result: AnalyzeResponse = await response.json()

    if (!result.success) {
      throw new Error('AI extraction returned unsuccessful response')
    }

    return result.data
  } catch (error) {
    // Re-throw with user-friendly message
    if (error instanceof Error) {
      throw error
    }
    throw new Error('AI extraction unavailable. Please enter event details manually.')
  }
}
