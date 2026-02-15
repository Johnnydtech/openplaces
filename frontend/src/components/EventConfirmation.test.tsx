/**
 * Tests for Story 3.3: Display Extracted Event Details for Confirmation
 *
 * Test Coverage:
 * - Display extracted event details
 * - Confidence indicators (High/Medium/Low)
 * - Low confidence warning
 * - Inline edit functionality
 * - Confirm & Continue button
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import EventConfirmation from './EventConfirmation'
import { EventExtraction } from '../api/analyze'

describe('Story 3.3: Event Confirmation Display', () => {
  const mockHighConfidenceData: EventExtraction = {
    event_name: 'Summer Concert',
    event_date: '2026-07-15',
    event_time: '7:00 PM',
    venue: 'Clarendon Ballroom, Arlington VA',
    target_audience: ['young professionals', 'music lovers'],
    confidence: 'High',
    extraction_notes: ''
  }

  const mockLowConfidenceData: EventExtraction = {
    event_name: 'Workshop',
    event_date: 'July 20th',
    event_time: '',
    venue: 'Library',
    target_audience: ['students'],
    confidence: 'Low',
    extraction_notes: 'Date format unclear, time not found'
  }

  describe('Display event details', () => {
    it('displays all extracted event fields', () => {
      // Given: Extracted event data with high confidence
      // When: EventConfirmation is rendered
      render(
        <EventConfirmation
          data={mockHighConfidenceData}
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
        />
      )

      // Then: All fields are displayed
      expect(screen.getByText('Summer Concert')).toBeInTheDocument()
      expect(screen.getByText('2026-07-15')).toBeInTheDocument()
      expect(screen.getByText('7:00 PM')).toBeInTheDocument()
      expect(screen.getByText('Clarendon Ballroom, Arlington VA')).toBeInTheDocument()
      expect(screen.getByText('young professionals')).toBeInTheDocument()
      expect(screen.getByText('music lovers')).toBeInTheDocument()
    })

    it('displays "(Not found)" for empty fields', () => {
      // Given: Event data with missing time
      const dataWithMissingField: EventExtraction = {
        ...mockHighConfidenceData,
        event_time: ''
      }

      // When: EventConfirmation is rendered
      render(
        <EventConfirmation
          data={dataWithMissingField}
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
        />
      )

      // Then: Shows "(Not found)" for empty time field
      const fieldValues = screen.getAllByText('(Not found)')
      expect(fieldValues.length).toBeGreaterThan(0)
    })

    it('displays extraction notes when present', () => {
      // Given: Event data with extraction notes
      // When: EventConfirmation is rendered
      render(
        <EventConfirmation
          data={mockLowConfidenceData}
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
        />
      )

      // Then: Extraction notes are displayed
      expect(screen.getByText(/Date format unclear, time not found/i)).toBeInTheDocument()
    })
  })

  describe('Story 3.3 AC: Confidence Indicator', () => {
    it('displays High confidence with green indicator', () => {
      // Given: Event data with High confidence
      // When: EventConfirmation is rendered
      render(
        <EventConfirmation
          data={mockHighConfidenceData}
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
        />
      )

      // Then: Shows "Confidence: High" with correct styling
      expect(screen.getByText(/Confidence: High/i)).toBeInTheDocument()
      expect(screen.getByText(/Confidence: High/i).closest('.confidence-indicator')).toHaveClass('confidence-high')
    })

    it('displays Medium confidence with yellow indicator', () => {
      // Given: Event data with Medium confidence
      const mediumData: EventExtraction = {
        ...mockHighConfidenceData,
        confidence: 'Medium'
      }

      // When: EventConfirmation is rendered
      render(
        <EventConfirmation
          data={mediumData}
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
        />
      )

      // Then: Shows "Confidence: Medium" with correct styling
      expect(screen.getByText(/Confidence: Medium/i)).toBeInTheDocument()
      expect(screen.getByText(/Confidence: Medium/i).closest('.confidence-indicator')).toHaveClass('confidence-medium')
    })

    it('displays Low confidence with red indicator', () => {
      // Given: Event data with Low confidence
      // When: EventConfirmation is rendered
      render(
        <EventConfirmation
          data={mockLowConfidenceData}
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
        />
      )

      // Then: Shows "Confidence: Low" with correct styling
      expect(screen.getByText(/Confidence: Low/i)).toBeInTheDocument()
      expect(screen.getByText(/Confidence: Low/i).closest('.confidence-indicator')).toHaveClass('confidence-low')
    })
  })

  describe('Story 3.3 AC: Low confidence warning', () => {
    it('shows warning message when confidence is Low', () => {
      // Given: Event data with Low confidence
      // When: EventConfirmation is rendered
      render(
        <EventConfirmation
          data={mockLowConfidenceData}
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
        />
      )

      // Then: Warning message is displayed
      expect(screen.getByRole('alert')).toBeInTheDocument()
      expect(screen.getByText(/Please review these details carefully/i)).toBeInTheDocument()
    })

    it('does not show warning when confidence is High', () => {
      // Given: Event data with High confidence
      // When: EventConfirmation is rendered
      render(
        <EventConfirmation
          data={mockHighConfidenceData}
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
        />
      )

      // Then: No warning alert is displayed
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })
  })

  describe('Story 3.3 AC: Edit functionality', () => {
    it('enables inline editing when Edit button is clicked', () => {
      // Given: EventConfirmation is rendered
      render(
        <EventConfirmation
          data={mockHighConfidenceData}
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
        />
      )

      // When: User clicks Edit button for event name
      const editButtons = screen.getAllByText('Edit')
      fireEvent.click(editButtons[0]) // First Edit button (event name)

      // Then: Input field appears with current value
      const input = screen.getByDisplayValue('Summer Concert')
      expect(input).toBeInTheDocument()
      expect(input).toHaveFocus()

      // And: Save and Cancel buttons are visible
      expect(screen.getByLabelText('Save')).toBeInTheDocument()
      expect(screen.getByLabelText('Cancel')).toBeInTheDocument()
    })

    it('saves changes when checkmark button is clicked', () => {
      // Given: EventConfirmation is rendered and edit mode is active
      render(
        <EventConfirmation
          data={mockHighConfidenceData}
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
        />
      )

      const editButtons = screen.getAllByText('Edit')
      fireEvent.click(editButtons[0])

      // When: User changes the value and clicks Save
      const input = screen.getByDisplayValue('Summer Concert')
      fireEvent.change(input, { target: { value: 'Winter Concert' } })
      fireEvent.click(screen.getByLabelText('Save'))

      // Then: New value is displayed
      expect(screen.getByText('Winter Concert')).toBeInTheDocument()
      expect(screen.queryByDisplayValue('Winter Concert')).not.toBeInTheDocument() // Input is gone
    })

    it('cancels changes when X button is clicked', () => {
      // Given: EventConfirmation is rendered and edit mode is active
      render(
        <EventConfirmation
          data={mockHighConfidenceData}
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
        />
      )

      const editButtons = screen.getAllByText('Edit')
      fireEvent.click(editButtons[0])

      // When: User changes the value and clicks Cancel
      const input = screen.getByDisplayValue('Summer Concert')
      fireEvent.change(input, { target: { value: 'Winter Concert' } })
      fireEvent.click(screen.getByLabelText('Cancel'))

      // Then: Original value is still displayed
      expect(screen.getByText('Summer Concert')).toBeInTheDocument()
      expect(screen.queryByDisplayValue('Winter Concert')).not.toBeInTheDocument()
    })

    it('allows editing multiple fields independently', () => {
      // Given: EventConfirmation is rendered
      render(
        <EventConfirmation
          data={mockHighConfidenceData}
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
        />
      )

      // When: User edits event name
      const editButtons = screen.getAllByText('Edit')
      fireEvent.click(editButtons[0]) // Event name
      const nameInput = screen.getByDisplayValue('Summer Concert')
      fireEvent.change(nameInput, { target: { value: 'Spring Concert' } })
      fireEvent.click(screen.getByLabelText('Save'))

      // And: User edits event date
      fireEvent.click(screen.getAllByText('Edit')[0]) // Date
      const dateInput = screen.getByDisplayValue('2026-07-15')
      fireEvent.change(dateInput, { target: { value: '2026-03-20' } })
      fireEvent.click(screen.getByLabelText('Save'))

      // Then: Both changes are reflected
      expect(screen.getByText('Spring Concert')).toBeInTheDocument()
      expect(screen.getByText('2026-03-20')).toBeInTheDocument()
    })
  })

  describe('Story 3.3 AC: Confirm & Continue button', () => {
    it('calls onConfirm with event data when Confirm & Continue is clicked', () => {
      // Given: EventConfirmation is rendered
      const mockOnConfirm = vi.fn()
      render(
        <EventConfirmation
          data={mockHighConfidenceData}
          onConfirm={mockOnConfirm}
          onCancel={vi.fn()}
        />
      )

      // When: User clicks Confirm & Continue
      fireEvent.click(screen.getByText('Confirm & Continue'))

      // Then: onConfirm is called with event data
      expect(mockOnConfirm).toHaveBeenCalledWith(mockHighConfidenceData)
    })

    it('calls onConfirm with edited data after changes', () => {
      // Given: EventConfirmation is rendered
      const mockOnConfirm = vi.fn()
      render(
        <EventConfirmation
          data={mockHighConfidenceData}
          onConfirm={mockOnConfirm}
          onCancel={vi.fn()}
        />
      )

      // When: User edits event name and confirms
      const editButtons = screen.getAllByText('Edit')
      fireEvent.click(editButtons[0])
      const input = screen.getByDisplayValue('Summer Concert')
      fireEvent.change(input, { target: { value: 'Autumn Concert' } })
      fireEvent.click(screen.getByLabelText('Save'))
      fireEvent.click(screen.getByText('Confirm & Continue'))

      // Then: onConfirm is called with edited data
      expect(mockOnConfirm).toHaveBeenCalledWith({
        ...mockHighConfidenceData,
        event_name: 'Autumn Concert'
      })
    })

    it('calls onCancel when Cancel button is clicked', () => {
      // Given: EventConfirmation is rendered
      const mockOnCancel = vi.fn()
      render(
        <EventConfirmation
          data={mockHighConfidenceData}
          onConfirm={vi.fn()}
          onCancel={mockOnCancel}
        />
      )

      // When: User clicks Cancel
      fireEvent.click(screen.getByText('Cancel'))

      // Then: onCancel is called
      expect(mockOnCancel).toHaveBeenCalled()
    })
  })

  describe('Story 3.3 AC: Target audience display', () => {
    it('displays target audience as tags', () => {
      // Given: Event data with multiple target audiences
      // When: EventConfirmation is rendered
      render(
        <EventConfirmation
          data={mockHighConfidenceData}
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
        />
      )

      // Then: Each audience is displayed as a tag
      expect(screen.getByText('young professionals')).toBeInTheDocument()
      expect(screen.getByText('music lovers')).toBeInTheDocument()
    })

    it('allows editing target audience with comma-separated values', () => {
      // Given: EventConfirmation is rendered
      render(
        <EventConfirmation
          data={mockHighConfidenceData}
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
        />
      )

      // When: User edits target audience
      const editButtons = screen.getAllByText('Edit')
      fireEvent.click(editButtons[4]) // Target audience (last Edit button)
      const input = screen.getByPlaceholderText('Separate with commas')
      fireEvent.change(input, { target: { value: 'students, artists, musicians' } })
      fireEvent.click(screen.getByLabelText('Save'))

      // Then: New audiences are displayed as tags
      expect(screen.getByText('students')).toBeInTheDocument()
      expect(screen.getByText('artists')).toBeInTheDocument()
      expect(screen.getByText('musicians')).toBeInTheDocument()
    })
  })
})
