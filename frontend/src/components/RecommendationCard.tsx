/**
 * Story 4.3: Display Zone Recommendation Card
 * Story 4.4: Display Audience Match Score
 * Story 4.5: Calculate and Display Distance from Venue
 * Story 4.6: Display Timing Windows
 * Story 4.7: Display Cost Tier Indicators
 * Story 4.9: Display Transparent Reasoning
 *
 * Component that displays a single zone recommendation with all details
 */

import { ZoneRecommendation } from '../api/recommendations'
import './RecommendationCard.css'

interface RecommendationCardProps {
  recommendation: ZoneRecommendation
  rank: number
  onClick?: () => void
  isHighlighted?: boolean
}

export default function RecommendationCard({
  recommendation,
  rank,
  onClick,
  isHighlighted = false
}: RecommendationCardProps) {

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

      {/* Zone Name */}
      <h3 className="zone-name">{recommendation.zone_name}</h3>

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

      {/* Story 4.6 AC: Timing Windows - "Best Times" section */}
      {recommendation.timing_windows && recommendation.timing_windows.length > 0 && (
        <div className="timing-section">
          <h4 className="section-title">Best Times</h4>
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

      {/* Story 4.9 AC: Transparent Reasoning - "Why this works" */}
      {recommendation.reasoning && (
        <div className="reasoning-section">
          <h4 className="section-title">Why this works</h4>
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

      {/* Score Breakdown */}
      <div className="score-breakdown">
        <div className="score-item">
          <span className="score-label">Total Score:</span>
          <span className="score-value">{Math.round(recommendation.total_score)}</span>
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
