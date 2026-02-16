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

      // Update parent state
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

  // Story 2.9: Delete with confirmation
  const handleDelete = async () => {
    if (!user) return

    // Browser confirmation dialog
    const confirmed = window.confirm(
      'Are you sure you want to delete this recommendation? This action cannot be undone.'
    )

    if (!confirmed) return

    try {
      // Delete via API
      await deleteSavedRecommendation(user.id, savedRecommendation.id)

      // Call parent onDelete to remove from UI
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
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
      {/* Event Name */}
      <h3 className="text-lg font-bold text-gray-900 mb-2">
        {savedRecommendation.event_name}
      </h3>

      {/* Date Saved */}
      <p className="text-sm text-gray-500 mb-4">
        Saved {formatDate(savedRecommendation.created_at)}
      </p>

      {/* Top Zone */}
      <div className="rounded-lg bg-blue-50 p-3 mb-4">
        <p className="text-sm font-medium text-blue-900 mb-1">
          Top Zone
        </p>
        <p className="text-base font-semibold text-blue-800">
          {savedRecommendation.zone_name}
        </p>
      </div>

      {/* Story 2.8: Notes Section with Add/Edit functionality */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-medium text-gray-700">Notes:</p>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              {savedRecommendation.notes ? 'Edit note' : 'Add note'}
            </button>
          )}
        </div>

        {!isEditing ? (
          // Display mode
          savedRecommendation.notes ? (
            <p className="text-sm text-gray-600 line-clamp-3">
              {savedRecommendation.notes}
            </p>
          ) : (
            <p className="text-sm text-gray-400 italic">
              No notes yet
            </p>
          )
        ) : (
          // Edit mode
          <div className="space-y-2">
            <textarea
              value={editedNotes}
              onChange={(e) => setEditedNotes(e.target.value)}
              placeholder="Add notes about this placement strategy..."
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              rows={4}
              maxLength={500}
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">
                {editedNotes.length}/500 characters
              </span>
              <div className="flex gap-2">
                <button
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                  className="rounded px-3 py-1.5 text-xs font-medium text-gray-700 border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveNotes}
                  disabled={isSaving || editedNotes.length > 500}
                  className="rounded px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
          className="flex-1 rounded-lg border border-blue-600 bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          View Details
        </button>
        <button
          onClick={handleDelete}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Delete
        </button>
      </div>
    </div>
  )
}
