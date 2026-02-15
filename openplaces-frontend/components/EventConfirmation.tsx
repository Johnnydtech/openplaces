'use client'

interface EventData {
  event_name: string
  event_date: string
  event_time: string
  venue: string
  target_audience: string[]
  confidence: string
  extraction_notes?: string
}

interface EventConfirmationProps {
  data: EventData
  onGetRecommendations: () => void
}

export default function EventConfirmation({ data, onGetRecommendations }: EventConfirmationProps) {
  const confidenceColor = {
    high: 'text-green-600 bg-green-50 border-green-200',
    medium: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    low: 'text-red-600 bg-red-50 border-red-200',
  }[data.confidence.toLowerCase()] || 'text-gray-600 bg-gray-50 border-gray-200'

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Extracted Event Details</h3>
        <span className={`rounded-full border px-3 py-1 text-xs font-medium ${confidenceColor}`}>
          {data.confidence} Confidence
        </span>
      </div>

      {data.confidence.toLowerCase() === 'low' && (
        <div className="mb-4 rounded-md bg-yellow-50 p-3 text-sm text-yellow-800">
          ⚠️ Low confidence extraction. Please review and edit details carefully.
        </div>
      )}

      <div className="space-y-3">
        <div>
          <label className="text-xs font-medium text-gray-500">Event Name</label>
          <p className="text-sm font-medium text-gray-900">{data.event_name}</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-gray-500">Date</label>
            <p className="text-sm text-gray-900">{data.event_date}</p>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500">Time</label>
            <p className="text-sm text-gray-900">{data.event_time}</p>
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-500">Venue</label>
          <p className="text-sm text-gray-900">{data.venue}</p>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-500">Target Audience</label>
          <div className="mt-1 flex flex-wrap gap-2">
            {data.target_audience.map((audience, index) => (
              <span
                key={index}
                className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700"
              >
                {audience}
              </span>
            ))}
          </div>
        </div>

        {data.extraction_notes && (
          <div>
            <label className="text-xs font-medium text-gray-500">Notes</label>
            <p className="text-sm italic text-gray-600">{data.extraction_notes}</p>
          </div>
        )}
      </div>

      <button
        onClick={onGetRecommendations}
        className="mt-6 w-full rounded-md bg-blue-600 px-4 py-3 text-base font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
      >
        Get Recommendations →
      </button>
    </div>
  )
}
