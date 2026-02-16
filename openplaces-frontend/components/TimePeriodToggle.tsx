'use client'

// Story 6.1: Time period toggle for temporal intelligence

export type TimePeriod = 'morning' | 'lunch' | 'evening'

interface TimePeriodToggleProps {
  selectedPeriod: TimePeriod
  onPeriodChange: (period: TimePeriod) => void
}

export default function TimePeriodToggle({ selectedPeriod, onPeriodChange }: TimePeriodToggleProps) {
  const periods: { value: TimePeriod; label: string; hours: string; icon: string }[] = [
    { value: 'morning', label: 'Morning', hours: '6-11am', icon: '🌅' },
    { value: 'lunch', label: 'Lunch', hours: '11am-2pm', icon: '☀️' },
    { value: 'evening', label: 'Evening', hours: '5-9pm', icon: '🌆' }
  ]

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold tracking-wider" style={{ color: '#94a3b8' }}>
          TIME PERIOD
        </label>
        <span className="text-xs" style={{ color: '#4ade80' }}>
          {periods.find(p => p.value === selectedPeriod)?.hours}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {periods.map((period) => (
          <button
            key={period.value}
            onClick={() => onPeriodChange(period.value)}
            className={`
              relative px-3 py-3 rounded-lg text-xs font-medium transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-offset-2
              ${selectedPeriod === period.value ? 'scale-105' : 'hover:scale-102'}
            `}
            style={{
              background: selectedPeriod === period.value
                ? '#4ade80'
                : 'rgba(30, 58, 72, 0.5)',
              color: selectedPeriod === period.value ? '#0f1c24' : '#94a3b8',
              border: selectedPeriod === period.value
                ? '2px solid #4ade80'
                : '2px solid transparent',
              boxShadow: selectedPeriod === period.value
                ? '0 4px 12px rgba(74, 222, 128, 0.3)'
                : 'none',
              '--tw-ring-color': '#4ade80'
            } as React.CSSProperties}
            aria-pressed={selectedPeriod === period.value}
            aria-label={`${period.label} ${period.hours}`}
          >
            <div className="flex flex-col items-center gap-1">
              <span className="text-lg leading-none">{period.icon}</span>
              <span className="font-semibold text-xs leading-tight">{period.label}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
