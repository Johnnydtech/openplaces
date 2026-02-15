'use client'

import { type ZoneRecommendation } from '@/lib/api'

interface RecommendationCardProps {
  recommendation: ZoneRecommendation
  rank: number
}

export default function RecommendationCard({ recommendation, rank }: RecommendationCardProps) {
  // Story 4.4: Calculate percentage for audience match (out of 40 possible points)
  const audienceMatchPercent = Math.round((recommendation.audience_match_score / 40) * 100)

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4">
        {/* Rank Badge */}
        <div className="flex-shrink-0">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white text-lg font-bold">
            #{rank}
          </div>
        </div>

        {/* Zone Details */}
        <div className="flex-1">
          {/* Zone Name */}
          <h3 className="text-xl font-bold text-gray-900">
            {recommendation.zone_name}
          </h3>

          {/* Story 4.4 AC: Audience Match Score - PROMINENT */}
          <div className="mt-2">
            <div className="inline-flex items-center rounded-full bg-green-100 px-4 py-2">
              <span className="text-2xl font-bold text-green-700">
                {audienceMatchPercent}%
              </span>
              <span className="ml-2 text-sm font-medium text-green-700">
                Audience Match
              </span>
            </div>
          </div>

          {/* Distance & Timing */}
          <div className="mt-3 flex flex-wrap gap-4 text-sm text-gray-600">
            <div>
              <span className="font-medium">Distance:</span> {recommendation.distance_miles.toFixed(1)} mi
            </div>
            {recommendation.timing_windows[0] && (
              <div>
                <span className="font-medium">Best times:</span>{' '}
                {recommendation.timing_windows[0].days} {recommendation.timing_windows[0].hours}
              </div>
            )}
            <div>
              <span className="font-medium">Cost:</span> {recommendation.cost_tier}
            </div>
          </div>

          {/* Total Score Bar */}
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
              <span>Overall Score</span>
              <span className="font-medium">{recommendation.total_score.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${recommendation.total_score}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
