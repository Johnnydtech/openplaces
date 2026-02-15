/**
 * Story 4.3: Display Top 10 Ranked Zone Recommendations
 * Story 2 (Auth): Anonymous users see top 3, authenticated users see all 10
 *
 * Component that displays a list of zone recommendations with loading/error states
 */

import { ZoneRecommendation } from '../api/recommendations'
import RecommendationCard from './RecommendationCard'
import './RecommendationsList.css'

interface RecommendationsListProps {
  recommendations: ZoneRecommendation[]
  isAuthenticated: boolean
  isLoading?: boolean
  error?: string | null
  onRetry?: () => void
  onHighlightZone?: (zoneId: string) => void
  highlightedZoneId?: string | null
}

export default function RecommendationsList({
  recommendations,
  isAuthenticated,
  isLoading = false,
  error = null,
  onRetry,
  onHighlightZone,
  highlightedZoneId = null
}: RecommendationsListProps) {

  // Story 4.3 AC: Top 10 for authenticated, top 3 for anonymous
  const displayLimit = isAuthenticated ? 10 : 3
  const displayedRecommendations = recommendations.slice(0, displayLimit)
  const hasMore = recommendations.length > displayLimit

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
        <h2>Recommended Placement Zones</h2>
        <p className="list-subtitle">
          {isAuthenticated
            ? `Top ${displayedRecommendations.length} placement zones ranked by match for your event`
            : `Top ${displayedRecommendations.length} placement zones • Sign up to see all ${recommendations.length}`}
        </p>
      </div>

      {/* Recommendations Cards */}
      <div className="recommendations-cards">
        {displayedRecommendations.map((recommendation, index) => (
          <RecommendationCard
            key={recommendation.zone_id}
            recommendation={recommendation}
            rank={index + 1}
            onClick={() => onHighlightZone?.(recommendation.zone_id)}
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
              <h3>Want to see all {recommendations.length} recommended zones?</h3>
              <p>Sign up for free to access the complete rankings and save your recommendations.</p>
            </div>
            <button className="auth-prompt-button">Sign Up Free</button>
          </div>
        </div>
      )}

      {/* Data Freshness Footer */}
      <div className="list-footer">
        <p className="data-freshness">
          Based on data from {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </p>
        <button className="how-it-works-button" onClick={() => {
          // TODO: Open modal explaining algorithm (Story 4.13)
          alert('Algorithm explanation coming in Story 4.13')
        }}>
          How does this work?
        </button>
      </div>
    </div>
  )
}
