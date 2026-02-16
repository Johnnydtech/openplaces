'use client'

import { forwardRef, useState } from 'react'
import { type ZoneRecommendation } from '@/lib/api'
import SaveButton from './SaveButton'

interface RecommendationCardProps {
  recommendation: ZoneRecommendation
  rank: number
  eventName: string
  eventDate: string
  onHover?: (zoneId: string) => void  // Story 5.7: Hover to highlight map
  onLeave?: () => void                 // Story 5.7: Unhover
  isHighlighted?: boolean              // Story 5.8: Highlight when map marker hovered
}

const RecommendationCard = forwardRef<HTMLDivElement, RecommendationCardProps>(
  ({ recommendation, rank, eventName, eventDate, onHover, onLeave, isHighlighted }, ref) => {
  // Story 7.3: Track warning panel open state
  const [isWarningPanelOpen, setIsWarningPanelOpen] = useState(false)

  // Story 4.4: Calculate percentage for audience match (out of 40 possible points)
  const audienceMatchPercent = Math.round((recommendation.audience_match_score / 40) * 100)
  // Story 4.11: Calculate percentages for all scoring components
  const temporalPercent = Math.round((recommendation.temporal_score / 30) * 100)
  const distancePercent = Math.round((recommendation.distance_score / 20) * 100)
  const dwellTimePercent = Math.round((recommendation.dwell_time_score / 10) * 100)

  return (
    <div
      ref={ref}
      data-zone-id={recommendation.zone_id}  // Story 7.4: For alternative scrolling
      className={`relative rounded-lg border p-6 shadow-sm hover:shadow-md transition-all duration-100 ${
        isHighlighted
          ? 'border-blue-500 border-2 bg-blue-50 scale-[1.02]'
          : 'border-gray-200 bg-white'
      }`}
      onMouseEnter={() => onHover?.(recommendation.zone_id)}
      onMouseLeave={() => onLeave?.()}
    >
      {/* Story 7.2: Risk Warning Badge */}
      {/* Story 7.6: Enhanced visual prominence */}
      {recommendation.risk_warning?.is_flagged && (
        <div
          className="absolute top-4 right-4 group cursor-pointer"
          onClick={(e) => {
            e.stopPropagation()
            setIsWarningPanelOpen(!isWarningPanelOpen)
          }}
          title="Risk Warning - Click for details"
        >
          <div className="relative flex items-center justify-center w-10 h-10 bg-red-500 rounded-full shadow-lg animate-pulse">
            {/* Stronger pulsing ring effect */}
            <div className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-75"></div>

            {/* Warning icon */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-6 h-6 text-white relative z-10"
            >
              <path
                fillRule="evenodd"
                d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
                clipRule="evenodd"
              />
            </svg>

            {/* Story 7.5 + 7.6 + 7.7: Enhanced tooltip with protective framing */}
            <div className="absolute top-full right-0 mt-2 px-4 py-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 border border-gray-700">
              <div className="font-bold mb-1.5 text-red-400">⚠️ Worth Knowing</div>
              {recommendation.risk_warning.warning_categories &&
               recommendation.risk_warning.warning_categories.length > 0 && (
                <div className="text-xs space-y-1">
                  {recommendation.risk_warning.warning_categories.map((cat) => (
                    <div key={cat.category_type} className="flex items-center gap-1.5">
                      <span className="text-base">{cat.icon}</span>
                      <span className="font-medium">{cat.display_name}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="text-xs mt-2 opacity-75 text-gray-300">Click to learn more</div>
              <div className="absolute bottom-full right-4 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-900"></div>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-start gap-4">
        {/* Rank Badge */}
        <div className="flex-shrink-0">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white text-lg font-bold">
            #{rank}
          </div>
        </div>

        {/* Zone Details */}
        <div className="flex-1">
          {/* Header with Zone Name and Save Button */}
          <div className="flex items-start justify-between gap-4">
            <h3 className="text-xl font-bold text-gray-900">
              {recommendation.zone_name}
            </h3>
            {/* Story 2.6: Save button */}
            <SaveButton
              zoneId={recommendation.zone_id}
              zoneName={recommendation.zone_name}
              eventName={eventName}
              eventDate={eventDate}
            />
          </div>

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
            {/* Story 4.5: Enhanced distance display with location icon */}
            <div className="flex items-center gap-1">
              {/* Location pin icon */}
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-gray-500">
                <path fillRule="evenodd" d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 103 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 002.273 1.765 11.842 11.842 0 00.976.544l.062.029.018.008.006.003zM10 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z" clipRule="evenodd" />
              </svg>
              <span className="font-semibold">Distance:</span>
              <span className="font-semibold">{recommendation.distance_miles.toFixed(1)} mi</span>
              {recommendation.distance_miles < 1 && (
                <span className="ml-1 text-xs font-medium text-green-600">· Nearby</span>
              )}
            </div>
            {/* Story 4.6: Enhanced timing windows display with clock icon */}
            {recommendation.timing_windows.length > 0 && (
              <div className="flex items-center gap-1">
                {/* Clock icon */}
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-gray-500">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" />
                </svg>
                <span className="font-semibold">Best times:</span>
                <span className="font-semibold">
                  {recommendation.timing_windows
                    .map(window => `${window.days} ${window.hours}`)
                    .join(' · ')}
                </span>
              </div>
            )}
            {/* Story 4.7: Enhanced cost tier display with currency icon */}
            <div className="flex items-center gap-1">
              {/* Currency/banknotes icon */}
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-gray-500">
                <path d="M10.75 10.818v2.614A3.13 3.13 0 0011.888 13c.482-.315.612-.648.612-.875 0-.227-.13-.56-.612-.875a3.13 3.13 0 00-1.138-.432zM8.33 8.62c.053.055.115.11.184.164.208.16.46.284.736.363V6.603a2.45 2.45 0 00-.35.13c-.14.065-.27.143-.386.233-.377.292-.514.627-.514.909 0 .184.058.39.202.592.037.051.08.102.128.152z" />
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-6a.75.75 0 01.75.75v.316a3.78 3.78 0 011.653.713c.426.33.744.74.925 1.2a.75.75 0 01-1.395.55 1.35 1.35 0 00-.447-.563 2.187 2.187 0 00-.736-.363V9.3c.698.093 1.383.32 1.959.696.787.514 1.29 1.27 1.29 2.13 0 .86-.504 1.616-1.29 2.13-.576.377-1.261.603-1.96.696v.299a.75.75 0 11-1.5 0v-.3c-.697-.092-1.382-.318-1.958-.695-.482-.315-.857-.717-1.078-1.188a.75.75 0 111.359-.636c.08.173.245.376.54.569.313.205.706.353 1.138.432v-2.748a3.782 3.782 0 01-1.653-.713C6.9 9.433 6.5 8.681 6.5 7.875c0-.805.4-1.558 1.097-2.096a3.78 3.78 0 011.653-.713V4.75A.75.75 0 0110 4z" clipRule="evenodd" />
              </svg>
              <span className="font-semibold">Cost:</span>
              <span className="font-semibold">{recommendation.cost_tier}</span>
            </div>
          </div>

          {/* Story 4.9: Transparent reasoning display */}
          <div className="mt-4 rounded-lg bg-blue-50 p-3">
            <div className="flex items-start gap-2">
              {/* Lightbulb icon */}
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5">
                <path d="M10 1a6 6 0 00-3.815 10.631C7.237 12.5 8 13.443 8 14.456v.644a.75.75 0 00.572.729 6.016 6.016 0 002.856 0A.75.75 0 0012 15.1v-.644c0-1.013.762-1.957 1.815-2.825A6 6 0 0010 1zM8.863 17.414a.75.75 0 00-.226 1.483 9.066 9.066 0 002.726 0 .75.75 0 00-.226-1.483 7.553 7.553 0 01-2.274 0z" />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900 mb-1">
                  Why this works
                </p>
                <p className="text-sm text-blue-800 leading-relaxed">
                  {recommendation.reasoning}
                </p>
              </div>
            </div>
          </div>

          {/* Story 4.10: Data sources display */}
          {recommendation.data_sources.length > 0 && (
            <div className="mt-3 flex items-start gap-2 text-xs text-gray-600">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5">
                <path d="M10.75 16.82A7.462 7.462 0 0115 15.5c.71 0 1.396.098 2.046.282A.75.75 0 0018 15.06v-11a.75.75 0 00-.546-.721A9.006 9.006 0 0015 3a8.963 8.963 0 00-4.25 1.065V16.82zM9.25 4.065A8.963 8.963 0 005 3c-.85 0-1.673.118-2.454.339A.75.75 0 002 4.06v11a.75.75 0 00.954.721A7.506 7.506 0 015 15.5c1.579 0 3.042.487 4.25 1.32V4.065z" />
              </svg>
              <div className="flex-1">
                <span className="font-medium">Data sources: </span>
                {recommendation.data_sources.map(source => source.name).join(' · ')}
              </div>
            </div>
          )}

          {/* Story 4.11: Comprehensive Scoring Breakdown */}
          <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
            <h4 className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M4.25 2A2.25 2.25 0 002 4.25v11.5A2.25 2.25 0 004.25 18h11.5A2.25 2.25 0 0018 15.75V4.25A2.25 2.25 0 0015.75 2H4.25zm4.03 6.28a.75.75 0 00-1.06-1.06L4.97 9.47a.75.75 0 000 1.06l2.25 2.25a.75.75 0 001.06-1.06L6.56 10l1.72-1.72zm4.5-1.06a.75.75 0 10-1.06 1.06L13.44 10l-1.72 1.72a.75.75 0 101.06 1.06l2.25-2.25a.75.75 0 000-1.06l-2.25-2.25z" clipRule="evenodd" />
              </svg>
              Score Breakdown
            </h4>

            <div className="space-y-2">
              {/* Audience Match */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-gray-600">Audience Match (40%)</span>
                  <span className="font-medium text-gray-900">
                    {recommendation.audience_match_score.toFixed(1)}/40 ({audienceMatchPercent}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    className="bg-green-600 h-1.5 rounded-full"
                    style={{ width: `${audienceMatchPercent}%` }}
                  />
                </div>
              </div>

              {/* Timing */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-gray-600">Timing (30%)</span>
                  <span className="font-medium text-gray-900">
                    {recommendation.temporal_score.toFixed(1)}/30 ({temporalPercent}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    className="bg-blue-600 h-1.5 rounded-full"
                    style={{ width: `${temporalPercent}%` }}
                  />
                </div>
              </div>

              {/* Distance */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-gray-600">Distance (20%)</span>
                  <span className="font-medium text-gray-900">
                    {recommendation.distance_score.toFixed(1)}/20 ({distancePercent}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    className="bg-purple-600 h-1.5 rounded-full"
                    style={{ width: `${distancePercent}%` }}
                  />
                </div>
              </div>

              {/* Dwell Time */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-gray-600">Dwell Time (10%)</span>
                  <span className="font-medium text-gray-900">
                    {recommendation.dwell_time_score.toFixed(1)}/10 ({dwellTimePercent}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    className="bg-orange-600 h-1.5 rounded-full"
                    style={{ width: `${dwellTimePercent}%` }}
                  />
                </div>
              </div>

              {/* Total divider */}
              <div className="border-t border-gray-300 pt-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-gray-700">Overall Score</span>
                  <span className="font-bold text-gray-900">{recommendation.total_score.toFixed(0)}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Story 7.3: Risk Warning Explanation Panel */}
      {/* Story 7.6: Enhanced visually striking design */}
      {recommendation.risk_warning?.is_flagged && isWarningPanelOpen && (
        <div className="mt-4 rounded-lg border-2 border-red-500 bg-gradient-to-br from-red-50 to-orange-50 p-4 shadow-lg animate-in slide-in-from-top-4 duration-300 ease-out">
          {/* Warning header with stronger visual impact */}
          <div className="flex items-start gap-3 mb-4">
            <div className="flex-shrink-0">
              {/* Larger, more prominent warning icon in colored circle */}
              <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center shadow-md">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-7 h-7 text-white"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
            <div className="flex-1">
              {/* Story 7.6: Bold, attention-grabbing title */}
              {/* Story 7.7: Protective framing - advisory not prescriptive */}
              <h4 className="text-xl font-black text-red-900 mb-2 tracking-tight">
                ⚠️ Worth Knowing: Low ROI Expected
              </h4>

              {/* Story 7.5: Category badges with enhanced styling */}
              {recommendation.risk_warning.warning_categories &&
               recommendation.risk_warning.warning_categories.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {recommendation.risk_warning.warning_categories.map((cat) => (
                    <span
                      key={cat.category_type}
                      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-bold shadow-sm ${
                        cat.severity === 'high'
                          ? 'bg-red-600 text-white'
                          : 'bg-orange-500 text-white'
                      }`}
                    >
                      <span className="text-base">{cat.icon}</span>
                      <span>{cat.display_name}</span>
                    </span>
                  ))}
                </div>
              )}

              {/* Story 7.6: Scannable bullet-point format with bold key phrases */}
              {/* Story 7.7: Softer, collaborative framing */}
              <div className="text-sm text-gray-800 leading-relaxed space-y-2 bg-white/50 rounded-md p-3 backdrop-blur-sm">
                <p className="font-semibold text-red-900">We noticed some challenges with this zone:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  {recommendation.risk_warning.warning_categories && recommendation.risk_warning.warning_categories.length > 0 ? (
                    recommendation.risk_warning.warning_categories.map((cat) => (
                      <li key={cat.category_type} className="text-gray-700">
                        <span className="font-bold text-gray-900">{cat.display_name}:</span>{' '}
                        {cat.description.includes(' - ')
                          ? cat.description.split(' - ')[1]
                          : cat.description}
                      </li>
                    ))
                  ) : (
                    <li className="text-gray-700">
                      {recommendation.risk_warning.reason}
                    </li>
                  )}
                </ul>
                <p className="text-red-900 font-semibold mt-2">
                  💡 Our recommendation: Consider the alternatives below for better results.
                </p>
              </div>
            </div>
          </div>

          {/* Data breakdown */}
          {recommendation.risk_warning.details && (
            <div className="bg-white rounded-md p-3 mb-3 border border-orange-200">
              <h5 className="text-xs font-semibold text-gray-700 mb-2 uppercase">
                Detection Data
              </h5>
              <div className="space-y-1 text-sm text-gray-700">
                <div className="flex justify-between">
                  <span>Daily Foot Traffic:</span>
                  <span className="font-semibold">
                    {recommendation.risk_warning.details.foot_traffic_daily?.toLocaleString() || 0}/day
                    {(recommendation.risk_warning.details.foot_traffic_daily || 0) > (recommendation.risk_warning.details.threshold_traffic || 1000) && (
                      <span className="ml-1 text-orange-600">⚠️ High</span>
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Dwell Time:</span>
                  <span className="font-semibold">
                    {recommendation.risk_warning.details.dwell_time_seconds || 0}s
                    {(recommendation.risk_warning.details.dwell_time_seconds || 0) < (recommendation.risk_warning.details.threshold_dwell_time || 20) && (
                      <span className="ml-1 text-orange-600">⚠️ Low</span>
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Audience Match:</span>
                  <span className="font-semibold">
                    {recommendation.risk_warning.details.audience_match_percent || 0}%
                    {(recommendation.risk_warning.details.audience_match_score || 0) < (recommendation.risk_warning.details.threshold_audience_match || 24) && (
                      <span className="ml-1 text-orange-600">⚠️ Poor</span>
                    )}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Story 7.5: Detailed category explanations */}
          {/* Story 7.6: Enhanced visual hierarchy */}
          {recommendation.risk_warning.warning_categories &&
           recommendation.risk_warning.warning_categories.length > 0 && (
            <div className="bg-white rounded-lg p-4 mb-3 border-2 border-red-200 shadow-sm">
              <h5 className="text-sm font-black text-red-900 mb-3 uppercase tracking-wide flex items-center gap-2">
                <span className="text-red-500">⚡</span>
                What We Found:
              </h5>
              <div className="space-y-3">
                {recommendation.risk_warning.warning_categories.map((cat) => (
                  <div key={cat.category_type} className="flex items-start gap-3 p-2 rounded-md bg-gray-50">
                    <span className="text-2xl flex-shrink-0">{cat.icon}</span>
                    <div className="flex-1">
                      <div className="font-bold text-gray-900 text-base">{cat.display_name}</div>
                      <div className="text-gray-600 text-sm mt-0.5">{cat.description}</div>
                    </div>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                      cat.severity === 'high'
                        ? 'bg-red-600 text-white'
                        : 'bg-orange-500 text-white'
                    }`}>
                      {cat.severity.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Story 7.4: Better Alternatives Section */}
          {/* Story 7.6: Enhanced positive framing */}
          {recommendation.risk_warning.alternative_zones &&
           recommendation.risk_warning.alternative_zones.length > 0 && (
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 mb-3 border-2 border-green-400 shadow-sm">
              <div className="flex items-start gap-2 mb-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                    clipRule="evenodd"
                  />
                </svg>
                <h5 className="text-sm font-black text-green-900 uppercase tracking-wide">
                  ✨ We Recommend These Alternatives (Better ROI):
                </h5>
              </div>
              <div className="space-y-2">
                {recommendation.risk_warning.alternative_zones.map((alt) => (
                  <button
                    key={alt.zone_id}
                    onClick={() => {
                      // Story 7.4: Scroll to alternative zone card
                      const altCard = document.querySelector(`[data-zone-id="${alt.zone_id}"]`)
                      if (altCard) {
                        altCard.scrollIntoView({ behavior: 'smooth', block: 'center' })
                        // Story 7.6: Stronger ring effect
                        altCard.classList.add('ring-4', 'ring-green-500', 'ring-offset-2')
                        setTimeout(() => {
                          altCard.classList.remove('ring-4', 'ring-green-500', 'ring-offset-2')
                        }, 2000)
                      }
                      setIsWarningPanelOpen(false)
                    }}
                    className="w-full text-left p-3 rounded-lg bg-white hover:bg-green-100 transition-all duration-200 border-2 border-green-300 hover:border-green-500 hover:shadow-md"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-base font-black text-green-700">
                            #{alt.rank}
                          </span>
                          <span className="text-base font-bold text-gray-900">
                            {alt.zone_name}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 font-medium">
                          ✓ {alt.reason}
                        </p>
                      </div>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="w-4 h-4 text-green-600 flex-shrink-0 mt-1"
                      >
                        <path
                          fillRule="evenodd"
                          d="M2 10a.75.75 0 01.75-.75h12.59l-2.1-1.95a.75.75 0 111.02-1.1l3.5 3.25a.75.75 0 010 1.1l-3.5 3.25a.75.75 0 11-1.02-1.1l2.1-1.95H2.75A.75.75 0 012 10z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  </button>
                ))}
              </div>
              <p className="text-xs text-green-800 mt-3 font-semibold text-center bg-white/50 rounded-md py-2">
                💰 These zones may perform better for your event - click to explore details!
              </p>
            </div>
          )}

          {/* Story 7.6: Enhanced close button with satisfying action language */}
          <button
            onClick={() => setIsWarningPanelOpen(false)}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-[1.02]"
          >
            ✓ Got it - I'll avoid this zone
          </button>
        </div>
      )}
    </div>
  )
})

RecommendationCard.displayName = 'RecommendationCard'

export default RecommendationCard
