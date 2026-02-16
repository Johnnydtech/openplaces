'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface BusiestDaysChartProps {
  data?: Array<{ day: string; traffic: number }>
}

// Mock data - will be replaced with real data from backend
const defaultDaysData = [
  { day: 'Mon', traffic: 450 },
  { day: 'Tue', traffic: 520 },
  { day: 'Wed', traffic: 580 },
  { day: 'Thu', traffic: 620 },
  { day: 'Fri', traffic: 850 },
  { day: 'Sat', traffic: 920 },
  { day: 'Sun', traffic: 680 },
]

export default function BusiestDaysChart({ data }: BusiestDaysChartProps) {
  const chartData = data || defaultDaysData

  return (
    <div className="rounded-lg p-4" style={{ background: 'rgba(30, 58, 72, 0.5)' }}>
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-white mb-1">Average Busiest Days of the Week</h4>
        <p className="text-xs" style={{ color: '#94a3b8' }}>
          Weekly traffic patterns
        </p>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" />
          <XAxis
            dataKey="day"
            stroke="#94a3b8"
            tick={{ fill: '#94a3b8', fontSize: 11 }}
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
          <Bar
            dataKey="traffic"
            fill="#4ade80"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>

      <div className="mt-2 text-xs text-center" style={{ color: '#64748b' }}>
        Busiest days: Friday - Saturday
      </div>
    </div>
  )
}
