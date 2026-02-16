'use client'

import { useState, useEffect, Suspense, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import toast, { Toaster } from 'react-hot-toast'
import RecommendationCard from '@/components/RecommendationCard'
import MapComponent from '@/components/Map'
import ZoneDetailsPanel from '@/components/ZoneDetailsPanel'
import TimePeriodToggle, { type TimePeriod } from '@/components/TimePeriodToggle'
import { getRecommendations, type EventDataForRecommendations, type ZoneRecommendation } from '@/lib/api'
import { getDefaultTimePeriod } from '@/lib/timeUtils'

function RecommendationsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [recommendations, setRecommendations] = useState<ZoneRecommendation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [eventData, setEventData] = useState<EventDataForRecommendations | null>(null)
  const [editableEventData, setEditableEventData] = useState<EventDataForRecommendations | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [hoveredZoneId, setHoveredZoneId] = useState<string | null>(null)
  const recommendationRefs = useRef(new globalThis.Map<string, HTMLDivElement>())
  const [selectedTimePeriod, setSelectedTimePeriod] = useState<TimePeriod>('evening')
  const [selectedZone, setSelectedZone] = useState<{ zone: ZoneRecommendation; rank: number } | null>(null)

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
    }
  }, [])

  useEffect(() => {
    if (!hoveredZoneId) return

    const cardElement = recommendationRefs.current.get(hoveredZoneId)
    if (cardElement) {
      cardElement.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
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
    setEditableEventData(parsedEventData)

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

  const handleUpdateRecommendations = async () => {
    if (!editableEventData) return

    setIsLoading(true)
    setIsEditing(false)

    try {
      toast.loading('Updating recommendations...', { id: 'update' })

      const results = await getRecommendations(editableEventData)
      setRecommendations(results)
      setEventData(editableEventData)

      toast.success(`Updated! Found ${results.length} recommendations`, { id: 'update' })
    } catch (error: any) {
      console.error('Error updating recommendations:', error)
      toast.error('Failed to update recommendations', { id: 'update' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleTimePeriodChange = async (period: TimePeriod) => {
    if (!eventData) return

    setSelectedTimePeriod(period)
    setIsLoading(true)

    try {
      toast.loading(`Re-ranking for ${period}...`, { id: 'rerank' })

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
    } finally {
      setIsLoading(false)
    }
  }

  const handleZoneClick = (zone: ZoneRecommendation, rank: number) => {
    setSelectedZone({ zone, rank })
  }

  return (
    <div className="flex h-screen overflow-hidden relative" style={{ background: '#0f1c24' }}>
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: '#1a2f3a',
            color: '#fff',
            border: '1px solid rgba(74, 222, 128, 0.2)',
          },
          success: {
            iconTheme: {
              primary: '#4ade80',
              secondary: '#1a2f3a',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#1a2f3a',
            },
          },
          loading: {
            iconTheme: {
              primary: '#4ade80',
              secondary: '#1a2f3a',
            },
          },
        }}
      />

      {/* Map Container - Full Width */}
      <div className="absolute inset-0">
        <MapComponent
          className="h-full w-full"
          recommendations={recommendations}
          eventData={eventData}
          hoveredZoneId={hoveredZoneId}
          onZoneHover={(zoneId) => setHoveredZoneId(zoneId)}
          onZoneLeave={() => setHoveredZoneId(null)}
          onZoneClick={handleZoneClick}
        />
      </div>

      {/* Floating Left Sidebar - Zone List */}
      <div
        className="absolute left-6 top-6 bottom-6 w-[480px] rounded-xl shadow-2xl backdrop-blur-xl overflow-hidden animate-in slide-in-from-left duration-300 flex flex-col"
        style={{ background: 'rgba(26, 47, 58, 0.95)', border: '1px solid rgba(74, 222, 128, 0.2)' }}
      >
        {/* Sidebar Header */}
        <div className="p-6 border-b" style={{ borderColor: 'rgba(42, 69, 81, 0.5)' }}>
          <button
            onClick={() => router.push('/upload')}
            className="text-sm mb-4 flex items-center gap-1 transition-colors hover:text-white"
            style={{ color: '#94a3b8' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
            </svg>
            Back
          </button>
          <h1 className="text-2xl font-bold text-white mb-2">
            Find some placement zones.
          </h1>
          {eventData && (
            <p className="text-sm" style={{ color: '#94a3b8' }}>
              For <span className="text-white font-medium">{eventData.name}</span> on {eventData.date}
            </p>
          )}
        </div>

        {/* Time Period Filter */}
        {eventData && !isLoading && recommendations.length > 0 && (
          <div className="px-6 py-4 border-b" style={{ borderColor: 'rgba(42, 69, 81, 0.5)' }}>
            <TimePeriodToggle
              selectedPeriod={selectedTimePeriod}
              onPeriodChange={handleTimePeriodChange}
            />
          </div>
        )}

        {/* Recommendations List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading && recommendations.length === 0 ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse rounded-lg p-4" style={{ background: 'rgba(30, 58, 72, 0.5)' }}>
                  <div className="h-20 rounded" style={{ background: 'rgba(55, 65, 81, 0.5)' }}></div>
                </div>
              ))}
            </div>
          ) : recommendations.length > 0 ? (
            <div className="p-6 space-y-3">
              {recommendations.map((recommendation, index) => (
                <div
                  key={`${recommendation.zone_id}-${selectedTimePeriod}`}
                  ref={(el) => {
                    if (el) {
                      recommendationRefs.current.set(recommendation.zone_id, el)
                    } else {
                      recommendationRefs.current.delete(recommendation.zone_id)
                    }
                  }}
                  onMouseEnter={() => setHoveredZoneId(recommendation.zone_id)}
                  onMouseLeave={() => setHoveredZoneId(null)}
                  onClick={() => handleZoneClick(recommendation, index + 1)}
                  className={`transition-all duration-200 cursor-pointer ${
                    hoveredZoneId === recommendation.zone_id ? 'scale-[1.02]' : ''
                  }`}
                >
                  <RecommendationCard
                    recommendation={recommendation}
                    rank={index + 1}
                    eventName={eventData?.name || ''}
                    eventDate={eventData?.date || ''}
                    onHover={(zoneId) => setHoveredZoneId(zoneId)}
                    onLeave={() => setHoveredZoneId(null)}
                    isHighlighted={hoveredZoneId === recommendation.zone_id}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center">
              <p style={{ color: '#94a3b8' }}>No recommendations found.</p>
            </div>
          )}
        </div>

        {/* Sidebar Footer */}
        {recommendations.length > 0 && (
          <div className="p-6 border-t" style={{ borderColor: 'rgba(42, 69, 81, 0.5)' }}>
            <p className="text-sm" style={{ color: '#94a3b8' }}>
              Showing <span style={{ color: '#4ade80' }} className="font-semibold">{recommendations.length}</span> total {recommendations.length === 1 ? 'zone' : 'zones'}.
            </p>
          </div>
        )}
      </div>

      {/* Right Sidebar - Zone Details */}
      {selectedZone && (
        <div
          className="absolute right-0 top-0 bottom-0 w-96 shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300"
          style={{ background: '#1a2f3a', borderLeft: '1px solid #2a4551' }}
        >
          <div className="p-6">
            <ZoneDetailsPanel
              zone={selectedZone.zone}
              rank={selectedZone.rank}
              onClose={() => setSelectedZone(null)}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default function RecommendationsPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center" style={{ background: '#0f1c24' }}>
        <div className="text-white">Loading...</div>
      </div>
    }>
      <RecommendationsContent />
    </Suspense>
  )
}
