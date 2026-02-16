'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import toast from 'react-hot-toast'
import { saveRecommendation, unsaveRecommendation, checkIfSaved } from '@/lib/api'

interface SaveButtonProps {
  zoneId: string
  zoneName: string
  eventName: string
  eventDate: string
}

export default function SaveButton({ zoneId, zoneName, eventName, eventDate }: SaveButtonProps) {
  const { user, isLoaded } = useUser()
  const [isSaved, setIsSaved] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Check if already saved on mount
  useEffect(() => {
    const checkSavedStatus = async () => {
      if (!user?.id) return

      try {
        const result = await checkIfSaved(user.id, zoneId)
        setIsSaved(result.is_saved)
      } catch (error) {
        console.error('Error checking saved status:', error)
      }
    }

    if (isLoaded && user) {
      checkSavedStatus()
    }
  }, [user?.id, zoneId, isLoaded])

  const handleToggleSave = async () => {
    // Require authentication
    if (!user) {
      toast.error('Please sign in to save recommendations')
      return
    }

    setIsLoading(true)

    try {
      if (isSaved) {
        // Unsave
        await unsaveRecommendation(user.id, zoneId)
        setIsSaved(false)
        toast.success('Recommendation removed from saved')
      } else {
        // Save
        await saveRecommendation(user.id, zoneId, zoneName, eventName, eventDate)
        setIsSaved(true)
        toast.success('Recommendation saved!')
      }
    } catch (error: any) {
      console.error('Error toggling save:', error)
      toast.error(isSaved ? 'Failed to remove recommendation' : 'Failed to save recommendation')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button
      onClick={handleToggleSave}
      disabled={isLoading || !isLoaded}
      className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      aria-label={isSaved ? 'Remove from saved' : 'Save recommendation'}
    >
      {/* Heart icon - filled when saved, outline when not */}
      {isSaved ? (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-red-600">
          <path d="M9.653 16.915l-.005-.003-.019-.01a20.759 20.759 0 01-1.162-.682 22.045 22.045 0 01-2.582-1.9C4.045 12.733 2 10.352 2 7.5a4.5 4.5 0 018-2.828A4.5 4.5 0 0118 7.5c0 2.852-2.045 5.233-3.885 6.82a22.049 22.049 0 01-3.744 2.582l-.019.01-.005.003h-.002a.739.739 0 01-.69.001l-.002-.001z" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
        </svg>
      )}
      {isSaved ? 'Saved' : 'Save'}
    </button>
  )
}
