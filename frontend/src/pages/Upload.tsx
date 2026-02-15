/**
 * Story 3.1: Flyer Image Upload Interface
 * Story 3.3: Display Extracted Event Details for Confirmation
 * Story 3.4: Manual Event Detail Entry
 * Story 3.10: File Upload Error Handling
 * Upload page with drag-and-drop for event flyer analysis
 */

import { useState, useRef, DragEvent, ChangeEvent } from 'react'
import { analyzeFlyer, EventExtraction } from '../api/analyze'
import { getTopRecommendations, EventData, ZoneRecommendation } from '../api/recommendations'
import { geocodeVenue, GeocodingError } from '../api/geocoding'
import EventConfirmation from '../components/EventConfirmation'
import RecommendationsList from '../components/RecommendationsList'
import ManualEventForm, { EventData as ManualEventData } from '../components/ManualEventForm'
import MapView from '../components/MapView'
import TimePeriodToggle, { TimePeriod } from '../components/TimePeriodToggle'
import './Upload.css'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ACCEPTED_FORMATS = ['image/jpeg', 'image/png', 'application/pdf']
const ACCEPTED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.pdf']

interface UploadError {
  message: string
  type: 'size' | 'format' | 'upload'
}

export default function Upload() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<UploadError | null>(null)
  const [uploadProgress, setUploadProgress] = useState<number>(0)
  const [isUploading, setIsUploading] = useState(false)
  const [extractedData, setExtractedData] = useState<EventExtraction | null>(null)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [recommendations, setRecommendations] = useState<ZoneRecommendation[]>([])
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false)
  const [recommendationsError, setRecommendationsError] = useState<string | null>(null)
  const [showRecommendations, setShowRecommendations] = useState(false)
  const [venueCoordinates, setVenueCoordinates] = useState<{lat: number, lon: number} | null>(null)
  const [eventType] = useState<string>('community-event')
  const [isAuthenticated] = useState(false)  // TODO: integrate with Clerk auth (Story 2.x)
  const [showManualForm, setShowManualForm] = useState(false)  // Story 3.4, 3.10
  const [highlightedZoneId, setHighlightedZoneId] = useState<string | null>(null)  // Story 5.7, 5.8
  const [selectedTimePeriod, setSelectedTimePeriod] = useState<TimePeriod>('evening')  // Story 6.1
  const [eventTime, setEventTime] = useState<string | null>(null)  // Story 6.5
  const [isReranking, setIsReranking] = useState(false)  // Story 6.3, 6.6
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFile = (file: File): UploadError | null => {
    // Story 3.1 AC: File validation (max 10MB, JPG/PNG/PDF only)
    if (file.size > MAX_FILE_SIZE) {
      return {
        message: 'File is too large. Maximum size is 10MB. Please compress your image.',
        type: 'size'
      }
    }

    if (!ACCEPTED_FORMATS.includes(file.type)) {
      return {
        message: 'File type not supported. Please upload JPG, PNG, or PDF.',
        type: 'format'
      }
    }

    return null
  }

  const handleFileSelect = (file: File) => {
    setError(null)

    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      return
    }

    setSelectedFile(file)

    // Story 3.1 AC: Instant preview
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string)
      }
      reader.readAsDataURL(file)
    } else {
      // PDF preview placeholder
      setPreviewUrl(null)
    }
  }

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleChooseFile = () => {
    fileInputRef.current?.click()
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setIsUploading(true)
    setUploadProgress(0)
    setError(null)

    try {
      // Story 3.1 AC: Upload progress indicator
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      // Story 3.2 AC: Call backend /api/analyze endpoint
      const data = await analyzeFlyer(selectedFile)

      clearInterval(progressInterval)
      setUploadProgress(100)

      // Story 3.3 AC: Show extracted event details for confirmation
      setExtractedData(data)
      setShowConfirmation(true)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed. Please try again.'

      // Story 3.10 AC: User-friendly error messages
      setError({
        message: errorMessage.includes('unavailable')
          ? 'AI extraction unavailable. Please enter event details manually.'
          : errorMessage,
        type: 'upload'
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleReset = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
    setError(null)
    setUploadProgress(0)
    setIsUploading(false)
    setExtractedData(null)
    setShowConfirmation(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Story 6.2, 6.3: Adjust scores based on time period and re-rank
  const handleTimePeriodChange = (period: TimePeriod) => {
    setIsReranking(true)  // Story 6.6: Trigger transition
    setSelectedTimePeriod(period)

    // Story 6.2 AC: Simulate brief recalculation (completes within 200ms)
    setTimeout(() => {
      // Adjust temporal scores based on time period
      const adjustedRecs = recommendations.map(rec => {
        let temporalBoost = 0

        // Story 6.2 AC: Boost zones that match the selected time period
        rec.timing_windows?.forEach(window => {
          const hours = window.hours.toLowerCase()

          if (period === 'morning' && (hours.includes('6') || hours.includes('7') || hours.includes('8') || hours.includes('9') || hours.includes('10'))) {
            temporalBoost = 5
          } else if (period === 'lunch' && (hours.includes('11') || hours.includes('12') || hours.includes('1') || hours.includes('2'))) {
            temporalBoost = 5
          } else if (period === 'evening' && (hours.includes('5') || hours.includes('6') || hours.includes('7') || hours.includes('8') || hours.includes('9'))) {
            temporalBoost = 5
          }
        })

        return {
          ...rec,
          temporal_score: Math.min(30, rec.temporal_score + temporalBoost),
          total_score: Math.min(100, rec.total_score + temporalBoost)
        }
      })

      // Story 6.3 AC: Re-rank based on new scores
      const reranked = [...adjustedRecs].sort((a, b) => b.total_score - a.total_score)
      setRecommendations(reranked)
      setIsReranking(false)  // Story 6.6: End transition
    }, 200)
  }

  const handleConfirm = async (data: EventExtraction) => {
    // Story 4.3: After event confirmation, fetch recommendations
    setIsLoadingRecommendations(true)
    setRecommendationsError(null)

    try {
      // Story 3.6: Geocode venue address
      let coordinates = venueCoordinates
      if (!coordinates) {
        console.log('Geocoding venue:', data.venue)
        const geocodeResult = await geocodeVenue(data.venue)
        coordinates = { lat: geocodeResult.latitude, lon: geocodeResult.longitude }
        setVenueCoordinates(coordinates)
      }

      // Story 4.3: Build EventData for recommendations API
      const eventData: EventData = {
        name: data.event_name,
        date: data.event_date,
        time: data.event_time,
        venue_lat: coordinates.lat,
        venue_lon: coordinates.lon,
        target_audience: data.target_audience,
        event_type: eventType, // From event type dropdown (Story 3.8)
      }

      // Story 4.3 AC: Fetch top recommendations (10 for auth, 3 for anonymous)
      const limit = isAuthenticated ? 10 : 3
      console.log(`Fetching top ${limit} recommendations...`)
      const zones = await getTopRecommendations(eventData, limit)

      console.log(`Got ${zones.length} recommendations`)
      setRecommendations(zones)
      setEventTime(data.event_time)  // Story 6.5: Store event time for smart default
      setShowRecommendations(true)
      setShowConfirmation(false)
    } catch (error) {
      console.error('Error generating recommendations:', error)

      if (error instanceof GeocodingError) {
        setRecommendationsError(`Venue location error: ${error.message}`)
      } else if (error instanceof Error) {
        setRecommendationsError(error.message)
      } else {
        setRecommendationsError('Unable to generate recommendations. Please try again.')
      }
    } finally {
      setIsLoadingRecommendations(false)
    }
  }

  const handleCancel = () => {
    // Return to upload screen
    setShowConfirmation(false)
    setExtractedData(null)
  }

  const handleRetryRecommendations = () => {
    if (extractedData) {
      handleConfirm(extractedData)
    }
  }

  // Story 3.4, 3.10 AC: Handle manual event entry
  const handleManualSubmit = async (manualData: ManualEventData) => {
    setIsLoadingRecommendations(true)
    setRecommendationsError(null)

    try {
      // Geocode venue
      const geocodeResult = await geocodeVenue(manualData.venue)
      const coordinates = { lat: geocodeResult.latitude, lon: geocodeResult.longitude }
      setVenueCoordinates(coordinates)

      // Build EventData for recommendations
      const eventData: EventData = {
        name: manualData.name,
        date: manualData.date,
        time: manualData.time,
        venue: manualData.venue,
        latitude: geocodeResult.latitude,
        longitude: geocodeResult.longitude,
        target_audience: manualData.target_audience,
        event_type: manualData.event_type
      }

      // Get recommendations
      const recs = await getTopRecommendations(eventData, isAuthenticated)
      setRecommendations(recs)
      setShowManualForm(false)
      setShowRecommendations(true)
    } catch (err) {
      if (err instanceof GeocodingError) {
        setRecommendationsError(err.message)
      } else {
        setRecommendationsError('Failed to get recommendations. Please try again.')
      }
    } finally {
      setIsLoadingRecommendations(false)
    }
  }

  // Story 4.3 + Epic 5 + Epic 6: Show RecommendationsList with Map and Time Toggle
  if (showRecommendations) {
    return (
      <div className="upload-page">
        <div className="recommendations-view">
          {/* Story 5.1-5.10: Interactive Map View */}
          <div className="map-section">
            <MapView
              recommendations={recommendations}
              venueCoordinates={venueCoordinates}
              highlightedZoneId={highlightedZoneId}
              onZoneClick={(zoneId) => {
                // Story 5.5: Click zone marker to highlight in list
                setHighlightedZoneId(zoneId)
              }}
              onZoneHover={(zoneId) => {
                // Story 5.8: Hover zone marker to highlight in list
                setHighlightedZoneId(zoneId)
              }}
              isAuthenticated={isAuthenticated}
            />
          </div>

          {/* Story 4.3 + Epic 6: Recommendations List with Time Toggle */}
          <div className="list-section">
            {/* Story 6.1: Time Period Toggle */}
            <TimePeriodToggle
              eventTime={eventTime || undefined}
              onChange={handleTimePeriodChange}
            />

            {/* Story 6.6: Fade transition during re-ranking */}
            <div className={`recommendations-list-wrapper ${isReranking ? 'reranking' : ''}`}>
              <RecommendationsList
                recommendations={recommendations}
                isAuthenticated={isAuthenticated}
                isLoading={isLoadingRecommendations}
                error={recommendationsError}
                onRetry={handleRetryRecommendations}
                onEditDetails={() => {
                  // Story 4.8: Go back to EventConfirmation to edit details
                  setShowRecommendations(false)
                  setShowConfirmation(true)
                }}
                onHighlightZone={(zoneId) => {
                  // Story 5.7: Hover list item to highlight zone on map
                  setHighlightedZoneId(zoneId)
                }}
                highlightedZoneId={highlightedZoneId}
              />
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Story 3.4, 3.10 AC: Show ManualEventForm when requested
  if (showManualForm) {
    return (
      <div className="upload-page">
        <ManualEventForm
          onSubmit={handleManualSubmit}
          onCancel={() => setShowManualForm(false)}
        />
      </div>
    )
  }

  // Story 3.3: Show EventConfirmation component after extraction
  if (showConfirmation && extractedData) {
    return (
      <EventConfirmation
        data={extractedData}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    )
  }

  return (
    <div className="upload-page">
      <div className="upload-container">
        <h1>Upload Event Flyer</h1>
        <p className="subtitle">
          Upload your event flyer and get AI-powered placement recommendations for Arlington, VA
        </p>

        {/* Story 3.1 AC: Drag-and-drop or "Choose File" */}
        <div
          className={`upload-zone ${isDragging ? 'dragging' : ''} ${selectedFile ? 'has-file' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={!selectedFile ? handleChooseFile : undefined}
        >
          {!selectedFile ? (
            <>
              <div className="upload-icon">
                <svg
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </div>
              <p className="upload-text">
                <strong>Drag and drop your flyer here</strong>
              </p>
              <p className="upload-text-secondary">or</p>
              <button type="button" className="choose-file-button" onClick={handleChooseFile}>
                Choose File
              </button>
              <p className="upload-hint">
                Supports JPG, PNG, PDF • Max 10MB
              </p>
            </>
          ) : (
            <>
              {/* Story 3.1 AC: Instant preview */}
              <div className="file-preview">
                {previewUrl ? (
                  <img src={previewUrl} alt="Preview" className="preview-image" />
                ) : (
                  <div className="pdf-preview">
                    <svg
                      width="64"
                      height="64"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                    <p>PDF File</p>
                  </div>
                )}
                <div className="file-info">
                  <p className="file-name">{selectedFile.name}</p>
                  <p className="file-size">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                <button type="button" className="change-file-button" onClick={handleReset}>
                  Change File
                </button>
              </div>
            </>
          )}
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_EXTENSIONS.join(',')}
          onChange={handleFileInputChange}
          style={{ display: 'none' }}
          aria-label="File upload input"
        />

        {/* Story 3.10 AC: Error messages ≤20 words with actionable next step */}
        {error && (
          <>
            <div className="error-message" role="alert">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{error.message}</span>
            </div>

            {/* Story 3.4, 3.10 AC: Manual entry option when AI fails */}
            {error.type === 'upload' && (
              <div className="manual-entry-option">
                <button
                  type="button"
                  className="manual-entry-button"
                  onClick={() => setShowManualForm(true)}
                >
                  Enter Details Manually
                </button>
                <span className="manual-entry-text">or</span>
                <button
                  type="button"
                  className="retry-button"
                  onClick={handleReset}
                >
                  Try Another File
                </button>
              </div>
            )}
          </>
        )}

        {/* Story 3.1 AC: Upload progress indicator */}
        {isUploading && (
          <div className="upload-progress">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="progress-text">{uploadProgress}% uploaded</p>
          </div>
        )}

        {/* Upload button */}
        {selectedFile && !isUploading && (
          <button
            type="button"
            className="upload-button"
            onClick={handleUpload}
            disabled={isUploading}
          >
            Analyze Flyer with AI
          </button>
        )}

        {/* Story 3.1 AC: Mobile camera access note */}
        <p className="mobile-note">
          📱 On mobile? Tap "Choose File" to access your camera
        </p>
      </div>
    </div>
  )
}
