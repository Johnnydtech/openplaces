'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import toast, { Toaster } from 'react-hot-toast'
import SavedRecommendationCard from '@/components/SavedRecommendationCard'
import { getSavedRecommendations, type SavedRecommendation } from '@/lib/api'

export default function SavedRecommendationsPage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const [savedRecommendations, setSavedRecommendations] = useState<SavedRecommendation[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchSavedRecommendations = async () => {
      if (!isLoaded) return

      if (!user) {
        router.push('/sign-in')
        return
      }

      try {
        const saved = await getSavedRecommendations(user.id)
        setSavedRecommendations(saved)
      } catch (error: any) {
        console.error('Error fetching saved recommendations:', error)
        toast.error('Failed to load saved recommendations')
      } finally {
        setIsLoading(false)
      }
    }

    fetchSavedRecommendations()
  }, [user, isLoaded, router])

  if (!isLoaded || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
        <Toaster position="top-center" />
        <main className="mx-auto max-w-7xl px-4 py-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Saved Recommendations</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse rounded-lg border border-gray-200 bg-white p-6">
                <div className="h-24 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <Toaster position="top-center" />

      <nav className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">OpenPlaces</h1>
          <button
            onClick={() => router.push('/upload')}
            className="text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            Upload New Flyer
          </button>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">
          Saved Recommendations
        </h2>

        {savedRecommendations.length === 0 && (
          <div className="text-center py-16">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="mx-auto h-16 w-16 text-gray-400 mb-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No saved recommendations yet
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Upload a flyer and save your favorite zones to build your placement strategy library
            </p>
            <button
              onClick={() => router.push('/upload')}
              className="inline-flex items-center rounded-lg bg-blue-600 px-6 py-3 text-white font-medium hover:bg-blue-700"
            >
              Get Started
            </button>
          </div>
        )}

        {savedRecommendations.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedRecommendations.map((saved) => (
              <SavedRecommendationCard
                key={saved.id}
                savedRecommendation={saved}
                onDelete={(id) => {
                  setSavedRecommendations(prev => prev.filter(s => s.id !== id))
                }}
                onNotesUpdate={(id, newNotes) => {
                  setSavedRecommendations(prev => prev.map(s =>
                    s.id === id ? { ...s, notes: newNotes } : s
                  ))
                }}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
