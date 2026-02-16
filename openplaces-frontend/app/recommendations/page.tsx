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
  const [editableEventData, setEditableEventData] = useState<EventDataForRecommendations | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [hoveredZoneId, setHoveredZoneId] = useState<string | null>(null)
  const recommendationRefs = useRef(new globalThis.Map<string, HTMLDivElement>())
  const [selectedTimePeriod, setSelectedTimePeriod] = useState<TimePeriod>('evening')

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

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#0f1c24' }}>
      <Toaster position="top-center" />

      {/* Sidebar */}
      <div className="w-96 flex flex-col" style={{ background: '#1a2f3a' }}>
        {/* Sidebar Header */}
        <div className="p-6 border-b" style={{ borderColor: '#2a4551' }}>
          <button
            onClick={() => router.push('/upload')}
            className="text-gray-400 hover:text-white text-sm mb-4 flex items-center gap-1"
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
          <div className="px-6 py-4 border-b" style={{ borderColor: '#2a4551' }}>
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
                <div key={i} className="animate-pulse rounded-lg p-4" style={{ background: '#1e3a48' }}>
                  <div className="h-20 bg-gray-700 rounded"></div>
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
              <p className="text-gray-400">No recommendations found.</p>
            </div>
          )}
        </div>

        {/* Sidebar Footer */}
        {recommendations.length > 0 && (
          <div className="p-6 border-t" style={{ borderColor: '#2a4551' }}>
            <p className="text-sm" style={{ color: '#94a3b8' }}>
              Showing <span style={{ color: '#4ade80' }} className="font-semibold">{recommendations.length}</span> total {recommendations.length === 1 ? 'zone' : 'zones'}.
            </p>
          </div>
        )}
      </div>

      {/* Map Container */}
      <div className="flex-1 relative">
        <MapComponent
          className="h-full w-full"
          recommendations={recommendations}
          eventData={eventData}
          hoveredZoneId={hoveredZoneId}
          onZoneHover={(zoneId) => setHoveredZoneId(zoneId)}
          onZoneLeave={() => setHoveredZoneId(null)}
        />

        {/* Floating Info Panel */}
        {eventData && recommendations.length > 0 && (
          <div
            className="absolute bottom-8 left-8 rounded-lg p-4 shadow-2xl"
            style={{ background: '#1e3a48', maxWidth: '400px' }}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="#4ade80" className="w-5 h-5">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-white mb-1">
                  This is a preview of all my favorite zones
                </p>
                <p className="text-xs" style={{ color: '#94a3b8' }}>
                  These recommendations are based on data signals. You maintain full decision authority.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
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
