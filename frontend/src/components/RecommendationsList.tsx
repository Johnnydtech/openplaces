/**
 * Story 4.3: Display Top 10 Ranked Zone Recommendations
 * Story 2 (Auth): Anonymous users see top 3, authenticated users see all 10
 *
 * Component that displays a list of zone recommendations with loading/error states
 */

import { useState } from 'react'
import { ZoneRecommendation } from '../api/recommendations'
import RecommendationCard from './RecommendationCard'
import AlgorithmExplanationModal from './AlgorithmExplanationModal'
import './RecommendationsList.css'

interface RecommendationsListProps {
  recommendations: ZoneRecommendation[]
  isAuthenticated: boolean
  isLoading?: boolean
  error?: string | null
  onRetry?: () => void
  onHighlightZone?: (zoneId: string) => void
  highlightedZoneId?: string | null
  onEditDetails?: () => void  // Story 4.8: Edit event details callback
}

export default function RecommendationsList({
  recommendations,
  isAuthenticated,
  isLoading = false,
  error = null,
  onRetry,
  onHighlightZone,
  highlightedZoneId = null,
  onEditDetails
}: RecommendationsListProps) {

  // Story 4.13: Modal state for algorithm explanation
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Story 4.3 AC: Top 10 for authenticated, top 3 for anonymous
  const displayLimit = isAuthenticated ? 10 : 3
  const displayedRecommendations = recommendations.slice(0, displayLimit)
  const hasMore = recommendations.length > displayLimit

  // Story 4.12: Calculate oldest data source date
  const getOldestDataDate = (): Date | null => {
    if (recommendations.length === 0) return null

    let oldestDate: Date | null = null

    recommendations.forEach(rec => {
      rec.data_sources?.forEach(source => {
        const sourceDate = new Date(source.last_updated)
        if (!oldestDate || sourceDate < oldestDate) {
          oldestDate = sourceDate
        }
      })
    })

    return oldestDate
  }

  const oldestDate = getOldestDataDate()
  const daysSinceUpdate = oldestDate
    ? Math.floor((new Date().getTime() - oldestDate.getTime()) / (1000 * 60 * 60 * 24))
    : 0
  const isDataStale = daysSinceUpdate > 30

  // Story 4.3 AC: Loading state with progress indicator
  if (isLoading) {
    return (
      <div className="recommendations-list">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p className="loading-text">Finding the best placement zones for your event...</p>
          <p className="loading-hint">This usually takes 5-10 seconds</p>
        </div>
      </div>
    )
  }

  // Story 4.3 AC: Error state with retry button
  if (error) {
    return (
      <div className="recommendations-list">
        <div className="error-state">
          <svg
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <h3>Unable to Generate Recommendations</h3>
          <p className="error-message">{error}</p>
          {onRetry && (
            <button className="retry-button" onClick={onRetry}>
              Try Again
            </button>
          )}
        </div>
      </div>
    )
  }

  // Story 4.3 AC: Empty state if no zones qualify
  if (recommendations.length === 0) {
    return (
      <div className="recommendations-list">
        <div className="empty-state">
          <svg
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="16" />
            <line x1="8" y1="12" x2="16" y2="12" />
          </svg>
          <h3>No Placement Zones Found</h3>
          <p>We couldn't find any suitable placement zones for your event criteria.</p>
          <p>Try adjusting your event details or target audience.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="recommendations-list">
      {/* Header Section */}
      <div className="list-header">
        <div className="header-content">
          <div className="header-text">
            <h2>Placement Zone Signals</h2>
            <p className="list-subtitle">
              {isAuthenticated
                ? `Data shows ${displayedRecommendations.length} high-potential zones for your event`
                : `Showing ${displayedRecommendations.length} zones • Sign up to view all ${recommendations.length} insights`}
            </p>
          </div>
          {/* Story 4.8: Edit Event Details button triggers re-ranking */}
          {onEditDetails && (
            <button className="edit-details-button" onClick={onEditDetails}>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              Edit Event Details
            </button>
          )}
        </div>
      </div>

      {/* Recommendations Cards */}
      <div className="recommendations-cards">
        {displayedRecommendations.map((recommendation, index) => (
          <RecommendationCard
            key={recommendation.zone_id}
            recommendation={recommendation}
            rank={index + 1}
            onClick={() => onHighlightZone?.(recommendation.zone_id)}
            onHover={(isHovering) => {
              // Story 5.7: Hover list item to highlight map zone
              onHighlightZone?.(isHovering ? recommendation.zone_id : null)
            }}
            isHighlighted={highlightedZoneId === recommendation.zone_id}
          />
        ))}
      </div>

      {/* Story 2 AC: "Sign up to see all 10" message for anonymous users */}
      {hasMore && !isAuthenticated && (
        <div className="auth-prompt">
          <div className="auth-prompt-content">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <div className="auth-prompt-text">
              <h3>More insights available</h3>
              <p>Sign up (it's free) to view all {recommendations.length} zone insights and save them for later reference.</p>
            </div>
            <button className="auth-prompt-button">Create Free Account</button>
          </div>
        </div>
      )}

      {/* Story 4.12: Data Freshness Footer with oldest data date */}
      <div className="list-footer">
        <div className="data-freshness-container">
          <p className="data-freshness">
            {oldestDate
              ? `Based on data from ${oldestDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
              : `Based on data from ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
          </p>
          {isDataStale && (
            <p className="data-freshness-warning">
              ⚠️ Data may be outdated - recommendations are based on historical patterns
            </p>
          )}
        </div>
        <button className="how-it-works-button" onClick={() => setIsModalOpen(true)}>
          How does this work?
        </button>
      </div>

      {/* Story 4.13: Algorithm explanation modal */}
      <AlgorithmExplanationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  )
}
