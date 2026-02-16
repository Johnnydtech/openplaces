'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

interface GenderDistributionChartProps {
  data?: Array<{ name: string; value: number }>
}

// Mock data - will be replaced with real data from backend
const defaultGenderData = [
  { name: 'Female', value: 50 },
  { name: 'Male', value: 47 },
  { name: 'Other', value: 3 },
]

const COLORS = {
  Female: '#ec4899',  // Pink
  Male: '#3b82f6',    // Blue
  Other: '#8b5cf6',   // Purple
}

export default function GenderDistributionChart({ data }: GenderDistributionChartProps) {
  const chartData = data || defaultGenderData

  return (
    <div className="rounded-lg p-4" style={{ background: 'rgba(30, 58, 72, 0.5)' }}>
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-white mb-1">Gender Distribution</h4>
        <p className="text-xs" style={{ color: '#94a3b8' }}>
          Audience demographic breakdown
        </p>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, value, x, y }) => {
              // Custom label rendering with proper positioning
              return (
                <text
                  x={x}
                  y={y}
                  fill={COLORS[name as keyof typeof COLORS]}
                  textAnchor={x > 170 ? 'start' : 'end'}
                  dominantBaseline="central"
                  style={{ fontSize: '14px', fontWeight: '600' }}
                >
                  {`${name}: ${value}%`}
                </text>
              )
            }}
            outerRadius={65}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: '#1a2f3a',
              border: '1px solid rgba(74, 222, 128, 0.2)',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '12px'
            }}
          />
        </PieChart>
      </ResponsiveContainer>

      <div className="flex justify-center gap-4 mt-2">
        {chartData.map((entry) => (
          <div key={entry.name} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ background: COLORS[entry.name as keyof typeof COLORS] }}
            />
            <span className="text-xs text-white">{entry.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
