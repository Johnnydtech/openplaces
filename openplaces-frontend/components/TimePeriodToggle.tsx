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
      <label className="text-sm font-medium text-gray-700 text-center">
        Optimize for time period:
      </label>
      <div className="inline-flex rounded-lg border border-gray-300 bg-white p-1 shadow-sm">
        {periods.map((period) => (
          <button
            key={period.value}
            onClick={() => onPeriodChange(period.value)}
            className={`
              px-4 py-2 rounded-md text-sm font-medium transition-all duration-100
              min-h-[44px] min-w-[120px]
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
              ${selectedPeriod === period.value
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-700 hover:bg-gray-100'
              }
            `}
            aria-pressed={selectedPeriod === period.value}
            aria-label={`${period.label} ${period.hours}`}
          >
            <div className="flex flex-col items-center">
              <span className="font-semibold">{period.label}</span>
              <span className={`text-xs ${selectedPeriod === period.value ? 'text-blue-100' : 'text-gray-500'}`}>
                {period.hours}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
