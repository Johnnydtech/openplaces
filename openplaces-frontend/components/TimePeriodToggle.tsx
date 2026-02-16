'use client'

// Story 6.1: Time period toggle for temporal intelligence

export type TimePeriod = 'morning' | 'lunch' | 'evening'

interface TimePeriodToggleProps {
  selectedPeriod: TimePeriod
  onPeriodChange: (period: TimePeriod) => void
}

export default function TimePeriodToggle({ selectedPeriod, onPeriodChange }: TimePeriodToggleProps) {
  const periods: { value: TimePeriod; label: string; hours: string }[] = [
    { value: 'morning', label: 'Morning', hours: '6am-11am' },
    { value: 'lunch', label: 'Lunch', hours: '11am-2pm' },
    { value: 'evening', label: 'Evening', hours: '5pm-9pm' }
  ]

  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-medium text-white">
        FILTER
      </label>
      <div className="inline-flex rounded-lg p-1" style={{ background: '#0f1c24' }}>
        {periods.map((period) => (
          <button
            key={period.value}
            onClick={() => onPeriodChange(period.value)}
            className={`
              px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-100
              focus:outline-none
            `}
            style={{
              background: selectedPeriod === period.value ? '#4ade80' : 'transparent',
              color: selectedPeriod === period.value ? '#0f1c24' : '#94a3b8'
            }}
            aria-pressed={selectedPeriod === period.value}
            aria-label={`${period.label} ${period.hours}`}
          >
            <div className="flex flex-col items-center">
              <span className="font-semibold">{period.label}</span>
              <span className="text-[10px] opacity-80">
                {period.hours}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
