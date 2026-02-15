'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import toast, { Toaster } from 'react-hot-toast'
import RecommendationCard from '@/components/RecommendationCard'
import { getRecommendations, type EventDataForRecommendations, type ZoneRecommendation } from '@/lib/api'

function RecommendationsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [recommendations, setRecommendations] = useState<ZoneRecommendation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [eventData, setEventData] = useState<EventDataForRecommendations | null>(null)

  useEffect(() => {
    const eventDataParam = searchParams.get('eventData')
    if (!eventDataParam) {
      toast.error('No event data provided')
      router.push('/upload')
      return
    }

    const parsedEventData: EventDataForRecommendations = JSON.parse(eventDataParam)
    setEventData(parsedEventData)

    const fetchRecommendations = async () => {
      setIsLoading(true)
      try {
        toast.loading('Generating recommendations...', { id: 'recommendations' })

        const results = await getRecommendations(parsedEventData)
        setRecommendations(results)

        toast.success(`Found ${results.length} recommendations!`, { id: 'recommendations' })
      } catch (error: any) {
        console.error('Error fetching recommendations:', error)
        toast.error('Failed to generate recommendations', { id: 'recommendations' })
      } finally {
        setIsLoading(false)
      }
    }

    fetchRecommendations()
  }, [searchParams, router])

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <Toaster position="top-center" />

      {/* Header */}
      <nav className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">OpenPlaces</h1>
          <button
            onClick={() => router.push('/upload')}
            className="text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            ← Back to Upload
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-12">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">
            Placement Recommendations
          </h2>
          {eventData && (
            <p className="mt-2 text-lg text-gray-600">
              For {eventData.name} on {eventData.date}
            </p>
          )}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse rounded-lg border border-gray-200 bg-white p-6">
                <div className="h-24 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        )}

        {/* Recommendations List */}
        {!isLoading && recommendations.length > 0 && (
          <div className="space-y-4">
            {recommendations.map((recommendation, index) => (
              <RecommendationCard
                key={recommendation.zone_id}
                recommendation={recommendation}
                rank={index + 1}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && recommendations.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600">No recommendations found. Try different event details.</p>
            <button
              onClick={() => router.push('/upload')}
              className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
            >
              Try Again
            </button>
          </div>
        )}
      </main>
    </div>
  )
}

export default function RecommendationsPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <RecommendationsContent />
    </Suspense>
  )
}
