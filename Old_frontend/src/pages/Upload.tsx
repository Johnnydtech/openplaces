/**
 * Upload Page - Complete Rebuild (CAASie.co Style)
 * Fixed sidebar + full map layout
 */

import { useState, useRef } from 'react'
import { Upload as UploadIcon, X, MapPin, Calendar, Clock, Users } from 'lucide-react'
import { analyzeFlyer, EventExtraction } from '../api/analyze'
import { getTopRecommendations, EventData, ZoneRecommendation } from '../api/recommendations'
import { geocodeVenue } from '../api/geocoding'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export default function Upload() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [extractedData, setExtractedData] = useState<EventExtraction | null>(null)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [recommendations, setRecommendations] = useState<ZoneRecommendation[]>([])
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false)
  const [venueCoordinates, setVenueCoordinates] = useState<{lat: number, lon: number} | null>(null)
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // File validation
  const validateFile = (file: File): string | null => {
    if (file.size > MAX_FILE_SIZE) {
      return 'File too large. Maximum size is 10MB.'
    }
    if (!file.type.match(/^image\/(jpeg|png)$/)) {
      return 'Invalid format. Please upload JPG or PNG.'
    }
    return null
  }

  // Handle file selection
  const handleFileSelect = (file: File) => {
    const error = validateFile(file)
    if (error) {
      setError(error)
      return
    }

    setSelectedFile(file)
    setError(null)

    // Auto-analyze
    handleAnalyze(file)
  }

  // Handle drag and drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const file = e.dataTransfer.files[0]
    if (file) handleFileSelect(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  // Analyze flyer
  const handleAnalyze = async (file: File) => {
    setIsAnalyzing(true)
    setError(null)

    try {
      const data = await analyzeFlyer(file)
      setExtractedData(data)
      setShowConfirmation(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed')
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Confirm and get recommendations
  const handleConfirm = async () => {
    if (!extractedData) return

    setIsLoadingRecommendations(true)
    setError(null)

    try {
      // Geocode venue
      const coords = await geocodeVenue(extractedData.venue)
      setVenueCoordinates({ lat: coords.latitude, lon: coords.longitude })

      // Get recommendations
      const eventData: EventData = {
        name: extractedData.event_name,
        date: extractedData.event_date,
        time: extractedData.event_time,
        venue: extractedData.venue,
        venue_lat: coords.latitude,
        venue_lon: coords.longitude,
        target_audience: extractedData.target_audience,
      }

      const recs = await getTopRecommendations(eventData, 10)
      setRecommendations(recs)
      setShowConfirmation(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get recommendations')
    } finally {
      setIsLoadingRecommendations(false)
    }
  }

  // Format distance
  const formatDistance = (miles: number) => {
    if (miles < 0.1) return '< 0.1 mi'
    return `${miles.toFixed(1)} mi`
  }

  // Format cost
  const formatCost = (tier: string) => {
    const costs = { free: '$0', low: '$', medium: '$$', high: '$$$' }
    return costs[tier.toLowerCase() as keyof typeof costs] || tier
  }

  return (
    <div className="flex h-screen bg-[#0d2833] overflow-hidden">
      {/* LEFT SIDEBAR - 280px fixed */}
      <div className="w-[280px] flex-shrink-0 bg-[#0d2833] border-r border-white/5 flex flex-col">
        {/* Header */}
        <div className="px-4 py-5 border-b border-white/5">
          <h1 className="text-lg font-bold text-white mb-1">
            Find placement <span className="text-[#76ff03]">zones.</span>
          </h1>
          <p className="text-xs text-gray-400">Upload your event flyer to start</p>
        </div>

        {/* Upload Section */}
        {!recommendations.length && (
          <div className="px-4 py-4 border-b border-white/5">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png"
              onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
              className="hidden"
            />

            {!selectedFile ? (
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={`
                  border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
                  transition-all duration-200
                  ${isDragging
                    ? 'border-[#76ff03] bg-[#76ff03]/5'
                    : 'border-white/10 hover:border-white/20 hover:bg-white/5'
                  }
                `}
              >
                <UploadIcon className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-300 mb-1">Drop flyer here</p>
                <p className="text-xs text-gray-500">or click to browse</p>
              </div>
            ) : (
              <div className="bg-[#12313e] rounded-lg p-3 border border-white/5">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-[#76ff03]/10 rounded flex items-center justify-center flex-shrink-0">
                    <UploadIcon className="w-5 h-5 text-[#76ff03]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium truncate">{selectedFile.name}</p>
                    <p className="text-xs text-gray-500">{(selectedFile.size / 1024).toFixed(0)} KB</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedFile(null)
                      setExtractedData(null)
                      setShowConfirmation(false)
                    }}
                    className="text-gray-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {isAnalyzing && (
                  <div className="mt-3 pt-3 border-t border-white/5">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-[#76ff03] border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs text-gray-400">Analyzing flyer...</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {error && (
              <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-xs text-red-400">{error}</p>
              </div>
            )}
          </div>
        )}

        {/* Event Confirmation */}
        {showConfirmation && extractedData && (
          <div className="flex-1 overflow-y-auto px-4 py-4">
            <div className="space-y-3">
              <div>
                <label className="text-[10px] uppercase tracking-wider text-gray-500 block mb-1">Event Name</label>
                <p className="text-sm text-white">{extractedData.event_name}</p>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-gray-500 block mb-1">Date & Time</label>
                <p className="text-sm text-white">{extractedData.event_date} • {extractedData.event_time}</p>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-gray-500 block mb-1">Venue</label>
                <p className="text-sm text-white">{extractedData.venue}</p>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-gray-500 block mb-1">Target Audience</label>
                <div className="flex flex-wrap gap-1">
                  {extractedData.target_audience.map((audience, i) => (
                    <span key={i} className="px-2 py-0.5 bg-[#76ff03]/10 border border-[#76ff03]/20 rounded text-xs text-[#76ff03]">
                      {audience}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={handleConfirm}
              disabled={isLoadingRecommendations}
              className="w-full mt-4 px-4 py-2.5 bg-[#76ff03] text-[#0d2833] rounded-lg font-semibold text-sm hover:bg-[#7cff00] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoadingRecommendations ? 'Finding zones...' : 'Get Recommendations'}
            </button>
          </div>
        )}

        {/* Recommendations List */}
        {recommendations.length > 0 && (
          <div className="flex-1 overflow-y-auto px-4 py-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs uppercase tracking-wider text-gray-500">
                {recommendations.length} zones found
              </span>
              <button
                onClick={() => {
                  setRecommendations([])
                  setSelectedFile(null)
                  setExtractedData(null)
                }}
                className="text-xs text-[#76ff03] hover:text-[#7cff00]"
              >
                Start over
              </button>
            </div>

            <div className="space-y-2">
              {recommendations.map((rec, index) => (
                <button
                  key={rec.zone_id}
                  onClick={() => setSelectedZoneId(rec.zone_id)}
                  className={`
                    w-full text-left p-3 rounded-lg border transition-all
                    ${selectedZoneId === rec.zone_id
                      ? 'bg-[#12313e] border-[#76ff03]/30'
                      : 'bg-[#0f2936] border-white/5 hover:border-white/10'
                    }
                  `}
                >
                  {/* Rank Badge */}
                  <div className="flex items-start gap-3">
                    <div className={`
                      w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
                      ${index < 3 ? 'bg-[#76ff03] text-[#0d2833]' : 'bg-white/10 text-gray-400'}
                    `}>
                      {index + 1}
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Zone Name */}
                      <h3 className="text-sm font-semibold text-white mb-1 truncate">
                        {rec.zone_name}
                      </h3>

                      {/* Key Metrics */}
                      <div className="flex items-center gap-4 mb-2">
                        {/* SCORE - Prominent like CAASie pricing */}
                        <div>
                          <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-bold text-[#76ff03]">
                              {rec.total_score.toFixed(0)}
                            </span>
                            <span className="text-sm text-gray-500">/100</span>
                          </div>
                          <span className="text-[8px] uppercase tracking-wider text-gray-500">SCORE</span>
                        </div>

                        {/* Secondary Metrics */}
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <span>{formatDistance(rec.distance_miles)}</span>
                          <span>•</span>
                          <span>{formatCost(rec.cost_tier)}</span>
                        </div>
                      </div>

                      {/* Timing */}
                      {rec.timing_windows.length > 0 && (
                        <p className="text-[10px] text-gray-500">
                          {rec.timing_windows[0].days} • {rec.timing_windows[0].hours}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* RIGHT SIDE - MAP */}
      <div className="flex-1 relative bg-gray-200">
        {/* Placeholder map - will integrate MapView component */}
        <div className="absolute inset-0 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <MapPin className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Map will appear here</p>
          </div>
        </div>

        {/* Event Details Overlay (when recommendations loaded) */}
        {venueCoordinates && extractedData && (
          <div className="absolute top-4 right-4 w-80 bg-[#0d2833] border border-white/10 rounded-lg p-4 shadow-2xl">
            <h3 className="text-sm font-bold text-white mb-3">{extractedData.event_name}</h3>

            <div className="space-y-2 text-xs">
              <div className="flex items-start gap-2">
                <Calendar className="w-3.5 h-3.5 text-[#76ff03] flex-shrink-0 mt-0.5" />
                <span className="text-gray-300">{extractedData.event_date}</span>
              </div>
              <div className="flex items-start gap-2">
                <Clock className="w-3.5 h-3.5 text-[#76ff03] flex-shrink-0 mt-0.5" />
                <span className="text-gray-300">{extractedData.event_time}</span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-[#76ff03] flex-shrink-0 mt-0.5" />
                <span className="text-gray-300">{extractedData.venue}</span>
              </div>
              <div className="flex items-start gap-2">
                <Users className="w-3.5 h-3.5 text-[#76ff03] flex-shrink-0 mt-0.5" />
                <span className="text-gray-300">{extractedData.target_audience.join(', ')}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
