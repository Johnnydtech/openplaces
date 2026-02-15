/**
 * Story 3.4: Manual Event Detail Entry
 * Story 3.7: Target Audience Demographics Selection
 * Story 3.8: Event Type Classification
 * Story 3.9: Required Field Validation
 *
 * Form for manually entering event details if AI extraction fails
 */
import { useState } from 'react'
import './ManualEventForm.css'

interface ManualEventFormProps {
  onSubmit: (eventData: EventData) => void
  onCancel: () => void
}

export interface EventData {
  name: string
  date: string
  time: string
  venue: string
  target_audience: string[]
  event_type: string
}

// Story 3.7 AC: Target audience checkboxes
const AUDIENCE_OPTIONS = [
  // Age ranges
  { value: '18-24', label: '18-24 years old' },
  { value: '25-34', label: '25-34 years old' },
  { value: '35-44', label: '35-44 years old' },
  { value: '45+', label: '45+ years old' },
  // Interests
  { value: 'coffee_enthusiasts', label: 'Coffee Enthusiasts' },
  { value: 'young_professionals', label: 'Young Professionals' },
  { value: 'families', label: 'Families' },
  { value: 'students', label: 'Students' },
  { value: 'artists', label: 'Artists' },
  { value: 'fitness', label: 'Fitness Enthusiasts' },
  { value: 'foodies', label: 'Foodies' },
  // Behaviors
  { value: 'commuters', label: 'Commuters' },
  { value: 'weekend_planners', label: 'Weekend Planners' },
  { value: 'lunch_break_browsers', label: 'Lunch Break Browsers' }
]

// Story 3.8 AC: Event type dropdown
const EVENT_TYPES = [
  { value: 'workshop', label: 'Workshop' },
  { value: 'concert', label: 'Concert' },
  { value: 'sale', label: 'Sale' },
  { value: 'community_event', label: 'Community Event' },
  { value: 'nightlife', label: 'Nightlife' },
  { value: 'sports', label: 'Sports' },
  { value: 'cultural', label: 'Cultural' }
]

export default function ManualEventForm({ onSubmit, onCancel }: ManualEventFormProps) {
  const [formData, setFormData] = useState<EventData>({
    name: '',
    date: '',
    time: '',
    venue: '',
    target_audience: [],
    event_type: ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Story 3.9 AC: Real-time validation
  const validateField = (field: keyof EventData, value: any): string => {
    switch (field) {
      case 'name':
        return value.trim() ? '' : 'Event name is required'
      case 'date':
        if (!value) return 'Date is required'
        const selectedDate = new Date(value)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        return selectedDate >= today ? '' : 'Date must be in the future'
      case 'time':
        return value.trim() ? '' : 'Time is required'
      case 'venue':
        return value.trim() ? '' : 'Venue address is required'
      case 'target_audience':
        return value.length > 0 ? '' : 'At least one target audience is required'
      case 'event_type':
        return value ? '' : 'Event type is required'
      default:
        return ''
    }
  }

  // Story 3.9 AC: Validate all fields before submit
  const validateAll = (): boolean => {
    const newErrors: Record<string, string> = {}

    Object.keys(formData).forEach(key => {
      const error = validateField(key as keyof EventData, formData[key as keyof EventData])
      if (error) {
        newErrors[key] = error
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (field: keyof EventData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))

    // Story 3.9 AC: Real-time validation
    const error = validateField(field, value)
    setErrors(prev => ({ ...prev, [field]: error }))
  }

  const handleAudienceToggle = (audienceValue: string) => {
    const newAudience = formData.target_audience.includes(audienceValue)
      ? formData.target_audience.filter(a => a !== audienceValue)
      : [...formData.target_audience, audienceValue]

    setFormData(prev => ({ ...prev, target_audience: newAudience }))

    // Story 3.9 AC: At least one audience required
    const error = validateField('target_audience', newAudience)
    setErrors(prev => ({ ...prev, target_audience: error }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Story 3.9 AC: Validate before proceeding
    if (!validateAll()) {
      return
    }

    onSubmit(formData)
  }

  return (
    <div className="manual-form-container">
      <div className="manual-form-header">
        <h2>Enter Event Details Manually</h2>
        <p className="form-subtitle">Fill in the details to get ad placement recommendations</p>
      </div>

      <form onSubmit={handleSubmit} className="manual-event-form">
        {/* Story 3.4 AC: Event Name field */}
        <div className="form-group">
          <label htmlFor="event-name" className="form-label">
            Event Name <span className="required">*</span>
          </label>
          <input
            id="event-name"
            type="text"
            className={`form-input ${errors.name ? 'error' : ''}`}
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="e.g., Summer Music Festival"
          />
          {errors.name && <span className="error-text">{errors.name}</span>}
        </div>

        {/* Story 3.4 AC: Date field */}
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="event-date" className="form-label">
              Date <span className="required">*</span>
            </label>
            <input
              id="event-date"
              type="date"
              className={`form-input ${errors.date ? 'error' : ''}`}
              value={formData.date}
              onChange={(e) => handleInputChange('date', e.target.value)}
            />
            {errors.date && <span className="error-text">{errors.date}</span>}
          </div>

          {/* Story 3.4 AC: Time field */}
          <div className="form-group">
            <label htmlFor="event-time" className="form-label">
              Time <span className="required">*</span>
            </label>
            <input
              id="event-time"
              type="time"
              className={`form-input ${errors.time ? 'error' : ''}`}
              value={formData.time}
              onChange={(e) => handleInputChange('time', e.target.value)}
            />
            {errors.time && <span className="error-text">{errors.time}</span>}
          </div>
        </div>

        {/* Story 3.4 AC: Venue address input */}
        <div className="form-group">
          <label htmlFor="venue" className="form-label">
            Venue Address <span className="required">*</span>
          </label>
          <input
            id="venue"
            type="text"
            className={`form-input ${errors.venue ? 'error' : ''}`}
            value={formData.venue}
            onChange={(e) => handleInputChange('venue', e.target.value)}
            placeholder="e.g., 123 Main St, Arlington, VA 22201"
          />
          {errors.venue && <span className="error-text">{errors.venue}</span>}
          <span className="form-hint">Full street address for accurate geocoding</span>
        </div>

        {/* Story 3.7 AC: Target Audience checkboxes (multiple selections) */}
        <div className="form-group">
          <label className="form-label">
            Target Audience <span className="required">*</span>
          </label>
          <div className="checkbox-grid">
            {AUDIENCE_OPTIONS.map(option => (
              <label key={option.value} className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.target_audience.includes(option.value)}
                  onChange={() => handleAudienceToggle(option.value)}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
          {errors.target_audience && <span className="error-text">{errors.target_audience}</span>}
        </div>

        {/* Story 3.8 AC: Event Type dropdown (required) */}
        <div className="form-group">
          <label htmlFor="event-type" className="form-label">
            Event Type <span className="required">*</span>
          </label>
          <select
            id="event-type"
            className={`form-select ${errors.event_type ? 'error' : ''}`}
            value={formData.event_type}
            onChange={(e) => handleInputChange('event_type', e.target.value)}
          >
            <option value="">Select event type...</option>
            {EVENT_TYPES.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          {errors.event_type && <span className="error-text">{errors.event_type}</span>}
          <span className="form-hint">
            Influences timing and zone recommendations
          </span>
        </div>

        {/* Action buttons */}
        <div className="form-actions">
          <button
            type="button"
            onClick={onCancel}
            className="button-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="button-primary"
          >
            Get Recommendations
          </button>
        </div>
      </form>
    </div>
  )
}
