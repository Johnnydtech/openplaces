'use client'

interface AudienceMetricsProps {
  averageHourlyAudience?: number
  peakHourAudience?: number
  totalDailyTraffic?: number
}

export default function AudienceMetrics({
  averageHourlyAudience = 485,
  peakHourAudience = 950,
  totalDailyTraffic = 11640
}: AudienceMetricsProps) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {/* Average Hourly Audience */}
      <div className="rounded-lg p-3 text-center" style={{ background: 'rgba(30, 58, 72, 0.5)' }}>
        <p className="text-xs font-medium mb-1" style={{ color: '#94a3b8' }}>Avg Hourly</p>
        <p className="text-2xl font-bold" style={{ color: '#4ade80' }}>
          {averageHourlyAudience.toLocaleString()}
        </p>
        <p className="text-xs mt-1" style={{ color: '#64748b' }}>people/hour</p>
      </div>

      {/* Peak Hour */}
      <div className="rounded-lg p-3 text-center" style={{ background: 'rgba(30, 58, 72, 0.5)' }}>
        <p className="text-xs font-medium mb-1" style={{ color: '#94a3b8' }}>Peak Hour</p>
        <p className="text-2xl font-bold" style={{ color: '#facc15' }}>
          {peakHourAudience.toLocaleString()}
        </p>
        <p className="text-xs mt-1" style={{ color: '#64748b' }}>people</p>
      </div>

      {/* Total Daily Traffic */}
      <div className="rounded-lg p-3 text-center" style={{ background: 'rgba(30, 58, 72, 0.5)' }}>
        <p className="text-xs font-medium mb-1" style={{ color: '#94a3b8' }}>Daily Total</p>
        <p className="text-2xl font-bold" style={{ color: '#3b82f6' }}>
          {(totalDailyTraffic / 1000).toFixed(1)}k
        </p>
        <p className="text-xs mt-1" style={{ color: '#64748b' }}>people/day</p>
      </div>
    </div>
  )
}
