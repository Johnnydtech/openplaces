'use client'

import { useState } from 'react'
import { useUser } from '@clerk/nextjs'
import toast from 'react-hot-toast'
import { type SavedRecommendation, updateSavedRecommendationNotes, deleteSavedRecommendation } from '@/lib/api'

interface SavedRecommendationCardProps {
  savedRecommendation: SavedRecommendation
  onDelete?: (id: string) => void
  onNotesUpdate?: (id: string, newNotes: string) => void
}

export default function SavedRecommendationCard({
  savedRecommendation,
  onDelete,
  onNotesUpdate
}: SavedRecommendationCardProps) {
  const { user } = useUser()
  const [isEditing, setIsEditing] = useState(false)
  const [editedNotes, setEditedNotes] = useState(savedRecommendation.notes || '')
  const [isSaving, setIsSaving] = useState(false)

  const handleSaveNotes = async () => {
    if (!user) return
    if (editedNotes.length > 500) {
      toast.error('Notes cannot exceed 500 characters')
      return
    }

    setIsSaving(true)
    try {
      await updateSavedRecommendationNotes(user.id, savedRecommendation.id, editedNotes)

      onNotesUpdate?.(savedRecommendation.id, editedNotes)

      setIsEditing(false)
      toast.success('Note saved!')
    } catch (error: any) {
      console.error('Error updating notes:', error)
      toast.error('Failed to save note')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancelEdit = () => {
    setEditedNotes(savedRecommendation.notes || '')
    setIsEditing(false)
  }

  const handleDelete = async () => {
    if (!user) return

    const confirmed = window.confirm(
      'Are you sure you want to delete this recommendation? This action cannot be undone.'
    )

    if (!confirmed) return

    try {
      await deleteSavedRecommendation(user.id, savedRecommendation.id)

      onDelete?.(savedRecommendation.id)

      toast.success('Recommendation deleted')
    } catch (error: any) {
      console.error('Error deleting recommendation:', error)
      toast.error('Failed to delete recommendation')
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow" style={{ background: '#1a2f3a' }}>
      {/* Event Name */}
      <h3 className="text-lg font-bold text-white mb-2">
        {savedRecommendation.event_name}
      </h3>

      {/* Date Saved */}
      <p className="text-sm mb-4" style={{ color: '#94a3b8' }}>
        Saved {formatDate(savedRecommendation.created_at)}
      </p>

      {/* Top Zone */}
      <div className="rounded-lg p-3 mb-4" style={{ background: '#1e3a48' }}>
        <p className="text-xs font-medium mb-1" style={{ color: '#4ade80' }}>
          TOP ZONE
        </p>
        <p className="text-base font-semibold text-white">
          {savedRecommendation.zone_name}
        </p>
      </div>

      {/* Notes Section */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-medium text-white">NOTES</p>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="text-xs font-medium hover:underline"
              style={{ color: '#4ade80' }}
            >
              {savedRecommendation.notes ? 'Edit' : 'Add'}
            </button>
          )}
        </div>

        {!isEditing ? (
          savedRecommendation.notes ? (
            <p className="text-sm line-clamp-3" style={{ color: '#94a3b8' }}>
              {savedRecommendation.notes}
            </p>
          ) : (
            <p className="text-sm italic" style={{ color: '#94a3b8' }}>
              No notes yet
            </p>
          )
        ) : (
          <div className="space-y-2">
            <textarea
              value={editedNotes}
              onChange={(e) => setEditedNotes(e.target.value)}
              placeholder="Add notes about this placement strategy..."
              className="w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 text-white"
              style={{
                background: '#1e3a48',
                borderColor: '#2a4551',
                '--tw-ring-color': '#4ade80'
              } as React.CSSProperties}
              rows={4}
              maxLength={500}
            />
            <div className="flex items-center justify-between">
              <span className="text-xs" style={{ color: '#94a3b8' }}>
                {editedNotes.length}/500 characters
              </span>
              <div className="flex gap-2">
                <button
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                  className="rounded px-3 py-1.5 text-xs font-medium border transition-colors disabled:opacity-50"
                  style={{
                    color: '#94a3b8',
                    borderColor: '#2a4551',
                    background: 'transparent'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSaving) e.currentTarget.style.background = '#1e3a48'
                  }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveNotes}
                  disabled={isSaving || editedNotes.length > 500}
                  className="rounded px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: '#4ade80', color: '#0f1c24' }}
                  onMouseEnter={(e) => {
                    if (!isSaving && editedNotes.length <= 500) {
                      e.currentTarget.style.background = '#22c55e'
                    }
                  }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = '#4ade80' }}
                >
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          className="flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
          style={{ background: '#4ade80', color: '#0f1c24' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#22c55e' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#4ade80' }}
        >
          View Details
        </button>
        <button
          onClick={handleDelete}
          className="rounded-lg border px-4 py-2 text-sm font-medium transition-colors"
          style={{ borderColor: '#2a4551', color: '#94a3b8' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#1e3a48'
            e.currentTarget.style.color = '#ef4444'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = '#94a3b8'
          }}
        >
          Delete
        </button>
      </div>
    </div>
  )
}
