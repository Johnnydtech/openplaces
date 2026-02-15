/**
 * Story 2.7, 2.8, 2.9: Saved Recommendations Page (Protected)
 * View, edit notes, and delete saved recommendations
 */
import { useState, useEffect } from 'react'
import { useUser } from '@clerk/clerk-react'
import toast from 'react-hot-toast'
import './SavedRecommendations.css'

interface SavedRecommendation {
  id: string
  recommendation_id: string
  notes: string | null
  created_at: string
  recommendations: {
    event_data: any
    zones: any[]
  }
}

export default function SavedRecommendations() {
  const { user } = useUser()
  const [savedRecs, setSavedRecs] = useState<SavedRecommendation[]>([])
  const [loading, setLoading] = useState(true)
  const [editingNotes, setEditingNotes] = useState<string | null>(null)
  const [notesText, setNotesText] = useState('')

  // Story 2.7 AC: Load saved recommendations sorted by most recent
  useEffect(() => {
    if (!user) return

    const fetchSavedRecommendations = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/saved-recommendations/list`,
          {
            headers: {
              'X-Clerk-User-Id': user.id
            }
          }
        )

        if (!response.ok) {
          throw new Error('Failed to fetch saved recommendations')
        }

        const data = await response.json()
        setSavedRecs(data.saved_recommendations || [])
      } catch (error) {
        console.error('Error fetching saved recommendations:', error)
        toast.error('Failed to load saved recommendations')
      } finally {
        setLoading(false)
      }
    }

    fetchSavedRecommendations()
  }, [user])

  // Story 2.8 AC: Add/Edit notes (500 char limit)
  const handleEditNotes = (recId: string, currentNotes: string | null) => {
    setEditingNotes(recId)
    setNotesText(currentNotes || '')
  }

  // Story 2.8 AC: Save notes
  const handleSaveNotes = async (recId: string) => {
    if (notesText.length > 500) {
      toast.error('Notes must be 500 characters or less')
      return
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/saved-recommendations/${recId}/notes`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'X-Clerk-User-Id': user!.id
          },
          body: JSON.stringify({ notes: notesText })
        }
      )

      if (!response.ok) {
        throw new Error('Failed to update notes')
      }

      const data = await response.json()
      toast.success('Note saved!') // Story 2.8 AC: Success message

      // Update local state
      setSavedRecs(savedRecs.map(rec =>
        rec.id === recId ? { ...rec, notes: notesText } : rec
      ))

      setEditingNotes(null)
    } catch (error) {
      console.error('Error saving notes:', error)
      toast.error('Failed to save note')
    }
  }

  // Story 2.9 AC: Delete saved recommendation with confirmation
  const handleDelete = async (recId: string) => {
    if (!window.confirm('Delete this saved recommendation?')) {
      return
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/saved-recommendations/${recId}`,
        {
          method: 'DELETE',
          headers: {
            'X-Clerk-User-Id': user!.id
          }
        }
      )

      if (!response.ok) {
        throw new Error('Failed to delete recommendation')
      }

      toast.success('Recommendation deleted') // Story 2.9 AC: Success message

      // Remove from local state
      setSavedRecs(savedRecs.filter(rec => rec.id !== recId))
    } catch (error) {
      console.error('Error deleting recommendation:', error)
      toast.error('Failed to delete recommendation')
    }
  }

  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="page-container">
        <h1>Saved Recommendations</h1>
        <p>Loading...</p>
      </div>
    )
  }

  // Story 2.7 AC: Empty state
  if (savedRecs.length === 0) {
    return (
      <div className="page-container">
        <h1>Saved Recommendations</h1>
        <div className="empty-state">
          <p>No saved recommendations yet</p>
          <p className="empty-state-hint">
            Save recommendations from your event searches to keep track of the best ad placements
          </p>
        </div>
      </div>
    )
  }

  // Story 2.7 AC: List of saved recommendations
  return (
    <div className="page-container">
      <h1>Saved Recommendations</h1>
      <p className="page-subtitle">{savedRecs.length} saved recommendation{savedRecs.length !== 1 ? 's' : ''}</p>

      <div className="saved-recs-list">
        {savedRecs.map(rec => (
          <div key={rec.id} className="saved-rec-card">
            {/* Header */}
            <div className="saved-rec-header">
              <div className="saved-rec-info">
                <h3 className="saved-rec-title">
                  {rec.recommendations?.event_data?.name || 'Saved Recommendation'}
                </h3>
                <span className="saved-rec-date">Saved {formatDate(rec.created_at)}</span>
              </div>

              {/* Story 2.9 AC: Delete button with confirmation */}
              <button
                className="delete-button"
                onClick={() => handleDelete(rec.id)}
                aria-label="Delete saved recommendation"
              >
                Delete
              </button>
            </div>

            {/* Top 3 zones preview */}
            {rec.recommendations?.zones && rec.recommendations.zones.length > 0 && (
              <div className="zones-preview">
                <h4>Top Zones:</h4>
                <ul>
                  {rec.recommendations.zones.slice(0, 3).map((zone: any, idx: number) => (
                    <li key={idx}>{zone.zone_name}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Story 2.8 AC: Notes section with 500 char limit */}
            <div className="notes-section">
              {editingNotes === rec.id ? (
                <div className="notes-edit">
                  <textarea
                    className="notes-textarea"
                    value={notesText}
                    onChange={(e) => setNotesText(e.target.value)}
                    placeholder="Add notes (max 500 characters)"
                    maxLength={500}
                  />
                  <div className="notes-actions">
                    <span className="char-count">{notesText.length}/500</span>
                    <button
                      className="save-notes-button"
                      onClick={() => handleSaveNotes(rec.id)}
                    >
                      Save
                    </button>
                    <button
                      className="cancel-button"
                      onClick={() => setEditingNotes(null)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="notes-display">
                  {rec.notes ? (
                    <>
                      <p className="notes-text">{rec.notes}</p>
                      <button
                        className="edit-notes-button"
                        onClick={() => handleEditNotes(rec.id, rec.notes)}
                      >
                        Edit note
                      </button>
                    </>
                  ) : (
                    <button
                      className="add-notes-button"
                      onClick={() => handleEditNotes(rec.id, null)}
                    >
                      Add note
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
