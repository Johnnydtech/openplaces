'use client'

import { type ZoneRecommendation } from '@/lib/api'
import { useEffect, useRef } from 'react'

interface ZoneDetailsPanelProps {
  zone: ZoneRecommendation | null
  rank: number | null
  onClose: () => void
}

export default function ZoneDetailsPanel({ zone, rank, onClose }: ZoneDetailsPanelProps) {
  // Story 5.9: Store previous focus for restoration
  const previousFocusRef = useRef<HTMLElement | null>(null)

  // Story 5.5 AC: Close on Escape key
  // Story 5.9: Restore focus on unmount
  useEffect(() => {
    // Store the currently focused element
    previousFocusRef.current = document.activeElement as HTMLElement

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEscape)

    return () => {
      window.removeEventListener('keydown', handleEscape)

      // Restore focus to previous element
      if (previousFocusRef.current && typeof previousFocusRef.current.focus === 'function') {
        previousFocusRef.current.focus()
      }
    }
  }, [onClose])

  if (!zone || rank === null) return null

  // Calculate percentages (same as RecommendationCard)
  const audienceMatchPercent = Math.round((zone.audience_match_score / 40) * 100)
  const temporalPercent = Math.round((zone.temporal_score / 30) * 100)
  const distancePercent = Math.round((zone.distance_score / 20) * 100)
  const dwellTimePercent = Math.round((zone.dwell_time_score / 10) * 100)

  return (
    <>
      {/* Story 5.5: Semi-transparent overlay for backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-25 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Story 5.5: Side panel with zone details */}
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl z-50 overflow-y-auto transform transition-transform duration-200 ease-out">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between z-10">
          <h2 className="text-lg font-bold text-gray-900">Zone Details</h2>
          {/* Story 5.5 AC: Close button */}
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-gray-500">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>

        <div className="p-4">
          {/* Rank Badge + Zone Name */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white text-lg font-bold flex-shrink-0">
              #{rank}
            </div>
            <h3 className="text-xl font-bold text-gray-900">
              {zone.zone_name}
            </h3>
          </div>

          {/* Story 5.5 AC: Audience Match Score - PROMINENT */}
          <div className="mb-4">
            <div className="inline-flex items-center rounded-full bg-green-100 px-4 py-2">
              <span className="text-2xl font-bold text-green-700">
                {audienceMatchPercent}%
              </span>
              <span className="ml-2 text-sm font-medium text-green-700">
                Audience Match
              </span>
            </div>
          </div>

          {/* Story 5.5 AC: Distance, timing, cost */}
          <div className="space-y-3 text-sm text-gray-600 mb-4">
            {/* Distance */}
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-gray-500">
                <path fillRule="evenodd" d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 103 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 002.273 1.765 11.842 11.842 0 00.976.544l.062.029.018.008.006.003zM10 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z" clipRule="evenodd" />
              </svg>
              <span className="font-semibold">Distance:</span>
              <span className="font-semibold">{zone.distance_miles.toFixed(1)} mi</span>
              {zone.distance_miles < 1 && (
                <span className="ml-1 text-xs font-medium text-green-600">· Nearby</span>
              )}
            </div>

            {/* Timing Windows */}
            {zone.timing_windows.length > 0 && (
              <div className="flex items-start gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" />
                </svg>
                <div className="flex-1">
                  <span className="font-semibold block mb-1">Best times:</span>
                  {zone.timing_windows.map((window, idx) => (
                    <div key={idx} className="text-xs text-gray-700 mb-1">
                      {window.days} {window.hours}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Cost */}
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-gray-500">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-6a.75.75 0 01.75.75v.316a3.78 3.78 0 011.653.713c.426.33.744.74.925 1.2a.75.75 0 01-1.395.55 1.35 1.35 0 00-.447-.563 2.187 2.187 0 00-.736-.363V9.3c.698.093 1.383.32 1.959.696.787.514 1.29 1.27 1.29 2.13 0 .86-.504 1.616-1.29 2.13-.576.377-1.261.603-1.96.696v.299a.75.75 0 11-1.5 0v-.3c-.697-.092-1.382-.318-1.958-.695-.482-.315-.857-.717-1.078-1.188a.75.75 0 111.359-.636c.08.173.245.376.54.569.313.205.706.353 1.138.432v-2.748a3.782 3.782 0 01-1.653-.713C6.9 9.433 6.5 8.681 6.5 7.875c0-.805.4-1.558 1.097-2.096a3.78 3.78 0 011.653-.713V4.75A.75.75 0 0110 4z" clipRule="evenodd" />
              </svg>
              <span className="font-semibold">Cost:</span>
              <span className="font-semibold">{zone.cost_tier}</span>
            </div>
          </div>

          {/* Story 5.5 AC: Reasoning */}
          <div className="rounded-lg bg-blue-50 p-3 mb-4">
            <div className="flex items-start gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5">
                <path d="M10 1a6 6 0 00-3.815 10.631C7.237 12.5 8 13.443 8 14.456v.644a.75.75 0 00.572.729 6.016 6.016 0 002.856 0A.75.75 0 0012 15.1v-.644c0-1.013.762-1.957 1.815-2.825A6 6 0 0010 1zM8.863 17.414a.75.75 0 00-.226 1.483 9.066 9.066 0 002.726 0 .75.75 0 00-.226-1.483 7.553 7.553 0 01-2.274 0z" />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900 mb-1">
                  Why this works
                </p>
                <p className="text-sm text-blue-800 leading-relaxed">
                  {zone.reasoning}
                </p>
              </div>
            </div>
          </div>

          {/* Story 5.5 AC: Data sources */}
          {zone.data_sources.length > 0 && (
            <div className="mb-4 flex items-start gap-2 text-xs text-gray-600">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5">
                <path d="M10.75 16.82A7.462 7.462 0 0115 15.5c.71 0 1.396.098 2.046.282A.75.75 0 0018 15.06v-11a.75.75 0 00-.546-.721A9.006 9.006 0 0015 3a8.963 8.963 0 00-4.25 1.065V16.82zM9.25 4.065A8.963 8.963 0 005 3c-.85 0-1.673.118-2.454.339A.75.75 0 002 4.06v11a.75.75 0 00.954.721A7.506 7.506 0 015 15.5c1.579 0 3.042.487 4.25 1.32V4.065z" />
              </svg>
              <div className="flex-1">
                <span className="font-medium">Data sources: </span>
                {zone.data_sources.map(source => source.name).join(' · ')}
              </div>
            </div>
          )}

          {/* Story 5.5 AC: Scoring breakdown */}
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
            <h4 className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M4.25 2A2.25 2.25 0 002 4.25v11.5A2.25 2.25 0 004.25 18h11.5A2.25 2.25 0 0018 15.75V4.25A2.25 2.25 0 0015.75 2H4.25zm4.03 6.28a.75.75 0 00-1.06-1.06L4.97 9.47a.75.75 0 000 1.06l2.25 2.25a.75.75 0 001.06-1.06L6.56 10l1.72-1.72zm4.5-1.06a.75.75 0 10-1.06 1.06L13.44 10l-1.72 1.72a.75.75 0 101.06 1.06l2.25-2.25a.75.75 0 000-1.06l-2.25-2.25z" clipRule="evenodd" />
              </svg>
              Score Breakdown
            </h4>

            <div className="space-y-2">
              {/* Audience Match */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-gray-600">Audience Match (40%)</span>
                  <span className="font-medium text-gray-900">
                    {zone.audience_match_score.toFixed(1)}/40 ({audienceMatchPercent}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    className="bg-green-600 h-1.5 rounded-full"
                    style={{ width: `${audienceMatchPercent}%` }}
                  />
                </div>
              </div>

              {/* Timing */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-gray-600">Timing (30%)</span>
                  <span className="font-medium text-gray-900">
                    {zone.temporal_score.toFixed(1)}/30 ({temporalPercent}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    className="bg-blue-600 h-1.5 rounded-full"
                    style={{ width: `${temporalPercent}%` }}
                  />
                </div>
              </div>

              {/* Distance */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-gray-600">Distance (20%)</span>
                  <span className="font-medium text-gray-900">
                    {zone.distance_score.toFixed(1)}/20 ({distancePercent}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    className="bg-purple-600 h-1.5 rounded-full"
                    style={{ width: `${distancePercent}%` }}
                  />
                </div>
              </div>

              {/* Dwell Time */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-gray-600">Dwell Time (10%)</span>
                  <span className="font-medium text-gray-900">
                    {zone.dwell_time_score.toFixed(1)}/10 ({dwellTimePercent}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    className="bg-orange-600 h-1.5 rounded-full"
                    style={{ width: `${dwellTimePercent}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
