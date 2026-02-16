'use client'

import { forwardRef, useState } from 'react'
import { type ZoneRecommendation } from '@/lib/api'
import SaveButton from './SaveButton'
import { trackWarningOpened, trackAlternativeClicked, trackWarningClosed } from '@/lib/analytics'

interface RecommendationCardProps {
  recommendation: ZoneRecommendation
  rank: number
  eventName: string
  eventDate: string
  onHover?: (zoneId: string) => void
  onLeave?: () => void
  isHighlighted?: boolean
}

const RecommendationCard = forwardRef<HTMLDivElement, RecommendationCardProps>(
  ({ recommendation, rank, eventName, eventDate, onHover, onLeave, isHighlighted }, ref) => {
  const [isWarningPanelOpen, setIsWarningPanelOpen] = useState(false)
  const [panelOpenedAt, setPanelOpenedAt] = useState<Date | null>(null)

  const audienceMatchPercent = Math.round((recommendation.audience_match_score / 40) * 100)

  const handleWarningClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    const willOpen = !isWarningPanelOpen
    setIsWarningPanelOpen(willOpen)

    if (willOpen) {
      setPanelOpenedAt(new Date())
      const categoryNames = recommendation.risk_warning?.warning_categories?.map(
        cat => cat.category_type
      ) || []

      trackWarningOpened(
        recommendation.zone_id,
        recommendation.zone_name,
        recommendation.risk_warning?.warning_type || '',
        categoryNames,
        undefined
      )
    } else if (panelOpenedAt) {
      // Track closing
      const timeSpent = (new Date().getTime() - panelOpenedAt.getTime()) / 1000
      trackWarningClosed(
        recommendation.zone_id,
        recommendation.zone_name,
        timeSpent,
        undefined
      )
      setPanelOpenedAt(null)
    }
  }

  return (
    <div
      ref={ref}
      data-zone-id={recommendation.zone_id}
      className={`relative rounded-lg overflow-hidden transition-all duration-200 ${
        isHighlighted
          ? 'ring-2 ring-green-400'
          : ''
      }`}
      style={{ background: '#1e3a48' }}
      onMouseEnter={() => onHover?.(recommendation.zone_id)}
      onMouseLeave={() => onLeave?.()}
    >
      <div className="flex gap-3 p-3">
        {/* Thumbnail Placeholder */}
        <div
          className="flex-shrink-0 w-24 h-20 rounded-lg overflow-hidden"
          style={{ background: '#2a4551' }}
        >
          <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="flex items-center gap-2 min-w-0">
              {/* Rank Badge */}
              <div
                className="flex-shrink-0 w-7 h-7 rounded flex items-center justify-center text-sm font-bold"
                style={{ background: '#4ade80', color: '#0f1c24' }}
              >
                {rank}
              </div>
              {/* Score */}
              <span className="text-base font-bold" style={{ color: '#4ade80' }}>
                {audienceMatchPercent}%
              </span>
              <span className="text-xs" style={{ color: '#94a3b8' }}>
                / {Math.round(recommendation.overall_score)}
              </span>
            </div>

            {/* Warning Badge */}
            {recommendation.risk_warning?.is_flagged && (
              <button
                onClick={handleWarningClick}
                className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center bg-red-500 hover:bg-red-600 transition-colors"
                title="Risk warning"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-white">
                  <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
              </button>
            )}
          </div>

          {/* Zone Name */}
          <h3 className="text-sm font-semibold text-white mb-1 truncate">
            {recommendation.zone_name}
          </h3>

          {/* Details Row */}
          <div className="flex items-center gap-2 text-xs flex-wrap" style={{ color: '#94a3b8' }}>
            <span className="flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                <path fillRule="evenodd" d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 103 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 002.273 1.765 11.842 11.842 0 00.976.544l.062.029.018.008.006.003zM10 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z" clipRule="evenodd" />
              </svg>
              {recommendation.distance_miles.toFixed(1)} mi
            </span>
            {recommendation.timing_windows.length > 0 && (
              <span className="flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" />
                </svg>
                {recommendation.timing_windows[0].days.slice(0, 10)}...
              </span>
            )}
            <span className="flex items-center gap-1">
              💰 {recommendation.cost_tier}
            </span>
          </div>

          {/* Reasoning */}
          {recommendation.reasoning && (
            <p className="text-xs mt-2 leading-relaxed" style={{ color: '#94a3b8' }}>
              {recommendation.reasoning.length > 120
                ? recommendation.reasoning.substring(0, 120) + '...'
                : recommendation.reasoning}
            </p>
          )}
        </div>
      </div>

      {/* Warning Panel */}
      {isWarningPanelOpen && recommendation.risk_warning?.is_flagged && (
        <div
          className="border-t p-4 animate-in slide-in-from-top duration-200"
          style={{ borderColor: '#2a4551', background: '#152a35' }}
        >
          <div className="flex items-start gap-2 mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="#ef4444" className="w-5 h-5 flex-shrink-0 mt-0.5">
              <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
            <div>
              <h4 className="text-sm font-semibold text-white mb-1">
                {recommendation.risk_warning.warning_type}
              </h4>
              <p className="text-xs" style={{ color: '#94a3b8' }}>
                {recommendation.risk_warning.explanation}
              </p>
            </div>
          </div>

          {/* Better Alternatives */}
          {recommendation.risk_warning.better_alternatives &&
           recommendation.risk_warning.better_alternatives.length > 0 && (
            <div className="mt-3 pt-3" style={{ borderTop: '1px solid #2a4551' }}>
              <p className="text-xs font-medium mb-2" style={{ color: '#4ade80' }}>
                ✓ Better alternatives:
              </p>
              <div className="space-y-1.5">
                {recommendation.risk_warning.better_alternatives.map((alt) => (
                  <button
                    key={alt.zone_id}
                    onClick={() => {
                      trackAlternativeClicked(
                        recommendation.zone_id,
                        recommendation.zone_name,
                        alt.zone_id,
                        alt.zone_name,
                        alt.rank,
                        undefined
                      )
                      const element = document.querySelector(`[data-zone-id="${alt.zone_id}"]`)
                      element?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
                    }}
                    className="block w-full text-left px-3 py-2 rounded text-xs transition-colors"
                    style={{ background: '#1e3a48' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#2a4551'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#1e3a48'
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-semibold" style={{ color: '#4ade80' }}>
                        #{alt.rank}
                      </span>
                      <span className="text-white">{alt.zone_name}</span>
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: '#94a3b8' }}>
                      {alt.why_better}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={handleWarningClick}
            className="mt-3 text-xs font-medium hover:underline"
            style={{ color: '#94a3b8' }}
          >
            Close
          </button>
        </div>
      )}

      {/* Save Button */}
      <div className="absolute top-3 right-3">
        <SaveButton
          zoneId={recommendation.zone_id}
          zoneName={recommendation.zone_name}
          eventName={eventName}
          eventDate={eventDate}
          audienceMatch={audienceMatchPercent}
        />
      </div>
    </div>
  )
})

RecommendationCard.displayName = 'RecommendationCard'

export default RecommendationCard
