'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface HourlyTrafficChartProps {
  data?: Array<{ hour: string; traffic: number }>
}

// Mock data - will be replaced with real data from backend
const defaultHourlyData = [
  { hour: '2 AM', traffic: 12 },
  { hour: '3 AM', traffic: 8 },
  { hour: '4 AM', traffic: 6 },
  { hour: '5 AM', traffic: 15 },
  { hour: '6 AM', traffic: 45 },
  { hour: '7 AM', traffic: 120 },
  { hour: '8 AM', traffic: 280 },
  { hour: '9 AM', traffic: 350 },
  { hour: '10 AM', traffic: 420 },
  { hour: '11 AM', traffic: 480 },
  { hour: '12 PM', traffic: 650 },
  { hour: '1 PM', traffic: 720 },
  { hour: '2 PM', traffic: 580 },
  { hour: '3 PM', traffic: 520 },
  { hour: '4 PM', traffic: 560 },
  { hour: '5 PM', traffic: 820 },
  { hour: '6 PM', traffic: 950 },
  { hour: '7 PM', traffic: 880 },
  { hour: '8 PM', traffic: 720 },
  { hour: '9 PM', traffic: 580 },
  { hour: '10 PM', traffic: 420 },
  { hour: '11 PM', traffic: 280 },
]

export default function HourlyTrafficChart({ data }: HourlyTrafficChartProps) {
  const chartData = data || defaultHourlyData

  return (
    <div className="rounded-lg p-4" style={{ background: 'rgba(30, 58, 72, 0.5)' }}>
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-white mb-1">Average Hourly Audience Pattern</h4>
        <p className="text-xs" style={{ color: '#94a3b8' }}>
          Typical foot traffic throughout the day
        </p>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" />
          <XAxis
            dataKey="hour"
            stroke="#94a3b8"
            tick={{ fill: '#94a3b8', fontSize: 10 }}
            interval={2}
          />
          <YAxis
            stroke="#94a3b8"
            tick={{ fill: '#94a3b8', fontSize: 10 }}
          />
          <Tooltip
            contentStyle={{
              background: '#1a2f3a',
              border: '1px solid rgba(74, 222, 128, 0.2)',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '12px'
            }}
            labelStyle={{ color: '#4ade80' }}
          />
          <Line
            type="monotone"
            dataKey="traffic"
            stroke="#4ade80"
            strokeWidth={2}
            dot={{ fill: '#4ade80', r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>

      <div className="mt-2 text-xs text-center" style={{ color: '#64748b' }}>
        Peak hours: 12PM-2PM, 5PM-7PM
      </div>
    </div>
  )
}
