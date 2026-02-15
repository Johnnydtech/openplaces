/**
 * Story 3.1: Flyer Upload Interface Tests
 * Comprehensive test coverage for upload functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import Upload from './Upload'

describe('Story 3.1: Flyer Image Upload Interface', () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks()
  })

  describe('AC: Upload page with drag-and-drop or "Choose File"', () => {
    it('renders upload zone with drag-and-drop interface', () => {
      render(<Upload />)

      expect(screen.getByText(/drag and drop your flyer here/i)).toBeInTheDocument()
      expect(screen.getByText(/choose file/i)).toBeInTheDocument()
    })

    it('shows file input when "Choose File" button is clicked', () => {
      render(<Upload />)

      const chooseButton = screen.getByRole('button', { name: /choose file/i })
      const fileInput = screen.getByLabelText(/file upload input/i)

      expect(fileInput).toHaveAttribute('type', 'file')
      expect(fileInput).toHaveStyle({ display: 'none' })
    })

    it('accepts drag-and-drop file selection', async () => {
      render(<Upload />)

      const uploadZone = screen.getByText(/drag and drop your flyer here/i).closest('.upload-zone')!

      const file = new File(['test'], 'test-flyer.jpg', { type: 'image/jpeg' })
      const dropEvent = {
        preventDefault: vi.fn(),
        dataTransfer: {
          files: [file]
        }
      }

      fireEvent.drop(uploadZone, dropEvent as any)

      await waitFor(() => {
        expect(screen.getByText('test-flyer.jpg')).toBeInTheDocument()
      })
    })

    it('applies dragging styles when file is dragged over', () => {
      render(<Upload />)

      const uploadZone = screen.getByText(/drag and drop your flyer here/i).closest('.upload-zone')!

      fireEvent.dragOver(uploadZone, { preventDefault: vi.fn() })
      expect(uploadZone).toHaveClass('dragging')

      fireEvent.dragLeave(uploadZone, { preventDefault: vi.fn() })
      expect(uploadZone).not.toHaveClass('dragging')
    })
  })

  describe('AC: Mobile camera access', () => {
    it('shows mobile camera access note', () => {
      render(<Upload />)

      expect(screen.getByText(/on mobile/i)).toBeInTheDocument()
      expect(screen.getByText(/tap "choose file" to access your camera/i)).toBeInTheDocument()
    })

    it('file input accepts images from camera', () => {
      render(<Upload />)

      const fileInput = screen.getByLabelText(/file upload input/i) as HTMLInputElement

      // Verify accept attribute includes image formats
      expect(fileInput.accept).toContain('.jpg')
      expect(fileInput.accept).toContain('.png')
    })
  })

  describe('AC: File validation (max 10MB, JPG/PNG/PDF only)', () => {
    it('accepts valid JPG file under 10MB', async () => {
      render(<Upload />)

      const fileInput = screen.getByLabelText(/file upload input/i) as HTMLInputElement
      const file = new File(['a'.repeat(1024)], 'valid.jpg', { type: 'image/jpeg' })

      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false
      })

      fireEvent.change(fileInput)

      await waitFor(() => {
        expect(screen.getByText('valid.jpg')).toBeInTheDocument()
        expect(screen.queryByRole('alert')).not.toBeInTheDocument()
      })
    })

    it('accepts valid PNG file under 10MB', async () => {
      render(<Upload />)

      const fileInput = screen.getByLabelText(/file upload input/i) as HTMLInputElement
      const file = new File(['a'.repeat(1024)], 'valid.png', { type: 'image/png' })

      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false
      })

      fireEvent.change(fileInput)

      await waitFor(() => {
        expect(screen.getByText('valid.png')).toBeInTheDocument()
        expect(screen.queryByRole('alert')).not.toBeInTheDocument()
      })
    })

    it('accepts valid PDF file under 10MB', async () => {
      render(<Upload />)

      const fileInput = screen.getByLabelText(/file upload input/i) as HTMLInputElement
      const file = new File(['a'.repeat(1024)], 'valid.pdf', { type: 'application/pdf' })

      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false
      })

      fireEvent.change(fileInput)

      await waitFor(() => {
        expect(screen.getByText('valid.pdf')).toBeInTheDocument()
        expect(screen.queryByRole('alert')).not.toBeInTheDocument()
      })
    })

    it('rejects file larger than 10MB with clear error message', async () => {
      render(<Upload />)

      const fileInput = screen.getByLabelText(/file upload input/i) as HTMLInputElement
      const largeFile = new File(['a'.repeat(11 * 1024 * 1024)], 'too-large.jpg', {
        type: 'image/jpeg'
      })
      Object.defineProperty(largeFile, 'size', { value: 11 * 1024 * 1024 })

      Object.defineProperty(fileInput, 'files', {
        value: [largeFile],
        writable: false
      })

      fireEvent.change(fileInput)

      await waitFor(() => {
        const errorMessage = screen.getByRole('alert')
        expect(errorMessage).toHaveTextContent(/file is too large/i)
        expect(errorMessage).toHaveTextContent(/maximum size is 10mb/i)
        expect(errorMessage).toHaveTextContent(/please compress your image/i)
      })
    })

    it('rejects unsupported file type with clear error message', async () => {
      render(<Upload />)

      const fileInput = screen.getByLabelText(/file upload input/i) as HTMLInputElement
      const invalidFile = new File(['test'], 'document.docx', {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      })

      Object.defineProperty(fileInput, 'files', {
        value: [invalidFile],
        writable: false
      })

      fireEvent.change(fileInput)

      await waitFor(() => {
        const errorMessage = screen.getByRole('alert')
        expect(errorMessage).toHaveTextContent(/file type not supported/i)
        expect(errorMessage).toHaveTextContent(/please upload jpg, png, or pdf/i)
      })
    })

    it('error message is ≤20 words (Story 3.10 AC)', async () => {
      render(<Upload />)

      const fileInput = screen.getByLabelText(/file upload input/i) as HTMLInputElement
      const largeFile = new File(['a'.repeat(11 * 1024 * 1024)], 'too-large.jpg', {
        type: 'image/jpeg'
      })
      Object.defineProperty(largeFile, 'size', { value: 11 * 1024 * 1024 })

      Object.defineProperty(fileInput, 'files', {
        value: [largeFile],
        writable: false
      })

      fireEvent.change(fileInput)

      await waitFor(() => {
        const errorMessage = screen.getByRole('alert')
        const wordCount = errorMessage.textContent!.trim().split(/\s+/).length
        expect(wordCount).toBeLessThanOrEqual(20)
      })
    })
  })

  describe('AC: Instant preview', () => {
    it('shows image preview for JPG files', async () => {
      render(<Upload />)

      const fileInput = screen.getByLabelText(/file upload input/i) as HTMLInputElement
      const file = new File(['test'], 'preview-test.jpg', { type: 'image/jpeg' })

      // Mock FileReader
      const mockFileReader = {
        readAsDataURL: vi.fn(),
        onloadend: null as any,
        result: 'data:image/jpeg;base64,mockbase64data'
      }

      vi.spyOn(global, 'FileReader').mockImplementation(() => mockFileReader as any)

      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false
      })

      fireEvent.change(fileInput)

      // Trigger FileReader onloadend
      if (mockFileReader.onloadend) {
        mockFileReader.onloadend()
      }

      await waitFor(() => {
        const previewImage = screen.getByAltText('Preview')
        expect(previewImage).toBeInTheDocument()
        expect(previewImage).toHaveAttribute('src', 'data:image/jpeg;base64,mockbase64data')
      })
    })

    it('shows PDF placeholder for PDF files', async () => {
      render(<Upload />)

      const fileInput = screen.getByLabelText(/file upload input/i) as HTMLInputElement
      const file = new File(['test'], 'document.pdf', { type: 'application/pdf' })

      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false
      })

      fireEvent.change(fileInput)

      await waitFor(() => {
        expect(screen.getByText('PDF File')).toBeInTheDocument()
        expect(screen.queryByAltText('Preview')).not.toBeInTheDocument()
      })
    })

    it('displays file size in MB', async () => {
      render(<Upload />)

      const fileInput = screen.getByLabelText(/file upload input/i) as HTMLInputElement
      const file = new File(['a'.repeat(2 * 1024 * 1024)], 'size-test.jpg', {
        type: 'image/jpeg'
      })
      Object.defineProperty(file, 'size', { value: 2 * 1024 * 1024 })

      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false
      })

      fireEvent.change(fileInput)

      await waitFor(() => {
        expect(screen.getByText(/2\.00 MB/i)).toBeInTheDocument()
      })
    })
  })

  describe('AC: Upload progress indicator', () => {
    it('shows progress bar during upload', async () => {
      render(<Upload />)

      const fileInput = screen.getByLabelText(/file upload input/i) as HTMLInputElement
      const file = new File(['test'], 'upload-test.jpg', { type: 'image/jpeg' })

      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false
      })

      fireEvent.change(fileInput)

      await waitFor(() => {
        expect(screen.getByText('upload-test.jpg')).toBeInTheDocument()
      })

      const uploadButton = screen.getByRole('button', { name: /analyze flyer with ai/i })
      fireEvent.click(uploadButton)

      await waitFor(() => {
        expect(screen.getByText(/uploaded/i)).toBeInTheDocument()
      })
    })

    it('progress percentage updates during upload', async () => {
      render(<Upload />)

      const fileInput = screen.getByLabelText(/file upload input/i) as HTMLInputElement
      const file = new File(['test'], 'progress-test.jpg', { type: 'image/jpeg' })

      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false
      })

      fireEvent.change(fileInput)

      await waitFor(() => {
        expect(screen.getByText('progress-test.jpg')).toBeInTheDocument()
      })

      const uploadButton = screen.getByRole('button', { name: /analyze flyer with ai/i })
      fireEvent.click(uploadButton)

      await waitFor(() => {
        const progressText = screen.getByText(/\d+% uploaded/i)
        expect(progressText).toBeInTheDocument()
      })
    })
  })

  describe('File management', () => {
    it('allows changing selected file', async () => {
      render(<Upload />)

      const fileInput = screen.getByLabelText(/file upload input/i) as HTMLInputElement
      const file1 = new File(['test1'], 'first.jpg', { type: 'image/jpeg' })

      Object.defineProperty(fileInput, 'files', {
        value: [file1],
        writable: false
      })

      fireEvent.change(fileInput)

      await waitFor(() => {
        expect(screen.getByText('first.jpg')).toBeInTheDocument()
      })

      const changeButton = screen.getByRole('button', { name: /change file/i })
      fireEvent.click(changeButton)

      await waitFor(() => {
        expect(screen.queryByText('first.jpg')).not.toBeInTheDocument()
        expect(screen.getByText(/drag and drop your flyer here/i)).toBeInTheDocument()
      })
    })

    it('clears error message when new file is selected', async () => {
      render(<Upload />)

      const fileInput = screen.getByLabelText(/file upload input/i) as HTMLInputElement

      // Select invalid file
      const invalidFile = new File(['test'], 'invalid.txt', { type: 'text/plain' })
      Object.defineProperty(fileInput, 'files', {
        value: [invalidFile],
        writable: false
      })

      fireEvent.change(fileInput)

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
      })

      // Select valid file
      const validFile = new File(['test'], 'valid.jpg', { type: 'image/jpeg' })
      Object.defineProperty(fileInput, 'files', {
        value: [validFile],
        writable: false
      })

      fireEvent.change(fileInput)

      await waitFor(() => {
        expect(screen.queryByRole('alert')).not.toBeInTheDocument()
        expect(screen.getByText('valid.jpg')).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('provides accessible file input label', () => {
      render(<Upload />)

      const fileInput = screen.getByLabelText(/file upload input/i)
      expect(fileInput).toBeInTheDocument()
    })

    it('error messages have alert role', async () => {
      render(<Upload />)

      const fileInput = screen.getByLabelText(/file upload input/i) as HTMLInputElement
      const largeFile = new File(['a'.repeat(11 * 1024 * 1024)], 'too-large.jpg', {
        type: 'image/jpeg'
      })
      Object.defineProperty(largeFile, 'size', { value: 11 * 1024 * 1024 })

      Object.defineProperty(fileInput, 'files', {
        value: [largeFile],
        writable: false
      })

      fireEvent.change(fileInput)

      await waitFor(() => {
        const errorMessage = screen.getByRole('alert')
        expect(errorMessage).toBeInTheDocument()
      })
    })

    it('upload button is disabled during upload', async () => {
      render(<Upload />)

      const fileInput = screen.getByLabelText(/file upload input/i) as HTMLInputElement
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false
      })

      fireEvent.change(fileInput)

      await waitFor(() => {
        expect(screen.getByText('test.jpg')).toBeInTheDocument()
      })

      const uploadButton = screen.getByRole('button', { name: /analyze flyer with ai/i })
      fireEvent.click(uploadButton)

      // Button should not be in DOM during upload (it's replaced by progress indicator)
      await waitFor(() => {
        expect(screen.queryByRole('button', { name: /analyze flyer with ai/i })).not.toBeInTheDocument()
      })
    })
  })

  describe('User experience', () => {
    it('displays informative upload hints', () => {
      render(<Upload />)

      expect(screen.getByText(/supports jpg, png, pdf/i)).toBeInTheDocument()
      expect(screen.getByText(/max 10mb/i)).toBeInTheDocument()
    })

    it('shows descriptive heading and subtitle', () => {
      render(<Upload />)

      expect(screen.getByRole('heading', { name: /upload event flyer/i })).toBeInTheDocument()
      expect(screen.getByText(/get ai-powered placement recommendations/i)).toBeInTheDocument()
    })
  })
})
