'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const eventSchema = z.object({
  event_name: z.string().min(3, 'Event name must be at least 3 characters'),
  event_date: z.string().min(1, 'Date is required'),
  event_time: z.string().min(1, 'Time is required'),
  venue: z.string().min(3, 'Venue is required'),
  target_audience: z.array(z.string()).min(1, 'Select at least one audience'),
  event_type: z.string().min(1, 'Event type is required'), // Story 3.8
})

type EventFormData = z.infer<typeof eventSchema>

interface ManualEventFormProps {
  onSubmit: (data: any) => void
  onCancel: () => void
}

export default function ManualEventForm({ onSubmit, onCancel }: ManualEventFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      target_audience: [],
      event_type: 'Community event', // Story 3.8: Default event type
    },
  })

  const selectedAudiences = watch('target_audience')

  const onFormSubmit = (data: EventFormData) => {
    // Transform to match AI extraction format
    onSubmit({
      event_name: data.event_name,
      event_date: data.event_date,
      event_time: data.event_time,
      venue: data.venue,
      target_audience: data.target_audience,
      event_type: data.event_type, // Story 3.8
      confidence: 'high', // Manual entry is always high confidence
      extraction_notes: 'Manually entered by user',
    })
  }

  const audienceOptions = [
    'Young professionals',
    'Families',
    'Students',
    'Coffee enthusiasts',
    'Artists',
    'Fitness enthusiasts',
    'Foodies',
  ]

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900">Enter Event Details</h3>
      <p className="mt-2 text-sm text-gray-500">
        Fill in your event information manually
      </p>

      <form onSubmit={handleSubmit(onFormSubmit)} className="mt-6 space-y-4">
        {/* Event Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Event Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            {...register('event_name')}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Summer Music Festival"
          />
          {errors.event_name && (
            <p className="mt-1 text-sm text-red-600">{errors.event_name.message}</p>
          )}
        </div>

        {/* Date and Time */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              {...register('event_date')}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {errors.event_date && (
              <p className="mt-1 text-sm text-red-600">{errors.event_date.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Time <span className="text-red-500">*</span>
            </label>
            <input
              type="time"
              {...register('event_time')}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {errors.event_time && (
              <p className="mt-1 text-sm text-red-600">{errors.event_time.message}</p>
            )}
          </div>
        </div>

        {/* Venue */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Venue <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            {...register('venue')}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="123 Main St, Arlington, VA"
          />
          {errors.venue && (
            <p className="mt-1 text-sm text-red-600">{errors.venue.message}</p>
          )}
        </div>

        {/* Event Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Event Type <span className="text-red-500">*</span>
          </label>
          <select
            {...register('event_type')}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="Workshop">Workshop</option>
            <option value="Concert">Concert</option>
            <option value="Sale">Sale</option>
            <option value="Community event">Community event</option>
            <option value="Nightlife">Nightlife</option>
            <option value="Sports">Sports</option>
            <option value="Cultural">Cultural</option>
          </select>
          {errors.event_type && (
            <p className="mt-1 text-sm text-red-600">{errors.event_type.message}</p>
          )}
        </div>

        {/* Target Audience */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Target Audience <span className="text-red-500">*</span>
          </label>
          <div className="mt-2 space-y-2">
            {audienceOptions.map((audience) => (
              <label key={audience} className="flex items-center">
                <input
                  type="checkbox"
                  value={audience}
                  {...register('target_audience')}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">{audience}</span>
              </label>
            ))}
          </div>
          {errors.target_audience && (
            <p className="mt-1 text-sm text-red-600">{errors.target_audience.message}</p>
          )}
        </div>

        {/* Buttons */}
        <div className="flex gap-4 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
          >
            Get Recommendations →
          </button>
        </div>
      </form>
    </div>
  )
}
