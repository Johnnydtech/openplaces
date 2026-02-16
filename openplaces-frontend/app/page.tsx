'use client'

import { useState, useEffect, useRef } from 'react'
import { useUser, useClerk } from '@clerk/nextjs'
import toast, { Toaster } from 'react-hot-toast'
import MapComponent from '@/components/Map'
import UploadZone from '@/components/UploadZone'
import EventConfirmation from '@/components/EventConfirmation'
import RecommendationCard from '@/components/RecommendationCard'
import ZoneDetailsPanel from '@/components/ZoneDetailsPanel'
import TimePeriodToggle, { type TimePeriod } from '@/components/TimePeriodToggle'
import { analyzeFlyer, geocodeVenue, getRecommendations, getSavedRecommendations, type EventDataForRecommendations, type ZoneRecommendation, type SavedRecommendation } from '@/lib/api'
import { getDefaultTimePeriod } from '@/lib/timeUtils'

type UploadState = 'idle' | 'uploading' | 'analyzing' | 'confirming' | 'geocoding' | 'complete'

export default function UnifiedHomePage() {
  const { user, isLoaded, isSignedIn } = useUser()
  const { signOut } = useClerk()

  // Upload state
  const [uploadState, setUploadState] = useState<UploadState>('idle')
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [extractedData, setExtractedData] = useState<any>(null)
  const [editableEventData, setEditableEventData] = useState<any>(null)

  // Recommendations state
  const [recommendations, setRecommendations] = useState<ZoneRecommendation[]>([])
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false)
  const [eventData, setEventData] = useState<EventDataForRecommendations | null>(null)
  const [selectedTimePeriod, setSelectedTimePeriod] = useState<TimePeriod>('evening')

  // Map state
  const [hoveredZoneId, setHoveredZoneId] = useState<string | null>(null)
  const [selectedZone, setSelectedZone] = useState<{ zone: ZoneRecommendation; rank: number } | null>(null)
  const recommendationRefs = useRef(new Map<string, HTMLDivElement>())

  // History state
  const [savedRecommendations, setSavedRecommendations] = useState<SavedRecommendation[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)

  // Load saved recommendations history
  useEffect(() => {
    if (isSignedIn && user) {
      loadHistory()
    }
  }, [isSignedIn, user])

  const loadHistory = async () => {
    if (!user) return
    setIsLoadingHistory(true)
    try {
      const history = await getSavedRecommendations(user.id)
      setSavedRecommendations(history)
    } catch (error) {
      console.error('Error loading history:', error)
    } finally {
      setIsLoadingHistory(false)
    }
  }

  // Handle file upload
  const handleFileUpload = async (file: File) => {
    setUploadedFile(file)
    setUploadState('analyzing')

    try {
      toast.loading('Analyzing flyer...', { id: 'analyze' })
      const response = await analyzeFlyer(file)

      if (response.success && response.data) {
        setExtractedData(response.data)
        setEditableEventData(response.data)
        setUploadState('confirming')
        toast.success('Flyer analyzed!', { id: 'analyze' })
      } else {
        throw new Error('Failed to extract data')
      }
    } catch (error: any) {
      console.error('Error analyzing flyer:', error)
      toast.error('Failed to analyze flyer', { id: 'analyze' })
      setUploadState('idle')
    }
  }

  // Handle event confirmation
  const handleEventConfirm = async (confirmedData: any) => {
    setUploadState('geocoding')

    try {
      // Geocode venue
      toast.loading('Finding venue location...', { id: 'geocode' })
      const geocodeResult = await geocodeVenue(confirmedData.venue_address)

      const eventDataForRecommendations: EventDataForRecommendations = {
        name: confirmedData.event_name,
        date: confirmedData.event_date,
        time: confirmedData.event_time,
        venue_lat: geocodeResult.latitude,
        venue_lon: geocodeResult.longitude,
        target_audience: confirmedData.target_audience,
        event_type: confirmedData.event_type
      }

      setEventData(eventDataForRecommendations)

      // Get default time period
      const defaultPeriod = getDefaultTimePeriod(confirmedData.event_date, confirmedData.event_time)
      setSelectedTimePeriod(defaultPeriod)

      // Get recommendations (this will show success toast)
      await fetchRecommendations(eventDataForRecommendations)
      setUploadState('complete')
    } catch (error: any) {
      console.error('Error processing event:', error)
      toast.error('Failed to process event', { id: 'geocode' })
      setUploadState('confirming')
    }
  }

  // Fetch recommendations
  const fetchRecommendations = async (eventDataParam: EventDataForRecommendations) => {
    setIsLoadingRecommendations(true)
    try {
      // Dismiss any lingering toasts
      toast.dismiss('geocode')
      toast.loading('Generating recommendations...', { id: 'recommendations' })
      const results = await getRecommendations(eventDataParam)
      setRecommendations(results)
      toast.success(`Found ${results.length} OpenPlaces!`, { id: 'recommendations' })
    } catch (error: any) {
      console.error('Error fetching recommendations:', error)
      toast.error('Failed to generate recommendations', { id: 'recommendations' })
    } finally {
      setIsLoadingRecommendations(false)
    }
  }

  // Handle time period change
  const handleTimePeriodChange = async (period: TimePeriod) => {
    if (!eventData) return

    setSelectedTimePeriod(period)
    setIsLoadingRecommendations(true)

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
      console.error('Error re-ranking:', error)
      toast.error('Failed to re-rank recommendations', { id: 'rerank' })
    } finally {
      setIsLoadingRecommendations(false)
    }
  }

  // Handle zone click
  const handleZoneClick = (zone: ZoneRecommendation, rank: number) => {
    setSelectedZone({ zone, rank })
    // Pass zoom command to map via state
    setZoomToZone({ lat: zone.latitude, lon: zone.longitude, zoneId: zone.zone_id })
  }

  // State for triggering map zoom to specific zone
  const [zoomToZone, setZoomToZone] = useState<{ lat: number; lon: number; zoneId: string } | null>(null)

  // Reset to upload new flyer
  const handleNewUpload = () => {
    setUploadState('idle')
    setUploadedFile(null)
    setExtractedData(null)
    setEditableEventData(null)
    setRecommendations([])
    setEventData(null)
    setSelectedZone(null)
  }

  // Scroll to recommendation on hover
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

      {/* Full-Screen Map */}
      <div className="absolute inset-0">
        <MapComponent
          className="h-full w-full"
          recommendations={recommendations}
          eventData={eventData}
          hoveredZoneId={hoveredZoneId}
          onZoneHover={(zoneId) => setHoveredZoneId(zoneId)}
          onZoneLeave={() => setHoveredZoneId(null)}
          onZoneClick={handleZoneClick}
          zoomToLocation={zoomToZone}
        />
      </div>

      {/* Left Sidebar - Upload & Recommendations */}
      <div
        className="absolute left-6 top-6 bottom-6 w-[480px] rounded-xl shadow-2xl backdrop-blur-xl overflow-hidden animate-in slide-in-from-left duration-300 flex flex-col"
        style={{ background: 'rgba(26, 47, 58, 0.95)', border: '1px solid rgba(74, 222, 128, 0.2)' }}
      >
        {/* Sidebar Header */}
        <div className="p-6 border-b" style={{ borderColor: 'rgba(42, 69, 81, 0.5)' }}>
          <div className="flex items-start justify-between mb-2">
            <h1 className="text-2xl font-bold text-white">
              Find OpenPlaces.
            </h1>
            {isSignedIn && user && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-1 rounded-full" style={{ background: 'rgba(74, 222, 128, 0.1)' }}>
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: '#4ade80', color: '#0f1c24' }}>
                    {user.firstName?.[0] || user.emailAddresses[0]?.emailAddress[0].toUpperCase()}
                  </div>
                  <span className="text-xs font-medium" style={{ color: '#4ade80' }}>
                    {user.firstName || 'User'}
                  </span>
                </div>
                <button
                  onClick={() => signOut()}
                  className="p-1.5 rounded-lg transition-colors"
                  style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                  title="Sign out"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path fillRule="evenodd" d="M3 4.25A2.25 2.25 0 015.25 2h5.5A2.25 2.25 0 0113 4.25v2a.75.75 0 01-1.5 0v-2a.75.75 0 00-.75-.75h-5.5a.75.75 0 00-.75.75v11.5c0 .414.336.75.75.75h5.5a.75.75 0 00.75-.75v-2a.75.75 0 011.5 0v2A2.25 2.25 0 0110.75 18h-5.5A2.25 2.25 0 013 15.75V4.25z" clipRule="evenodd" />
                    <path fillRule="evenodd" d="M19 10a.75.75 0 00-.75-.75H8.704l1.048-.943a.75.75 0 10-1.004-1.114l-2.5 2.25a.75.75 0 000 1.114l2.5 2.25a.75.75 0 101.004-1.114l-1.048-.943h9.546A.75.75 0 0019 10z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            )}
          </div>
          <p className="text-sm" style={{ color: '#94a3b8' }}>
            Upload a flyer to discover the best billboard locations
          </p>
        </div>

        {/* Upload Section */}
        {uploadState === 'idle' && (
          <div className="p-6">
            <UploadZone onFileSelect={handleFileUpload} isUploading={false} />
          </div>
        )}

        {/* Event Confirmation */}
        {uploadState === 'confirming' && extractedData && (
          <div className="p-6 overflow-y-auto flex-1">
            <EventConfirmation
              data={extractedData}
              onGetRecommendations={handleEventConfirm}
              onUpdate={(updatedData) => {
                setExtractedData(updatedData)
                // Update map preview when venue is geocoded
                if (updatedData.latitude && updatedData.longitude) {
                  setEventData({
                    name: updatedData.event_name,
                    date: updatedData.event_date,
                    time: updatedData.event_time,
                    venue_lat: updatedData.latitude,
                    venue_lon: updatedData.longitude,
                    target_audience: updatedData.target_audience,
                    event_type: updatedData.event_type || 'Community event'
                  })
                }
              }}
            />
          </div>
        )}

        {/* Loading State */}
        {(uploadState === 'analyzing' || uploadState === 'geocoding' || (isLoadingRecommendations && recommendations.length === 0)) && (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 mx-auto mb-4" style={{ borderColor: 'rgba(74, 222, 128, 0.2)', borderTopColor: '#4ade80' }}></div>
              <p className="text-sm text-white">
                {uploadState === 'analyzing' ? 'Analyzing flyer...' : uploadState === 'geocoding' ? 'Finding venue...' : 'Generating recommendations...'}
              </p>
            </div>
          </div>
        )}

        {/* Recommendations List */}
        {uploadState === 'complete' && recommendations.length > 0 && (
          <>
            {/* Time Period Filter */}
            <div className="px-6 py-4 border-b" style={{ borderColor: 'rgba(42, 69, 81, 0.5)' }}>
              <TimePeriodToggle
                selectedPeriod={selectedTimePeriod}
                onPeriodChange={handleTimePeriodChange}
              />
            </div>

            {/* Results Header */}
            <div className="px-6 py-3 border-b flex items-center justify-between" style={{ borderColor: 'rgba(42, 69, 81, 0.5)' }}>
              <div>
                <p className="text-sm font-semibold text-white">
                  {recommendations.length} OpenPlaces found
                </p>
                {eventData && (
                  <p className="text-xs" style={{ color: '#94a3b8' }}>
                    For {eventData.name}
                  </p>
                )}
              </div>
              <button
                onClick={handleNewUpload}
                className="text-xs px-3 py-1.5 rounded-lg transition-colors"
                style={{ background: 'rgba(74, 222, 128, 0.1)', color: '#4ade80' }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(74, 222, 128, 0.2)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(74, 222, 128, 0.1)'}
              >
                New Search
              </button>
            </div>

            {/* Zones List */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
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
          </>
        )}

        {/* History Section */}
        {uploadState === 'idle' && isSignedIn && (
          <div className="flex-1 overflow-y-auto p-6">
            <h2 className="text-lg font-bold text-white mb-4">Recent Searches</h2>
            {isLoadingHistory ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-4 mx-auto" style={{ borderColor: 'rgba(74, 222, 128, 0.2)', borderTopColor: '#4ade80' }}></div>
              </div>
            ) : savedRecommendations.length > 0 ? (
              <div className="space-y-3">
                {savedRecommendations.slice(0, 10).map((saved) => (
                  <div
                    key={saved.id}
                    className="rounded-lg p-3 cursor-pointer transition-colors"
                    style={{ background: 'rgba(30, 58, 72, 0.5)' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(30, 58, 72, 0.7)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(30, 58, 72, 0.5)'}
                  >
                    <p className="text-sm font-semibold text-white">{saved.zone_name}</p>
                    <p className="text-xs mt-1" style={{ color: '#94a3b8' }}>
                      {saved.event_name} • {saved.event_date}
                    </p>
                    {saved.notes && (
                      <p className="text-xs mt-1" style={{ color: '#94a3b8' }}>
                        {saved.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-center py-8" style={{ color: '#94a3b8' }}>
                No saved places yet. Upload a flyer to get started!
              </p>
            )}
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

      {/* Bottom Auth Bar - Only if not signed in */}
      {isLoaded && !isSignedIn && (
        <div
          className="fixed bottom-0 left-0 right-0 p-5 backdrop-blur-xl border-t shadow-2xl"
          style={{
            background: 'rgba(26, 47, 58, 0.98)',
            borderColor: 'rgba(74, 222, 128, 0.3)',
            zIndex: 2000,
            boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.5)'
          }}
        >
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(74, 222, 128, 0.2)' }}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5" style={{ color: '#4ade80' }}>
                  <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-white">
                  Sign in to unlock all features
                </p>
                <p className="text-xs" style={{ color: '#94a3b8' }}>
                  Save your favorite places and access your search history
                </p>
              </div>
            </div>
            <div className="flex gap-3 flex-shrink-0">
              <a
                href="/sign-in"
                className="px-6 py-2.5 rounded-lg text-sm font-semibold transition-all border-2"
                style={{
                  background: 'transparent',
                  color: '#4ade80',
                  borderColor: '#4ade80'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(74, 222, 128, 0.1)'
                  e.currentTarget.style.transform = 'translateY(-1px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                Log In
              </a>
              <a
                href="/sign-up"
                className="px-6 py-2.5 rounded-lg text-sm font-semibold transition-all"
                style={{
                  background: '#4ade80',
                  color: '#0f1c24',
                  boxShadow: '0 4px 12px rgba(74, 222, 128, 0.3)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#22c55e'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(74, 222, 128, 0.4)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#4ade80'
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(74, 222, 128, 0.3)'
                }}
              >
                Sign Up Free
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
