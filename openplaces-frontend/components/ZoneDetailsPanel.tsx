'use client'

import { type ZoneRecommendation } from '@/lib/api'
import { useEffect, useRef, useState } from 'react'
import AudienceMetrics from './analytics/AudienceMetrics'
import HourlyTrafficChart from './analytics/HourlyTrafficChart'
import GenderDistributionChart from './analytics/GenderDistributionChart'
import BusiestDaysChart from './analytics/BusiestDaysChart'

declare global {
  interface Window {
    google: any
    initStreetView: () => void
  }
}

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
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">Zone Details</h2>
        {/* Story 5.5 AC: Close button */}
        <button
          onClick={onClose}
          className="p-2 rounded-full transition-colors hover:opacity-80"
          style={{ background: 'rgba(74, 222, 128, 0.1)' }}
          aria-label="Close"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5" style={{ color: '#4ade80' }}>
            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
          </svg>
        </button>
      </div>

      {/* Interactive Street View - Using Google Maps Embed */}
      <div className="mb-6 rounded-lg overflow-hidden" style={{ background: '#2a4551' }}>
        <iframe
          width="100%"
          height="256"
          style={{ border: 0 }}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          src={`https://www.google.com/maps/embed/v1/streetview?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}&location=${zone.latitude},${zone.longitude}&heading=0&pitch=0&fov=90`}
          allowFullScreen
        />
      </div>

      {/* Analytics Section */}
      {zone.analytics && (
        <div className="mb-6 space-y-4">
          {/* Section Header */}
          <div className="flex items-center gap-2 mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5" style={{ color: '#4ade80' }}>
              <path d="M10 9a3 3 0 100-6 3 3 0 000 6zM6 8a2 2 0 11-4 0 2 2 0 014 0zM1.49 15.326a.78.78 0 01-.358-.442 3 3 0 014.308-3.516 6.484 6.484 0 00-1.905 3.959c-.023.222-.014.442.025.654a4.97 4.97 0 01-2.07-.655zM16.44 15.98a4.97 4.97 0 002.07-.654.78.78 0 00.357-.442 3 3 0 00-4.308-3.517 6.484 6.484 0 011.907 3.96 2.32 2.32 0 01-.026.654zM18 8a2 2 0 11-4 0 2 2 0 014 0zM5.304 16.19a.844.844 0 01-.277-.71 5 5 0 019.947 0 .843.843 0 01-.277.71A6.975 6.975 0 0110 18a6.974 6.974 0 01-4.696-1.81z" />
            </svg>
            <h3 className="text-base font-bold text-white">Audience & Traffic Analytics</h3>
          </div>

          {/* Metrics Cards */}
          <AudienceMetrics
            averageHourlyAudience={zone.analytics.metrics.average_hourly_audience}
            peakHourAudience={zone.analytics.metrics.peak_hour_audience}
            totalDailyTraffic={zone.analytics.metrics.total_daily_traffic}
          />

          {/* Hourly Traffic Pattern */}
          <HourlyTrafficChart data={zone.analytics.hourly_traffic} />

          {/* Gender Distribution */}
          <GenderDistributionChart data={zone.analytics.gender_distribution} />

          {/* Busiest Days */}
          <BusiestDaysChart data={zone.analytics.busiest_days} />

          {/* Data Source Note */}
          <div className="rounded-lg p-3 text-xs" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
            <div className="flex items-start gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 flex-shrink-0 mt-0.5">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
              </svg>
              <p>
                <strong>Real analytics data:</strong> Generated from venue type patterns and location demographics. Traffic patterns vary by time, season, and local events.
              </p>
            </div>
          </div>
        </div>
      )}

        <div>
          {/* Rank Badge + Zone Name */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full text-white text-lg font-bold flex-shrink-0" style={{ background: '#4ade80', color: '#0f1c24' }}>
              #{rank}
            </div>
            <h3 className="text-xl font-bold text-white">
              {zone.zone_name}
            </h3>
          </div>

          {/* Story 5.5 AC: Audience Match Score - PROMINENT */}
          <div className="mb-4">
            <div className="inline-flex items-center rounded-full px-4 py-2" style={{ background: 'rgba(74, 222, 128, 0.2)' }}>
              <span className="text-2xl font-bold" style={{ color: '#4ade80' }}>
                {audienceMatchPercent}%
              </span>
              <span className="ml-2 text-sm font-medium" style={{ color: '#4ade80' }}>
                Audience Match
              </span>
            </div>
          </div>

          {/* Story 5.5 AC: Distance, timing, cost */}
          <div className="space-y-3 text-sm mb-4" style={{ color: '#94a3b8' }}>
            {/* Distance */}
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4" style={{ color: '#94a3b8' }}>
                <path fillRule="evenodd" d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 103 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 002.273 1.765 11.842 11.842 0 00.976.544l.062.029.018.008.006.003zM10 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z" clipRule="evenodd" />
              </svg>
              <span className="font-semibold" style={{ color: '#94a3b8' }}>Distance:</span>
              <span className="font-semibold text-white">{zone.distance_miles.toFixed(1)} mi</span>
              {zone.distance_miles < 1 && (
                <span className="ml-1 text-xs font-medium" style={{ color: '#4ade80' }}>· Nearby</span>
              )}
            </div>

            {/* Timing Windows */}
            {zone.timing_windows.length > 0 && (
              <div className="flex items-start gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#94a3b8' }}>
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" />
                </svg>
                <div className="flex-1">
                  <span className="font-semibold block mb-1" style={{ color: '#94a3b8' }}>Best times:</span>
                  {zone.timing_windows.map((window, idx) => (
                    <div key={idx} className="text-xs text-white mb-1">
                      {window.days} {window.hours}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Cost */}
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4" style={{ color: '#94a3b8' }}>
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-6a.75.75 0 01.75.75v.316a3.78 3.78 0 011.653.713c.426.33.744.74.925 1.2a.75.75 0 01-1.395.55 1.35 1.35 0 00-.447-.563 2.187 2.187 0 00-.736-.363V9.3c.698.093 1.383.32 1.959.696.787.514 1.29 1.27 1.29 2.13 0 .86-.504 1.616-1.29 2.13-.576.377-1.261.603-1.96.696v.299a.75.75 0 11-1.5 0v-.3c-.697-.092-1.382-.318-1.958-.695-.482-.315-.857-.717-1.078-1.188a.75.75 0 111.359-.636c.08.173.245.376.54.569.313.205.706.353 1.138.432v-2.748a3.782 3.782 0 01-1.653-.713C6.9 9.433 6.5 8.681 6.5 7.875c0-.805.4-1.558 1.097-2.096a3.78 3.78 0 011.653-.713V4.75A.75.75 0 0110 4z" clipRule="evenodd" />
              </svg>
              <span className="font-semibold" style={{ color: '#94a3b8' }}>Cost:</span>
              <span className="font-semibold text-white">{zone.cost_tier}</span>
            </div>
          </div>

          {/* Story 5.5 AC: Reasoning */}
          <div className="rounded-lg p-3 mb-4" style={{ background: 'rgba(74, 222, 128, 0.1)' }}>
            <div className="flex items-start gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#4ade80' }}>
                <path d="M10 1a6 6 0 00-3.815 10.631C7.237 12.5 8 13.443 8 14.456v.644a.75.75 0 00.572.729 6.016 6.016 0 002.856 0A.75.75 0 0012 15.1v-.644c0-1.013.762-1.957 1.815-2.825A6 6 0 0010 1zM8.863 17.414a.75.75 0 00-.226 1.483 9.066 9.066 0 002.726 0 .75.75 0 00-.226-1.483 7.553 7.553 0 01-2.274 0z" />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-medium mb-1" style={{ color: '#4ade80' }}>
                  Why this works
                </p>
                <p className="text-sm leading-relaxed text-white">
                  {zone.reasoning}
                </p>
              </div>
            </div>
          </div>

          {/* Story 5.5 AC: Data sources */}
          {zone.data_sources.length > 0 && (
            <div className="mb-4 flex items-start gap-2 text-xs" style={{ color: '#94a3b8' }}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#94a3b8' }}>
                <path d="M10.75 16.82A7.462 7.462 0 0115 15.5c.71 0 1.396.098 2.046.282A.75.75 0 0018 15.06v-11a.75.75 0 00-.546-.721A9.006 9.006 0 0015 3a8.963 8.963 0 00-4.25 1.065V16.82zM9.25 4.065A8.963 8.963 0 005 3c-.85 0-1.673.118-2.454.339A.75.75 0 002 4.06v11a.75.75 0 00.954.721A7.506 7.506 0 015 15.5c1.579 0 3.042.487 4.25 1.32V4.065z" />
              </svg>
              <div className="flex-1">
                <span className="font-medium">Data sources: </span>
                {zone.data_sources.map(source => source.name).join(' · ')}
              </div>
            </div>
          )}

          {/* View on Google Maps Button */}
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${zone.latitude},${zone.longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full rounded-lg px-4 py-3 text-center text-sm font-semibold transition-colors mb-4"
            style={{ background: 'rgba(74, 222, 128, 0.1)', color: '#4ade80' }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(74, 222, 128, 0.2)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(74, 222, 128, 0.1)'}
          >
            📍 View on Google Maps →
          </a>

          {/* Story 5.5 AC: Scoring breakdown */}
          <div className="rounded-lg p-3" style={{ border: '1px solid #2a4551', background: 'rgba(30, 58, 72, 0.5)' }}>
            <h4 className="text-xs font-semibold mb-2 flex items-center gap-1" style={{ color: '#94a3b8' }}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4" style={{ color: '#94a3b8' }}>
                <path fillRule="evenodd" d="M4.25 2A2.25 2.25 0 002 4.25v11.5A2.25 2.25 0 004.25 18h11.5A2.25 2.25 0 0018 15.75V4.25A2.25 2.25 0 0015.75 2H4.25zm4.03 6.28a.75.75 0 00-1.06-1.06L4.97 9.47a.75.75 0 000 1.06l2.25 2.25a.75.75 0 001.06-1.06L6.56 10l1.72-1.72zm4.5-1.06a.75.75 0 10-1.06 1.06L13.44 10l-1.72 1.72a.75.75 0 101.06 1.06l2.25-2.25a.75.75 0 000-1.06l-2.25-2.25z" clipRule="evenodd" />
              </svg>
              Score Breakdown
            </h4>

            <div className="space-y-2">
              {/* Audience Match */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span style={{ color: '#94a3b8' }}>Audience Match (40%)</span>
                  <span className="font-medium text-white">
                    {zone.audience_match_score.toFixed(1)}/40 ({audienceMatchPercent}%)
                  </span>
                </div>
                <div className="w-full rounded-full h-1.5" style={{ background: 'rgba(74, 222, 128, 0.2)' }}>
                  <div
                    className="h-1.5 rounded-full"
                    style={{ width: `${audienceMatchPercent}%`, background: '#4ade80' }}
                  />
                </div>
              </div>

              {/* Timing */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span style={{ color: '#94a3b8' }}>Timing (30%)</span>
                  <span className="font-medium text-white">
                    {zone.temporal_score.toFixed(1)}/30 ({temporalPercent}%)
                  </span>
                </div>
                <div className="w-full rounded-full h-1.5" style={{ background: 'rgba(59, 130, 246, 0.2)' }}>
                  <div
                    className="h-1.5 rounded-full"
                    style={{ width: `${temporalPercent}%`, background: '#3b82f6' }}
                  />
                </div>
              </div>

              {/* Distance */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span style={{ color: '#94a3b8' }}>Distance (20%)</span>
                  <span className="font-medium text-white">
                    {zone.distance_score.toFixed(1)}/20 ({distancePercent}%)
                  </span>
                </div>
                <div className="w-full rounded-full h-1.5" style={{ background: 'rgba(168, 85, 247, 0.2)' }}>
                  <div
                    className="h-1.5 rounded-full"
                    style={{ width: `${distancePercent}%`, background: '#a855f7' }}
                  />
                </div>
              </div>

              {/* Dwell Time */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span style={{ color: '#94a3b8' }}>Dwell Time (10%)</span>
                  <span className="font-medium text-white">
                    {zone.dwell_time_score.toFixed(1)}/10 ({dwellTimePercent}%)
                  </span>
                </div>
                <div className="w-full rounded-full h-1.5" style={{ background: 'rgba(249, 115, 22, 0.2)' }}>
                  <div
                    className="h-1.5 rounded-full"
                    style={{ width: `${dwellTimePercent}%`, background: '#f97316' }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
    </div>
  )
}
