/**
 * Tests for Story 3.2: Frontend OpenAI Vision API integration
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { analyzeFlyer, EventExtraction } from './analyze'

// Mock fetch globally
global.fetch = vi.fn()

describe('Story 3.2: analyzeFlyer API integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('successfully analyzes flyer and returns event data', async () => {
    // Arrange
    const mockFile = new File(['fake image'], 'flyer.jpg', { type: 'image/jpeg' })
    const mockResponse: EventExtraction = {
      event_name: 'Summer Concert',
      event_date: '2026-07-15',
      event_time: '7:00 PM',
      venue: 'Clarendon Ballroom',
      target_audience: ['young professionals', 'music lovers'],
      confidence: 'High',
      extraction_notes: ''
    }

    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockResponse })
    })

    // Act
    const result = await analyzeFlyer(mockFile)

    // Assert
    expect(result).toEqual(mockResponse)
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/analyze'),
      expect.objectContaining({
        method: 'POST',
        body: expect.any(FormData)
      })
    )
  })

  it('handles 400 error with specific message', async () => {
    // Arrange
    const mockFile = new File(['fake'], 'flyer.pdf', { type: 'application/pdf' })

    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ detail: 'File type not supported. Please upload JPG, PNG, or PDF.' })
    })

    // Act & Assert
    await expect(analyzeFlyer(mockFile)).rejects.toThrow('File type not supported')
  })

  it('handles 500 error with fallback message', async () => {
    // Arrange
    const mockFile = new File(['fake image'], 'flyer.jpg', { type: 'image/jpeg' })

    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ detail: 'AI extraction unavailable. Please enter event details manually.' })
    })

    // Act & Assert
    await expect(analyzeFlyer(mockFile)).rejects.toThrow('AI extraction unavailable')
  })

  it('handles network error with generic message', async () => {
    // Arrange
    const mockFile = new File(['fake image'], 'flyer.jpg', { type: 'image/jpeg' })

    ;(global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Network error'))

    // Act & Assert
    await expect(analyzeFlyer(mockFile)).rejects.toThrow()
  })

  it('handles unsuccessful response from backend', async () => {
    // Arrange
    const mockFile = new File(['fake image'], 'flyer.jpg', { type: 'image/jpeg' })

    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: false })
    })

    // Act & Assert
    await expect(analyzeFlyer(mockFile)).rejects.toThrow('unsuccessful response')
  })

  it('calls correct API endpoint', async () => {
    // Arrange
    const mockFile = new File(['fake image'], 'flyer.jpg', { type: 'image/jpeg' })

    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          event_name: 'Test',
          event_date: '',
          event_time: '',
          venue: '',
          target_audience: [],
          confidence: 'Low',
          extraction_notes: ''
        }
      })
    })

    // Act
    await analyzeFlyer(mockFile)

    // Assert
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/analyze'),
      expect.any(Object)
    )
  })

  it('sends file as FormData', async () => {
    // Arrange
    const mockFile = new File(['fake image'], 'flyer.jpg', { type: 'image/jpeg' })

    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          event_name: 'Test',
          event_date: '',
          event_time: '',
          venue: '',
          target_audience: [],
          confidence: 'Medium',
          extraction_notes: ''
        }
      })
    })

    // Act
    await analyzeFlyer(mockFile)

    // Assert
    const callArgs = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(callArgs[1].body).toBeInstanceOf(FormData)
  })
})
