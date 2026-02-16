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
  event_type?: string
}

interface EventConfirmationProps {
  data: EventData
  onGetRecommendations: (data: any) => void
  onUpdate?: (updatedData: EventData) => void
}

export default function EventConfirmation({ data, onGetRecommendations, onUpdate }: EventConfirmationProps) {
  const [localData, setLocalData] = useState({
    ...data,
    event_type: data.event_type || 'Community event'
  })
  const [isGeocoding, setIsGeocoding] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)

  // Edit mode states
  const [editedData, setEditedData] = useState(localData)
  const [selectedAudiences, setSelectedAudiences] = useState<string[]>(data.target_audience)

  const audienceOptions = [
    'Young professionals',
    'Families',
    'Students',
    'Coffee enthusiasts',
    'Seniors',
    'Local residents',
  ]

  const eventTypeOptions = [
    'Workshop',
    'Concert',
    'Sale',
    'Community event',
    'Nightlife',
    'Sports',
    'Cultural',
  ]

  // Auto-geocode venue
  useEffect(() => {
    const geocodeAddress = async () => {
      if (!localData.venue || localData.latitude) return

      setIsGeocoding(true)
      try {
        const result = await geocodeVenue(localData.venue)
        const updatedData = {
          ...localData,
          latitude: result.latitude,
          longitude: result.longitude,
          geocoded_address: result.formatted_address
        }
        setLocalData(updatedData)
        setEditedData(updatedData)
        if (onUpdate) onUpdate(updatedData)
      } catch (error) {
        console.warn('Geocoding failed:', error)
      } finally {
        setIsGeocoding(false)
      }
    }

    geocodeAddress()
  }, [localData.venue])

  const handleConfirm = () => {
    console.log('[EventConfirmation] Confirming with data:', localData)
    console.log('[EventConfirmation] Has latitude:', localData.latitude)

    if (!localData.latitude || !localData.longitude) {
      toast.error('Please wait for venue location to be confirmed')
      return
    }

    onGetRecommendations({
      event_name: localData.event_name,
      event_date: localData.event_date,
      event_time: localData.event_time,
      venue_address: localData.venue,
      target_audience: localData.target_audience,
      event_type: localData.event_type
    })
  }

  const handleEdit = () => {
    setIsEditMode(true)
    setEditedData(localData)
    setSelectedAudiences(localData.target_audience)
  }

  const handleSaveEdits = () => {
    const updatedData = {
      ...editedData,
      target_audience: selectedAudiences,
      latitude: undefined,
      longitude: undefined
    }
    setLocalData(updatedData)
    if (onUpdate) onUpdate(updatedData)
    setIsEditMode(false)
    toast.success('Details updated!')
  }

  const handleCancelEdit = () => {
    setIsEditMode(false)
    setEditedData(localData)
    setSelectedAudiences(localData.target_audience)
  }

  const toggleAudience = (audience: string) => {
    setSelectedAudiences(prev =>
      prev.includes(audience)
        ? prev.filter(a => a !== audience)
        : [...prev, audience]
    )
  }

  if (isEditMode) {
    return (
      <div className="rounded-xl border p-6 shadow-2xl backdrop-blur-xl" style={{ background: 'rgba(26, 47, 58, 0.95)', borderColor: 'rgba(74, 222, 128, 0.2)' }}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-white">Edit Event Details</h3>
          <button
            onClick={handleCancelEdit}
            className="text-sm"
            style={{ color: '#94a3b8' }}
          >
            Cancel
          </button>
        </div>

        <div className="space-y-4">
          {/* Event Name */}
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: '#94a3b8' }}>Event Name</label>
            <input
              type="text"
              value={editedData.event_name}
              onChange={(e) => setEditedData({ ...editedData, event_name: e.target.value })}
              className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 text-white"
              style={{ background: '#1e3a48', borderColor: '#2a4551', '--tw-ring-color': '#4ade80' } as React.CSSProperties}
            />
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: '#94a3b8' }}>Date</label>
              <input
                type="date"
                value={editedData.event_date}
                onChange={(e) => setEditedData({ ...editedData, event_date: e.target.value })}
                className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 text-white"
                style={{ background: '#1e3a48', borderColor: '#2a4551', '--tw-ring-color': '#4ade80' } as React.CSSProperties}
              />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: '#94a3b8' }}>Time</label>
              <input
                type="time"
                value={editedData.event_time}
                onChange={(e) => setEditedData({ ...editedData, event_time: e.target.value })}
                className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 text-white"
                style={{ background: '#1e3a48', borderColor: '#2a4551', '--tw-ring-color': '#4ade80' } as React.CSSProperties}
              />
            </div>
          </div>

          {/* Venue */}
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: '#94a3b8' }}>Venue Address</label>
            <input
              type="text"
              value={editedData.venue}
              onChange={(e) => setEditedData({ ...editedData, venue: e.target.value })}
              className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 text-white"
              style={{ background: '#1e3a48', borderColor: '#2a4551', '--tw-ring-color': '#4ade80' } as React.CSSProperties}
            />
          </div>

          {/* Event Type */}
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: '#94a3b8' }}>Event Type</label>
            <select
              value={editedData.event_type}
              onChange={(e) => setEditedData({ ...editedData, event_type: e.target.value })}
              className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 text-white"
              style={{ background: '#1e3a48', borderColor: '#2a4551', '--tw-ring-color': '#4ade80' } as React.CSSProperties}
            >
              {eventTypeOptions.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          {/* Target Audience */}
          <div>
            <label className="text-xs font-medium block mb-2" style={{ color: '#94a3b8' }}>Target Audience</label>
            <div className="space-y-2 max-h-40 overflow-y-auto rounded-lg p-3" style={{ background: 'rgba(30, 58, 72, 0.5)' }}>
              {audienceOptions.map((audience) => (
                <label key={audience} className="flex items-center cursor-pointer p-2 rounded transition-colors" style={{ '&:hover': { background: 'rgba(74, 222, 128, 0.1)' } }}>
                  <input
                    type="checkbox"
                    checked={selectedAudiences.includes(audience)}
                    onChange={() => toggleAudience(audience)}
                    className="h-4 w-4 rounded"
                    style={{ accentColor: '#4ade80' }}
                  />
                  <span className="ml-2 text-sm text-white">{audience}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={handleSaveEdits}
          className="w-full mt-6 rounded-lg px-4 py-3 text-base font-semibold transition-colors"
          style={{ background: '#4ade80', color: '#0f1c24' }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#22c55e'}
          onMouseLeave={(e) => e.currentTarget.style.background = '#4ade80'}
        >
          Save Changes
        </button>
      </div>
    )
  }

  return (
    <div className="rounded-xl border shadow-2xl backdrop-blur-xl overflow-hidden" style={{ background: 'rgba(26, 47, 58, 0.95)', borderColor: 'rgba(74, 222, 128, 0.2)' }}>
      {/* Header */}
      <div className="p-6 border-b" style={{ borderColor: 'rgba(42, 69, 81, 0.5)' }}>
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="text-xl font-bold text-white mb-1">
              {localData.event_name}
            </h3>
            <p className="text-sm" style={{ color: '#94a3b8' }}>
              {new Date(localData.event_date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })} at {localData.event_time}
            </p>
          </div>
          <span className="rounded-full px-3 py-1 text-xs font-semibold" style={{
            background: localData.confidence.toLowerCase() === 'high' ? '#4ade80' : localData.confidence.toLowerCase() === 'medium' ? '#facc15' : '#fb923c',
            color: '#0f1c24'
          }}>
            AI Extracted
          </span>
        </div>
      </div>

      {/* Event Details */}
      <div className="p-6 space-y-4">
        {/* Venue */}
        <div>
          <p className="text-xs font-medium mb-1" style={{ color: '#94a3b8' }}>📍 VENUE</p>
          <p className="text-sm font-medium text-white">{localData.venue}</p>
          {isGeocoding && (
            <p className="text-xs mt-1" style={{ color: '#4ade80' }}>Locating on map...</p>
          )}
          {!isGeocoding && localData.latitude && (
            <p className="text-xs mt-1" style={{ color: '#4ade80' }}>✓ Location confirmed</p>
          )}
        </div>

        {/* Event Type */}
        <div>
          <p className="text-xs font-medium mb-1" style={{ color: '#94a3b8' }}>🎭 EVENT TYPE</p>
          <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium" style={{ background: 'rgba(168, 85, 247, 0.2)', color: '#a855f7' }}>
            {localData.event_type}
          </span>
        </div>

        {/* Target Audience */}
        <div>
          <p className="text-xs font-medium mb-2" style={{ color: '#94a3b8' }}>👥 TARGET AUDIENCE</p>
          <div className="flex flex-wrap gap-2">
            {localData.target_audience.map((audience, index) => (
              <span key={index} className="rounded-full px-3 py-1 text-xs font-medium" style={{ background: 'rgba(74, 222, 128, 0.2)', color: '#4ade80' }}>
                {audience}
              </span>
            ))}
          </div>
        </div>

        {localData.confidence.toLowerCase() === 'low' && (
          <div className="rounded-lg p-3 text-sm" style={{ background: 'rgba(251, 146, 60, 0.1)', color: '#fb923c', border: '1px solid rgba(251, 146, 60, 0.2)' }}>
            <p className="font-medium mb-1">⚠️ Low Confidence Extraction</p>
            <p className="text-xs">Please review the details carefully before proceeding</p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="p-6 pt-0 space-y-3">
        <button
          onClick={handleConfirm}
          disabled={!localData.latitude || isGeocoding}
          className={`w-full rounded-lg px-4 py-3 text-base font-semibold transition-colors ${
            !localData.latitude || isGeocoding ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          style={{ background: '#4ade80', color: '#0f1c24' }}
          onMouseEnter={(e) => {
            if (localData.latitude && !isGeocoding) e.currentTarget.style.background = '#22c55e'
          }}
          onMouseLeave={(e) => {
            if (localData.latitude && !isGeocoding) e.currentTarget.style.background = '#4ade80'
          }}
        >
          {isGeocoding ? 'Locating venue...' : 'Looks perfect! Find OpenPlaces →'}
        </button>

        <button
          onClick={handleEdit}
          className="w-full rounded-lg px-4 py-2 text-sm font-medium transition-colors"
          style={{ background: 'rgba(74, 222, 128, 0.1)', color: '#4ade80' }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(74, 222, 128, 0.2)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(74, 222, 128, 0.1)'}
        >
          Make changes
        </button>
      </div>
    </div>
  )
}
