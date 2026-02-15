/**
 * Story 4.3: Display Zone Recommendation Card
 * Story 4.4: Display Audience Match Score
 * Story 4.5: Calculate and Display Distance from Venue
 * Story 4.6: Display Timing Windows
 * Story 4.7: Display Cost Tier Indicators
 * Story 4.9: Display Transparent Reasoning
 * Story 2.6: Save Recommendation Functionality
 *
 * Component that displays a single zone recommendation with all details
 */

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/clerk-react'
import { ZoneRecommendation } from '../api/recommendations'
import toast from 'react-hot-toast'
import './RecommendationCard.css'

interface RecommendationCardProps {
  recommendation: ZoneRecommendation
  rank: number
  onClick?: () => void
  onHover?: (isHovering: boolean) => void  // Story 5.7: Hover to highlight map
  isHighlighted?: boolean
}

export default function RecommendationCard({
  recommendation,
  rank,
  onClick,
  onHover,
  isHighlighted = false
}: RecommendationCardProps) {
  // Story 2.6: Save functionality state
  const { user, isSignedIn } = useUser()
  const [isSaved, setIsSaved] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Story 2.6 AC: Check if recommendation is already saved
  useEffect(() => {
    if (!isSignedIn || !recommendation.zone_id) return

    const checkSavedStatus = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/saved-recommendations/check/${recommendation.zone_id}`,
          {
            headers: {
              'X-Clerk-User-Id': user!.id
            }
          }
        )
        const data = await response.json()
        setIsSaved(data.is_saved)
      } catch (error) {
        console.error('Error checking saved status:', error)
      }
    }

    checkSavedStatus()
  }, [isSignedIn, user, recommendation.zone_id])

  // Story 2.6 AC: Save button handler
  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent card click event

    if (!isSignedIn) {
      toast.error('Please sign in to save recommendations')
      return
    }

    setIsSaving(true)

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/saved-recommendations/save`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Clerk-User-Id': user!.id
          },
          body: JSON.stringify({
            recommendation_id: recommendation.zone_id
          })
        }
      )

      const data = await response.json()

      if (data.status === 'success') {
        setIsSaved(true)
        toast.success('Recommendation saved!') // Story 2.6 AC: Success toast
      } else if (data.status === 'already_saved') {
        setIsSaved(true)
        toast('Already saved!', { icon: '✓' })
      } else {
        toast.error('Failed to save recommendation')
      }
    } catch (error) {
      console.error('Error saving recommendation:', error)
      toast.error('Failed to save recommendation')
    } finally {
      setIsSaving(false)
    }
  }

  // Story 4.3 AC: Rank badge color coding (top 3 green, 4-7 yellow, 8-10 orange)
  const getRankBadgeColor = (rankNum: number): string => {
    if (rankNum <= 3) return 'rank-badge-green'
    if (rankNum <= 7) return 'rank-badge-yellow'
    return 'rank-badge-orange'
  }

  // Story 4.4 AC: Audience match color coding (80-100% green, 60-79% yellow, <60% orange)
  const getAudienceMatchColor = (percentage: number): string => {
    if (percentage >= 80) return 'audience-match-green'
    if (percentage >= 60) return 'audience-match-yellow'
    return 'audience-match-orange'
  }

  // Story 4.7 AC: Cost tier display
  const getCostTierDisplay = (tier: string): string => {
    switch (tier.toLowerCase()) {
      case 'free':
        return 'Free'
      case 'low':
        return '$'
      case 'medium':
        return '$$'
      case 'high':
        return '$$$'
      default:
        return tier
    }
  }

  // Story 4.5 AC: Distance formatting (<0.5 miles shows "< 0.5 mi")
  const formatDistance = (miles: number): string => {
    if (miles < 0.5) return '< 0.5 mi'
    return `${miles.toFixed(1)} mi`
  }

  // Format audience match percentage
  const audienceMatchPercentage = Math.round(recommendation.audience_match_score * 100)

  return (
    <div
      className={`recommendation-card ${isHighlighted ? 'highlighted' : ''}`}
      onClick={onClick}
      onMouseEnter={() => onHover?.(true)}  // Story 5.7: Hover to highlight map zone
      onMouseLeave={() => onHover?.(false)}
      role="button"
      tabIndex={0}
      onKeyPress={(e) => {
        if (e.key === 'Enter' && onClick) onClick()
      }}
    >
      {/* Story 4.3 AC: Rank badge */}
      <div className={`rank-badge ${getRankBadgeColor(rank)}`}>
        #{rank}
      </div>

      {/* Header with Zone Name and Save Button */}
      <div className="card-header">
        {/* Zone Name */}
        <h3 className="zone-name">{recommendation.zone_name}</h3>

        {/* Story 2.6 AC: Save button (shows for signed-in users) */}
        {isSignedIn && (
          <button
            className={`save-button ${isSaved ? 'saved' : ''}`}
            onClick={handleSave}
            disabled={isSaving || isSaved}
            aria-label={isSaved ? 'Recommendation saved' : 'Save recommendation'}
          >
            {isSaved ? (
              <>
                <span className="save-icon">✓</span>
                <span className="save-text">Saved</span>
              </>
            ) : (
              <>
                <span className="save-icon">☆</span>
                <span className="save-text">{isSaving ? 'Saving...' : 'Save'}</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Main Metrics Row */}
      <div className="metrics-row">
        {/* Story 4.4 AC: Audience Match Score with color coding */}
        <div className="metric">
          <span className="metric-label">Audience Match</span>
          <span className={`metric-value ${getAudienceMatchColor(audienceMatchPercentage)}`}>
            {audienceMatchPercentage}%
          </span>
        </div>

        {/* Story 4.5 AC: Distance from Venue */}
        <div className="metric">
          <span className="metric-label">Distance</span>
          <span className="metric-value">
            {formatDistance(recommendation.distance_miles)}
          </span>
        </div>

        {/* Story 4.7 AC: Cost Tier Indicator */}
        <div className="metric">
          <span className="metric-label">Cost</span>
          <span className="metric-value cost-tier">
            {getCostTierDisplay(recommendation.cost_tier)}
          </span>
        </div>
      </div>

      {/* Story 4.6 AC: Timing Windows - "Optimal Times" section */}
      {recommendation.timing_windows && recommendation.timing_windows.length > 0 && (
        <div className="timing-section">
          <h4 className="section-title">Optimal Times</h4>
          <div className="timing-windows">
            {recommendation.timing_windows.map((window, idx) => (
              <div key={idx} className="timing-window">
                <span className="timing-days">{window.days}</span>
                <span className="timing-hours">{window.hours}</span>
                {window.reasoning && (
                  <span className="timing-reasoning">{window.reasoning}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Story 4.9 AC: Transparent Reasoning - "What the data shows" (Story 4.14: signal-based language) */}
      {recommendation.reasoning && (
        <div className="reasoning-section">
          <h4 className="section-title">What the data shows</h4>
          <p className="reasoning-text">{recommendation.reasoning}</p>
        </div>
      )}

      {/* Story 4.10 AC: Data Sources Section */}
      {recommendation.data_sources && recommendation.data_sources.length > 0 && (
        <div className="data-sources-section">
          <h4 className="section-title">Data Sources</h4>
          <ul className="data-sources-list">
            {recommendation.data_sources.map((source, idx) => (
              <li key={idx} className="data-source-item">
                <span className="data-source-status">
                  {source.status === 'detected' ? '✓' : '○'}
                </span>
                <span className="data-source-name">{source.name}</span>
                {source.details && (
                  <span className="data-source-details">— {source.details}</span>
                )}
                <span className="data-source-date">(Updated: {source.last_updated})</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Story 4.11 AC: Score Breakdown with Percentages */}
      <div className="score-breakdown">
        <h4 className="section-title">Scoring Breakdown</h4>
        <div className="score-components">
          {/* Audience Match: X/40 pts (Y%) */}
          <div className="score-component">
            <span className="component-label">Audience Match:</span>
            <span className="component-value">
              {recommendation.audience_match_score.toFixed(1)}/40 pts
            </span>
            <span className="component-percentage">
              ({Math.round((recommendation.audience_match_score / 40) * 100)}%)
            </span>
          </div>

          {/* Timing: X/30 pts (Y%) */}
          <div className="score-component">
            <span className="component-label">Timing:</span>
            <span className="component-value">
              {recommendation.temporal_score.toFixed(1)}/30 pts
            </span>
            <span className="component-percentage">
              ({Math.round((recommendation.temporal_score / 30) * 100)}%)
            </span>
          </div>

          {/* Distance: X/20 pts (Y mi) */}
          <div className="score-component">
            <span className="component-label">Distance:</span>
            <span className="component-value">
              {recommendation.distance_score.toFixed(1)}/20 pts
            </span>
            <span className="component-percentage">
              ({formatDistance(recommendation.distance_miles)})
            </span>
          </div>

          {/* Dwell Time: X/10 pts (Y seconds) */}
          <div className="score-component">
            <span className="component-label">Dwell Time:</span>
            <span className="component-value">
              {recommendation.dwell_time_score.toFixed(1)}/10 pts
            </span>
            <span className="component-percentage">
              ({recommendation.dwell_time_seconds}s)
            </span>
          </div>

          {/* Total Score */}
          <div className="score-total">
            <span className="total-label">Total Score:</span>
            <span className="total-value">{recommendation.total_score.toFixed(1)}/100</span>
          </div>
        </div>
      </div>

      {/* Hover tooltip for audience match details */}
      {recommendation.matched_signals && recommendation.matched_signals.length > 0 && (
        <div className="match-details-tooltip">
          <strong>Matched signals:</strong>
          <ul>
            {recommendation.matched_signals.map((signal, idx) => (
              <li key={idx}>{signal}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
