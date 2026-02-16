'use client'

import { useState, useEffect, Suspense, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import toast, { Toaster } from 'react-hot-toast'
import RecommendationCard from '@/components/RecommendationCard'
import MapComponent from '@/components/Map'
import TimePeriodToggle, { type TimePeriod } from '@/components/TimePeriodToggle'
import { getRecommendations, type EventDataForRecommendations, type ZoneRecommendation } from '@/lib/api'
import { getDefaultTimePeriod } from '@/lib/timeUtils'

function RecommendationsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [recommendations, setRecommendations] = useState<ZoneRecommendation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [eventData, setEventData] = useState<EventDataForRecommendations | null>(null)
  // Story 4.8: Add editable event data state for re-ranking
  const [editableEventData, setEditableEventData] = useState<EventDataForRecommendations | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  // Story 5.7: Track hovered zone for map highlighting
  const [hoveredZoneId, setHoveredZoneId] = useState<string | null>(null)
  // Story 5.8: Track recommendation card refs for scroll-into-view
  const recommendationRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  // Story 6.1: Time period selection state
  const [selectedTimePeriod, setSelectedTimePeriod] = useState<TimePeriod>('evening')

  // Story 5.10: Register service worker for offline tile caching (production only)
  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('[App] Service Worker registered successfully:', registration.scope)
        })
        .catch((error) => {
          console.error('[App] Service Worker registration failed:', error)
        })
    } else if (process.env.NODE_ENV === 'development') {
      console.log('[App] Service Worker disabled in development mode')
    }
  }, [])

  // Story 5.8: Scroll to highlighted recommendation when hoveredZoneId changes
  useEffect(() => {
    if (!hoveredZoneId) return

    const cardElement = recommendationRefs.current.get(hoveredZoneId)
    if (cardElement) {
      cardElement.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',  // Don't scroll if already visible
        inline: 'nearest'
      })
    }
  }, [hoveredZoneId])

  useEffect(() => {
    const eventDataParam = searchParams.get('eventData')
    if (!eventDataParam) {
      toast.error('No event data provided')
      router.push('/upload')
      return
    }

    const parsedEventData: EventDataForRecommendations = JSON.parse(eventDataParam)
    setEventData(parsedEventData)
    setEditableEventData(parsedEventData) // Story 4.8: Initialize editable data

    // Story 6.1: Calculate default time period based on event time
    const defaultPeriod = getDefaultTimePeriod(parsedEventData.date, parsedEventData.time)
    setSelectedTimePeriod(defaultPeriod)

    const fetchRecommendations = async () => {
      setIsLoading(true)
      try {
        toast.loading('Generating recommendations...', { id: 'recommendations' })

        const results = await getRecommendations(parsedEventData)
        setRecommendations(results)

        toast.success(`Found ${results.length} recommendations!`, { id: 'recommendations' })
      } catch (error: any) {
        console.error('Error fetching recommendations:', error)
        toast.error('Failed to generate recommendations', { id: 'recommendations' })
      } finally {
        setIsLoading(false)
      }
    }

    fetchRecommendations()
  }, [searchParams, router])

  // Story 4.8: Re-ranking handler for event detail changes
  const handleUpdateRecommendations = async () => {
    if (!editableEventData) return

    setIsLoading(true)
    setIsEditing(false)

    try {
      toast.loading('Updating recommendations...', { id: 'update' })

      const results = await getRecommendations(editableEventData)
      setRecommendations(results)
      setEventData(editableEventData) // Update display data

      toast.success(`Updated! Found ${results.length} recommendations`, { id: 'update' })
    } catch (error: any) {
      console.error('Error updating recommendations:', error)
      toast.error('Failed to update recommendations', { id: 'update' })
    } finally {
      setIsLoading(false)
    }
  }

  // Story 6.1/6.2: Handler for time period changes with re-ranking
  const handleTimePeriodChange = async (period: TimePeriod) => {
    if (!eventData) return

    setSelectedTimePeriod(period)
    setIsLoading(true)

    try {
      toast.loading(`Re-ranking for ${period}...`, { id: 'rerank' })

      // Story 6.2: Include time period in API request
      const eventDataWithPeriod: EventDataForRecommendations = {
        ...eventData,
        time_period: period
      }

      const results = await getRecommendations(eventDataWithPeriod)
      setRecommendations(results)

      toast.success(`Optimized for ${period}!`, { id: 'rerank' })
    } catch (error: any) {
      console.error('[Recommendations] Error re-ranking:', error)
      toast.error('Failed to re-rank recommendations', { id: 'rerank' })
      // Keep previous recommendations on error
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <Toaster position="top-center" />

      {/* Header */}
      <nav className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">OpenPlaces</h1>
          <button
            onClick={() => router.push('/upload')}
            className="text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            ← Back to Upload
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-12">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">
            Placement Recommendations
          </h2>
          {eventData && (
            <>
              <p className="mt-2 text-lg text-gray-600">
                For {eventData.name} on {eventData.date}
              </p>
              {/* Story 4.14: Frame as signals not prescriptions */}
              <p className="text-sm text-gray-600 max-w-2xl mx-auto mt-2">
                These zones show strong data signals for your event. You maintain full decision authority—use these insights to inform your placement strategy.
              </p>
            </>
          )}
          {/* Story 4.12: Data freshness timestamp */}
          {!isLoading && recommendations.length > 0 && recommendations[0].data_sources.length > 0 && (
            <p className="mt-1 text-sm text-gray-500 flex items-center justify-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M5.75 2a.75.75 0 01.75.75V4h7V2.75a.75.75 0 011.5 0V4h.25A2.75 2.75 0 0118 6.75v8.5A2.75 2.75 0 0115.25 18H4.75A2.75 2.75 0 012 15.25v-8.5A2.75 2.75 0 014.75 4H5V2.75A.75.75 0 015.75 2zm-1 5.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25v-6.5c0-.69-.56-1.25-1.25-1.25H4.75z" clipRule="evenodd" />
              </svg>
              Based on data from {(() => {
                const dataSources = recommendations[0].data_sources
                if (dataSources.length === 0) return 'N/A'
                const mostRecent = dataSources.reduce((latest, source) => {
                  const sourceDate = new Date(source.last_updated)
                  return sourceDate > new Date(latest) ? source.last_updated : latest
                }, dataSources[0].last_updated)
                const date = new Date(mostRecent)
                return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
              })()}
            </p>
          )}
          {/* Story 4.13: Plain language algorithm explanation */}
          <details className="mt-2 text-center">
            <summary className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM8.94 6.94a.75.75 0 11-1.061-1.061 3 3 0 112.871 5.026v.345a.75.75 0 01-1.5 0v-.5c0-.72.57-1.172 1.081-1.287A1.5 1.5 0 108.94 6.94zM10 15a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
              How does this work?
            </summary>
            <div className="mt-4 mx-auto max-w-2xl rounded-lg border border-gray-200 bg-white p-6 text-left shadow-lg">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                How We Recommend Placement Zones
              </h3>

              <div className="space-y-4 text-sm text-gray-700 leading-relaxed">
                <p>
                  We analyze <strong>four key factors</strong> to find the best zones for your event:
                </p>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">
                    1. Audience Match (40% of score)
                  </h4>
                  <p>
                    <strong>Who&apos;s there:</strong> We match your target audience to the people who frequent each zone.
                    Coffee shop event? We look for zones with young professionals who visit cafes.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">
                    2. Timing (30% of score)
                  </h4>
                  <p>
                    <strong>When they&apos;re receptive:</strong> Different times attract different mindsets.
                    Evening commuters are planning weekends. Lunch crowds are browsing.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">
                    3. Distance (20% of score)
                  </h4>
                  <p>
                    <strong>Convenience matters:</strong> Zones closer to your event venue make it easier
                    for people to attend after seeing your poster.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">
                    4. Dwell Time (10% of score)
                  </h4>
                  <p>
                    <strong>Time to notice:</strong> People rushing through see less. Areas where people
                    linger (coffee shops, parks) work better for physical ads.
                  </p>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <p className="font-medium text-gray-900">
                    Your top recommendations score highly across ALL factors, not just one.
                  </p>
                  <p className="mt-1">
                    A zone with 88% audience match and good timing beats a 95% audience match zone with poor timing.
                  </p>
                </div>
              </div>
            </div>
          </details>
        </div>

        {/* Story 6.1: Time Period Toggle */}
        {eventData && !isLoading && recommendations.length > 0 && (
          <div className="mb-6 flex justify-center">
            <TimePeriodToggle
              selectedPeriod={selectedTimePeriod}
              onPeriodChange={handleTimePeriodChange}
            />
          </div>
        )}

        {/* Story 4.8: Event Details Editor for Re-ranking */}
        {eventData && editableEventData && (
          <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900">Event Details</h3>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                {isEditing ? 'Cancel' : 'Edit'}
              </button>
            </div>

            {!isEditing ? (
              // Display mode
              <div className="space-y-2 text-sm text-gray-600">
                <div><span className="font-medium">Event:</span> {eventData.name}</div>
                <div><span className="font-medium">Date:</span> {eventData.date} at {eventData.time}</div>
                <div><span className="font-medium">Audience:</span> {eventData.target_audience.join(', ')}</div>
                <div><span className="font-medium">Type:</span> {eventData.event_type}</div>
              </div>
            ) : (
              // Edit mode
              <div className="space-y-4">
                {/* Target Audience multi-select */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Target Audience
                  </label>
                  <div className="space-y-1">
                    {['Young professionals', 'Families', 'Students', 'Coffee enthusiasts', 'Seniors', 'Local residents'].map(audience => (
                      <label key={audience} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={editableEventData.target_audience.includes(audience)}
                          onChange={(e) => {
                            const updated = e.target.checked
                              ? [...editableEventData.target_audience, audience]
                              : editableEventData.target_audience.filter(a => a !== audience)
                            setEditableEventData({ ...editableEventData, target_audience: updated })
                          }}
                          className="mr-2 h-4 w-4 rounded border-gray-300"
                        />
                        <span className="text-sm text-gray-700">{audience}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Event Type dropdown */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Event Type
                  </label>
                  <select
                    value={editableEventData.event_type || ''}
                    onChange={(e) => setEditableEventData({ ...editableEventData, event_type: e.target.value })}
                    className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                  >
                    <option value="Workshop">Workshop</option>
                    <option value="Concert">Concert</option>
                    <option value="Sale">Sale</option>
                    <option value="Community event">Community event</option>
                    <option value="Nightlife">Nightlife</option>
                    <option value="Sports">Sports</option>
                    <option value="Cultural">Cultural</option>
                  </select>
                </div>

                {/* Update button */}
                <button
                  onClick={handleUpdateRecommendations}
                  disabled={isLoading || editableEventData.target_audience.length === 0}
                  className="w-full rounded-lg bg-blue-600 px-4 py-2 text-white font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Updating...' : 'Update Recommendations'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Story 5.1: Interactive Map */}
        {/* Story 5.3: Zone markers with rank badges */}
        {/* Story 5.4: Venue marker with blue star */}
        {/* Story 5.7: Hover list → highlight map */}
        <div className="mb-8">
          <MapComponent
            className="h-[500px] w-full"
            recommendations={recommendations}
            eventData={eventData}
            hoveredZoneId={hoveredZoneId}
            onZoneHover={(zoneId) => setHoveredZoneId(zoneId)}
            onZoneLeave={() => setHoveredZoneId(null)}
          />
        </div>

        {/* Story 6.6: Recommendations List with Smooth Transitions */}
        {recommendations.length > 0 && eventData && (
          <div className="relative">
            {/* Story 6.6: Loading overlay during time period re-ranking */}
            {isLoading && (
              <div className="absolute inset-0 z-10 bg-white/60 backdrop-blur-sm rounded-lg flex items-center justify-center transition-opacity duration-200">
                <div className="flex flex-col items-center gap-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                  <p className="text-sm font-medium text-gray-700">Re-ranking recommendations...</p>
                </div>
              </div>
            )}

            {/* Story 6.6: Recommendations with fade animation */}
            <div
              className={`space-y-4 transition-opacity duration-200 ${
                isLoading ? 'opacity-40' : 'opacity-100'
              }`}
            >
              {recommendations.map((recommendation, index) => (
                <div
                  key={`${recommendation.zone_id}-${selectedTimePeriod}`}  // Story 6.6: Force re-render on period change
                  className="animate-in fade-in slide-in-from-bottom-1 duration-200 motion-reduce:animate-none"
                >
                  <RecommendationCard
                    ref={(el) => {
                      if (el) {
                        recommendationRefs.current.set(recommendation.zone_id, el)
                      } else {
                        recommendationRefs.current.delete(recommendation.zone_id)
                      }
                    }}
                    recommendation={recommendation}
                    rank={index + 1}
                    eventName={eventData.name}
                    eventDate={eventData.date}
                    onHover={(zoneId) => setHoveredZoneId(zoneId)}
                    onLeave={() => setHoveredZoneId(null)}
                    isHighlighted={hoveredZoneId === recommendation.zone_id}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Initial Loading State (first load only) */}
        {isLoading && recommendations.length === 0 && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse rounded-lg border border-gray-200 bg-white p-6">
                <div className="h-24 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && recommendations.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600">No recommendations found. Try different event details.</p>
            <button
              onClick={() => router.push('/upload')}
              className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
            >
              Try Again
            </button>
          </div>
        )}
      </main>
    </div>
  )
}

export default function RecommendationsPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <RecommendationsContent />
    </Suspense>
  )
}
