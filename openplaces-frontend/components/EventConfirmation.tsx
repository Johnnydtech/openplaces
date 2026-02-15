'use client'

import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { geocodeVenue } from '@/lib/api'

interface EventData {
  event_name: string
  event_date: string
  event_time: string
  venue: string
  target_audience: string[]
  confidence: string
  extraction_notes?: string
  latitude?: number
  longitude?: number
  geocoded_address?: string
}

interface EventConfirmationProps {
  data: EventData
  onGetRecommendations: () => void
  onUpdate?: (updatedData: EventData) => void
}

export default function EventConfirmation({ data, onGetRecommendations, onUpdate }: EventConfirmationProps) {
  const [editingField, setEditingField] = useState<string | null>(null)
  const [editValue, setEditValue] = useState<string>('')
  const [localData, setLocalData] = useState(data)
  const [isGeocoding, setIsGeocoding] = useState(false)
  const [geocodingError, setGeocodingError] = useState<string | null>(null)
  // Story 3.7: Target audience editing state
  const [editingAudiences, setEditingAudiences] = useState<string[]>([])

  // Story 3.7: Audience options (from ManualEventForm)
  const audienceOptions = [
    'Young professionals',
    'Families',
    'Students',
    'Coffee enthusiasts',
    'Seniors',
    'Local residents',
  ]

  // Story 3.6: Auto-geocode venue when component mounts or venue changes
  useEffect(() => {
    const geocodeAddress = async () => {
      // Skip if no venue or already geocoded
      if (!localData.venue || localData.latitude) {
        return
      }

      setIsGeocoding(true)
      setGeocodingError(null)

      try {
        const result = await geocodeVenue(localData.venue)
        const updatedData = {
          ...localData,
          latitude: result.latitude,
          longitude: result.longitude,
          geocoded_address: result.formatted_address
        }
        setLocalData(updatedData)
        if (onUpdate) {
          onUpdate(updatedData)
        }
        toast.success('📍 Venue located!')
      } catch (error: any) {
        if (error.response?.status === 404) {
          setGeocodingError('Venue not found')
          toast.error('Venue not found. Please check the address.')
        } else if (error.code === 'ECONNABORTED') {
          setGeocodingError('Geocoding timeout')
          toast.error('Geocoding took too long. You can proceed without it.')
        } else {
          setGeocodingError('Geocoding unavailable')
          // Gracefully degrade - don't show toast
          console.warn('Geocoding failed:', error)
        }
      } finally {
        setIsGeocoding(false)
      }
    }

    geocodeAddress()
  }, [localData.venue]) // Trigger when venue changes

  const confidenceColor = {
    high: 'text-green-600 bg-green-50 border-green-200',
    medium: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    low: 'text-red-600 bg-red-50 border-red-200',
  }[localData.confidence.toLowerCase()] || 'text-gray-600 bg-gray-50 border-gray-200'

  const handleEdit = (field: string, currentValue: string) => {
    setEditingField(field)
    setEditValue(currentValue)
  }

  const handleSave = (field: string) => {
    const updatedData = { ...localData, [field]: editValue }

    // Story 3.6: Clear geocoding data when venue is edited to trigger re-geocoding
    if (field === 'venue') {
      updatedData.latitude = undefined
      updatedData.longitude = undefined
      updatedData.geocoded_address = undefined
    }

    setLocalData(updatedData)
    if (onUpdate) {
      onUpdate(updatedData)
    }
    setEditingField(null)
    toast.success('Field updated!')
  }

  const handleCancel = () => {
    setEditingField(null)
    setEditValue('')
  }

  // Story 3.7: Target audience editing handlers
  const handleEditAudience = () => {
    setEditingField('target_audience')
    setEditingAudiences([...localData.target_audience]) // Initialize with current values
  }

  const handleAudienceToggle = (audience: string) => {
    setEditingAudiences(prev =>
      prev.includes(audience)
        ? prev.filter(a => a !== audience)  // Uncheck
        : [...prev, audience]  // Check
    )
  }

  const handleSaveAudience = () => {
    // Validation: At least one audience required
    if (editingAudiences.length === 0) {
      toast.error('Please select at least one audience')
      return
    }

    const updatedData = { ...localData, target_audience: editingAudiences }
    setLocalData(updatedData)
    if (onUpdate) {
      onUpdate(updatedData)
    }
    setEditingField(null)
    toast.success('Audience updated!')
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Extracted Event Details</h3>
        <span className={`rounded-full border px-3 py-1 text-xs font-medium ${confidenceColor}`}>
          {localData.confidence} Confidence
        </span>
      </div>

      {localData.confidence.toLowerCase() === 'low' && (
        <div className="mb-4 rounded-md bg-yellow-50 p-3 text-sm text-yellow-800">
          ⚠️ Low confidence extraction. Please review and edit details carefully.
        </div>
      )}

      <div className="space-y-3">
        {/* Event Name */}
        <div>
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-gray-500">Event Name</label>
            {editingField !== 'event_name' && (
              <button
                onClick={() => handleEdit('event_name', localData.event_name)}
                className="text-blue-600 hover:text-blue-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                </svg>
              </button>
            )}
          </div>
          {editingField === 'event_name' ? (
            <div className="flex gap-2 mt-1">
              <input
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
                autoFocus
              />
              <button onClick={() => handleSave('event_name')} className="text-green-600 hover:text-green-700">
                ✓
              </button>
              <button onClick={handleCancel} className="text-red-600 hover:text-red-700">
                ✕
              </button>
            </div>
          ) : (
            <p className="text-sm font-medium text-gray-900">{localData.event_name}</p>
          )}
        </div>

        {/* Date and Time */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-gray-500">Date</label>
              {editingField !== 'event_date' && (
                <button onClick={() => handleEdit('event_date', localData.event_date)} className="text-blue-600 hover:text-blue-700">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                  </svg>
                </button>
              )}
            </div>
            {editingField === 'event_date' ? (
              <div className="flex gap-1 mt-1">
                <input type="date" value={editValue} onChange={(e) => setEditValue(e.target.value)} className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm" autoFocus />
                <button onClick={() => handleSave('event_date')} className="text-green-600">✓</button>
                <button onClick={handleCancel} className="text-red-600">✕</button>
              </div>
            ) : (
              <p className="text-sm text-gray-900">{localData.event_date}</p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-gray-500">Time</label>
              {editingField !== 'event_time' && (
                <button onClick={() => handleEdit('event_time', localData.event_time)} className="text-blue-600 hover:text-blue-700">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                  </svg>
                </button>
              )}
            </div>
            {editingField === 'event_time' ? (
              <div className="flex gap-1 mt-1">
                <input type="time" value={editValue} onChange={(e) => setEditValue(e.target.value)} className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm" autoFocus />
                <button onClick={() => handleSave('event_time')} className="text-green-600">✓</button>
                <button onClick={handleCancel} className="text-red-600">✕</button>
              </div>
            ) : (
              <p className="text-sm text-gray-900">{localData.event_time}</p>
            )}
          </div>
        </div>

        {/* Venue */}
        <div>
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-gray-500">Venue</label>
            {editingField !== 'venue' && (
              <button onClick={() => handleEdit('venue', localData.venue)} className="text-blue-600 hover:text-blue-700">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                </svg>
              </button>
            )}
          </div>
          {editingField === 'venue' ? (
            <div className="flex gap-2 mt-1">
              <input type="text" value={editValue} onChange={(e) => setEditValue(e.target.value)} className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm" autoFocus />
              <button onClick={() => handleSave('venue')} className="text-green-600">✓</button>
              <button onClick={handleCancel} className="text-red-600">✕</button>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-900">{localData.venue}</p>
              {/* Story 3.6: Display geocoded coordinates */}
              {isGeocoding && (
                <p className="mt-1 text-xs text-gray-500">📍 Locating venue...</p>
              )}
              {!isGeocoding && localData.latitude && localData.longitude && (
                <p className="mt-1 text-xs text-green-600">
                  📍 {localData.latitude.toFixed(4)}, {localData.longitude.toFixed(4)}
                </p>
              )}
              {!isGeocoding && geocodingError && (
                <p className="mt-1 text-xs text-yellow-600">
                  ⚠️ {geocodingError}
                </p>
              )}
            </>
          )}
        </div>

        {/* Target Audience */}
        <div>
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-gray-500">Target Audience</label>
            {editingField !== 'target_audience' && (
              <button onClick={handleEditAudience} className="text-blue-600 hover:text-blue-700">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                </svg>
              </button>
            )}
          </div>
          {editingField === 'target_audience' ? (
            <div className="mt-1">
              {/* Checkbox list */}
              <div className="space-y-2 max-h-48 overflow-y-auto rounded border border-gray-300 p-3 bg-gray-50">
                {audienceOptions.map((audience) => (
                  <label key={audience} className="flex items-center cursor-pointer hover:bg-gray-100 p-1 rounded">
                    <input
                      type="checkbox"
                      checked={editingAudiences.includes(audience)}
                      onChange={() => handleAudienceToggle(audience)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">{audience}</span>
                  </label>
                ))}
              </div>

              {/* Save/Cancel buttons */}
              <div className="flex gap-2 mt-2">
                <button onClick={handleSaveAudience} className="text-green-600 hover:text-green-700 font-bold">✓</button>
                <button onClick={handleCancel} className="text-red-600 hover:text-red-700 font-bold">✕</button>
              </div>

              {/* Validation error */}
              {editingAudiences.length === 0 && (
                <p className="text-xs text-red-600 mt-1">⚠️ Select at least one audience</p>
              )}
            </div>
          ) : (
            <div className="mt-1 flex flex-wrap gap-2">
              {localData.target_audience.map((audience, index) => (
                <span key={index} className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
                  {audience}
                </span>
              ))}
            </div>
          )}
        </div>

        {localData.extraction_notes && (
          <div>
            <label className="text-xs font-medium text-gray-500">Notes</label>
            <p className="text-sm italic text-gray-600">{localData.extraction_notes}</p>
          </div>
        )}
      </div>

      <button
        onClick={onGetRecommendations}
        className="mt-6 w-full rounded-md bg-blue-600 px-4 py-3 text-base font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
      >
        Get Recommendations →
      </button>
    </div>
  )
}
