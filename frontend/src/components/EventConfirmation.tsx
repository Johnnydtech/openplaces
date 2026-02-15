/**
 * Story 3.3: Display Extracted Event Details for Confirmation
 * Shows AI-extracted event details with edit capability and confidence indicators
 */

import { useState } from 'react'
import { EventExtraction } from '../api/analyze'
import './EventConfirmation.css'

interface EventConfirmationProps {
  data: EventExtraction
  onConfirm: (data: EventExtraction) => void
  onCancel: () => void
}

interface EditingField {
  field: keyof EventExtraction | null
  value: string | string[]
}

export default function EventConfirmation({ data, onConfirm, onCancel }: EventConfirmationProps) {
  const [eventData, setEventData] = useState<EventExtraction>(data)
  const [editing, setEditing] = useState<EditingField>({ field: null, value: '' })

  const startEdit = (field: keyof EventExtraction) => {
    setEditing({
      field,
      value: eventData[field] as string | string[]
    })
  }

  const saveEdit = () => {
    if (editing.field) {
      setEventData(prev => ({
        ...prev,
        [editing.field as string]: editing.value
      }))
      setEditing({ field: null, value: '' })
    }
  }

  const cancelEdit = () => {
    setEditing({ field: null, value: '' })
  }

  const handleConfirm = () => {
    onConfirm(eventData)
  }

  // Story 3.3 AC: Confidence indicator (High/Medium/Low)
  const getConfidenceColor = (confidence: string): string => {
    switch (confidence) {
      case 'High':
        return 'confidence-high'
      case 'Medium':
        return 'confidence-medium'
      case 'Low':
        return 'confidence-low'
      default:
        return 'confidence-medium'
    }
  }

  const getConfidenceIcon = (confidence: string): string => {
    switch (confidence) {
      case 'High':
        return '✓'
      case 'Medium':
        return '◐'
      case 'Low':
        return '!'
      default:
        return '◐'
    }
  }

  return (
    <div className="event-confirmation">
      <div className="confirmation-card">
        <div className="card-header">
          <h2>Confirm Event Details</h2>
          <p className="card-subtitle">Review and edit the information extracted from your flyer</p>
        </div>

        {/* Story 3.3 AC: Confidence indicator */}
        <div className={`confidence-indicator ${getConfidenceColor(eventData.confidence)}`}>
          <span className="confidence-icon">{getConfidenceIcon(eventData.confidence)}</span>
          <span className="confidence-text">
            Confidence: {eventData.confidence}
          </span>
        </div>

        {/* Story 3.3 AC: Low confidence shows warning */}
        {eventData.confidence === 'Low' && (
          <div className="confidence-warning" role="alert">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <span>Please review these details carefully. The AI had difficulty extracting some information.</span>
          </div>
        )}

        <div className="event-fields">
          {/* Event Name */}
          <div className="field-row">
            <label className="field-label">Event Name</label>
            {editing.field === 'event_name' ? (
              <div className="field-edit">
                <input
                  type="text"
                  value={editing.value as string}
                  onChange={(e) => setEditing({ ...editing, value: e.target.value })}
                  autoFocus
                  className="field-input"
                />
                <div className="edit-actions">
                  <button type="button" onClick={saveEdit} className="btn-save" aria-label="Save">
                    ✓
                  </button>
                  <button type="button" onClick={cancelEdit} className="btn-cancel" aria-label="Cancel">
                    ✕
                  </button>
                </div>
              </div>
            ) : (
              <div className="field-display">
                <span className="field-value">{eventData.event_name || '(Not found)'}</span>
                <button type="button" onClick={() => startEdit('event_name')} className="btn-edit">
                  Edit
                </button>
              </div>
            )}
          </div>

          {/* Event Date */}
          <div className="field-row">
            <label className="field-label">Date</label>
            {editing.field === 'event_date' ? (
              <div className="field-edit">
                <input
                  type="text"
                  value={editing.value as string}
                  onChange={(e) => setEditing({ ...editing, value: e.target.value })}
                  autoFocus
                  className="field-input"
                  placeholder="YYYY-MM-DD or text"
                />
                <div className="edit-actions">
                  <button type="button" onClick={saveEdit} className="btn-save" aria-label="Save">
                    ✓
                  </button>
                  <button type="button" onClick={cancelEdit} className="btn-cancel" aria-label="Cancel">
                    ✕
                  </button>
                </div>
              </div>
            ) : (
              <div className="field-display">
                <span className="field-value">{eventData.event_date || '(Not found)'}</span>
                <button type="button" onClick={() => startEdit('event_date')} className="btn-edit">
                  Edit
                </button>
              </div>
            )}
          </div>

          {/* Event Time */}
          <div className="field-row">
            <label className="field-label">Time</label>
            {editing.field === 'event_time' ? (
              <div className="field-edit">
                <input
                  type="text"
                  value={editing.value as string}
                  onChange={(e) => setEditing({ ...editing, value: e.target.value })}
                  autoFocus
                  className="field-input"
                  placeholder="e.g., 7:00 PM"
                />
                <div className="edit-actions">
                  <button type="button" onClick={saveEdit} className="btn-save" aria-label="Save">
                    ✓
                  </button>
                  <button type="button" onClick={cancelEdit} className="btn-cancel" aria-label="Cancel">
                    ✕
                  </button>
                </div>
              </div>
            ) : (
              <div className="field-display">
                <span className="field-value">{eventData.event_time || '(Not found)'}</span>
                <button type="button" onClick={() => startEdit('event_time')} className="btn-edit">
                  Edit
                </button>
              </div>
            )}
          </div>

          {/* Venue */}
          <div className="field-row">
            <label className="field-label">Venue</label>
            {editing.field === 'venue' ? (
              <div className="field-edit">
                <input
                  type="text"
                  value={editing.value as string}
                  onChange={(e) => setEditing({ ...editing, value: e.target.value })}
                  autoFocus
                  className="field-input"
                />
                <div className="edit-actions">
                  <button type="button" onClick={saveEdit} className="btn-save" aria-label="Save">
                    ✓
                  </button>
                  <button type="button" onClick={cancelEdit} className="btn-cancel" aria-label="Cancel">
                    ✕
                  </button>
                </div>
              </div>
            ) : (
              <div className="field-display">
                <span className="field-value">{eventData.venue || '(Not found)'}</span>
                <button type="button" onClick={() => startEdit('venue')} className="btn-edit">
                  Edit
                </button>
              </div>
            )}
          </div>

          {/* Target Audience */}
          <div className="field-row">
            <label className="field-label">Target Audience</label>
            {editing.field === 'target_audience' ? (
              <div className="field-edit">
                <input
                  type="text"
                  value={Array.isArray(editing.value) ? editing.value.join(', ') : editing.value}
                  onChange={(e) => setEditing({ ...editing, value: e.target.value.split(',').map(s => s.trim()) })}
                  autoFocus
                  className="field-input"
                  placeholder="Separate with commas"
                />
                <div className="edit-actions">
                  <button type="button" onClick={saveEdit} className="btn-save" aria-label="Save">
                    ✓
                  </button>
                  <button type="button" onClick={cancelEdit} className="btn-cancel" aria-label="Cancel">
                    ✕
                  </button>
                </div>
              </div>
            ) : (
              <div className="field-display">
                <div className="audience-tags">
                  {eventData.target_audience && eventData.target_audience.length > 0 ? (
                    eventData.target_audience.map((audience, idx) => (
                      <span key={idx} className="audience-tag">{audience}</span>
                    ))
                  ) : (
                    <span className="field-value">(Not found)</span>
                  )}
                </div>
                <button type="button" onClick={() => startEdit('target_audience')} className="btn-edit">
                  Edit
                </button>
              </div>
            )}
          </div>

          {/* Extraction Notes */}
          {eventData.extraction_notes && (
            <div className="extraction-notes">
              <strong>Notes:</strong> {eventData.extraction_notes}
            </div>
          )}
        </div>

        {/* Story 3.3 AC: "Confirm & Continue" button */}
        <div className="confirmation-actions">
          <button type="button" onClick={onCancel} className="btn-secondary">
            Cancel
          </button>
          <button type="button" onClick={handleConfirm} className="btn-primary">
            Confirm & Continue
          </button>
        </div>

        {/* Story 3.3 AC: Extraction within 60 seconds total (NFR-P1) */}
        <p className="timing-note">
          Extraction completed successfully
        </p>
      </div>
    </div>
  )
}
