/**
 * Story 6.1: Time Period Toggle UI Component
 * Story 6.5: Default Time Period Based on Event Date/Time
 * Story 6.6: Smooth Visual Transition When Toggling Time Period
 *
 * Toggle component for selecting time period (Morning/Lunch/Evening)
 */

import { useState, useEffect } from 'react'
import './TimePeriodToggle.css'

export type TimePeriod = 'morning' | 'lunch' | 'evening'

interface TimePeriodOption {
  value: TimePeriod
  label: string
  timeRange: string
}

interface TimePeriodToggleProps {
  defaultPeriod?: TimePeriod
  eventTime?: string  // Story 6.5: Event time for smart default
  onChange: (period: TimePeriod) => void
}

// Story 6.1 AC: Three time periods with labels
const TIME_PERIODS: TimePeriodOption[] = [
  { value: 'morning', label: 'Morning', timeRange: '6-11am' },
  { value: 'lunch', label: 'Lunch', timeRange: '11am-2pm' },
  { value: 'evening', label: 'Evening', timeRange: '5-9pm' }
]

export default function TimePeriodToggle({
  defaultPeriod,
  eventTime,
  onChange
}: TimePeriodToggleProps) {
  // Story 6.5: Smart default based on event time
  const getSmartDefault = (): TimePeriod => {
    if (defaultPeriod) return defaultPeriod
    if (!eventTime) return 'evening'  // Default to evening for weekend planners

    // Parse event time (format: "HH:MM" or "H:MM am/pm")
    const hour = parseInt(eventTime.split(':')[0])

    if (hour >= 6 && hour < 11) return 'morning'
    if (hour >= 11 && hour < 14) return 'lunch'
    return 'evening'
  }

  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>(getSmartDefault())

  // Update selected period if eventTime changes
  useEffect(() => {
    if (eventTime) {
      setSelectedPeriod(getSmartDefault())
    }
  }, [eventTime])

  const handlePeriodChange = (period: TimePeriod) => {
    if (period === selectedPeriod) return

    setSelectedPeriod(period)
    onChange(period)
  }

  return (
    <div className="time-period-toggle-container">
      {/* Story 6.1 AC: Sticky positioning */}
      <div className="time-period-toggle">
        <div className="toggle-header">
          <h3>Optimize by Time Period</h3>
          <p className="toggle-hint">See which zones work best at different times</p>
        </div>

        {/* Story 6.1 AC: Three toggle buttons */}
        <div className="toggle-buttons" role="group" aria-label="Select time period">
          {TIME_PERIODS.map((period) => (
            <button
              key={period.value}
              type="button"
              className={`toggle-button ${selectedPeriod === period.value ? 'active' : ''}`}
              onClick={() => handlePeriodChange(period.value)}
              aria-pressed={selectedPeriod === period.value}
              // Story 6.1 AC: Keyboard accessible (Tab to focus, Enter to select)
              tabIndex={0}
            >
              <span className="period-label">{period.label}</span>
              <span className="period-time">{period.timeRange}</span>
            </button>
          ))}
        </div>

        {/* Story 6.2 AC: Explain what happens when toggling */}
        <p className="toggle-description">
          {selectedPeriod === 'morning' &&
            'Prioritizing commuter zones, coffee shops, and gyms where people start their day'}
          {selectedPeriod === 'lunch' &&
            'Prioritizing restaurants, offices, and parks where people take lunch breaks'}
          {selectedPeriod === 'evening' &&
            'Prioritizing transit hubs and nightlife zones where people plan their weekends'}
        </p>
      </div>
    </div>
  )
}
