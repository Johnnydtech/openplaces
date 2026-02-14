/**
 * Story 3.1: Flyer Image Upload Interface
 * Upload page with drag-and-drop for event flyer analysis
 */

import { useState, useRef, DragEvent, ChangeEvent } from 'react'
import './Upload.css'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ACCEPTED_FORMATS = ['image/jpeg', 'image/png', 'application/pdf']
const ACCEPTED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.pdf']

interface UploadError {
  message: string
  type: 'size' | 'format' | 'upload'
}

export default function Upload() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<UploadError | null>(null)
  const [uploadProgress, setUploadProgress] = useState<number>(0)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFile = (file: File): UploadError | null => {
    // Story 3.1 AC: File validation (max 10MB, JPG/PNG/PDF only)
    if (file.size > MAX_FILE_SIZE) {
      return {
        message: 'File is too large. Maximum size is 10MB. Please compress your image.',
        type: 'size'
      }
    }

    if (!ACCEPTED_FORMATS.includes(file.type)) {
      return {
        message: 'File type not supported. Please upload JPG, PNG, or PDF.',
        type: 'format'
      }
    }

    return null
  }

  const handleFileSelect = (file: File) => {
    setError(null)

    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      return
    }

    setSelectedFile(file)

    // Story 3.1 AC: Instant preview
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string)
      }
      reader.readAsDataURL(file)
    } else {
      // PDF preview placeholder
      setPreviewUrl(null)
    }
  }

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleChooseFile = () => {
    fileInputRef.current?.click()
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setIsUploading(true)
    setUploadProgress(0)

    try {
      // Story 3.1 AC: Upload progress indicator
      // Simulate upload progress (will be replaced with actual API call in Story 3.2)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      // TODO: Replace with actual API call to /api/analyze endpoint (Story 3.2)
      await new Promise(resolve => setTimeout(resolve, 2000))

      clearInterval(progressInterval)
      setUploadProgress(100)

      // TODO: Navigate to results page with extracted event details (Story 3.3)
      console.log('Upload complete:', selectedFile.name)
    } catch (err) {
      setError({
        message: 'Upload failed. Please try again.',
        type: 'upload'
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleReset = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
    setError(null)
    setUploadProgress(0)
    setIsUploading(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="upload-page">
      <div className="upload-container">
        <h1>Upload Event Flyer</h1>
        <p className="subtitle">
          Upload your event flyer and get AI-powered placement recommendations for Arlington, VA
        </p>

        {/* Story 3.1 AC: Drag-and-drop or "Choose File" */}
        <div
          className={`upload-zone ${isDragging ? 'dragging' : ''} ${selectedFile ? 'has-file' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={!selectedFile ? handleChooseFile : undefined}
        >
          {!selectedFile ? (
            <>
              <div className="upload-icon">
                <svg
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </div>
              <p className="upload-text">
                <strong>Drag and drop your flyer here</strong>
              </p>
              <p className="upload-text-secondary">or</p>
              <button type="button" className="choose-file-button" onClick={handleChooseFile}>
                Choose File
              </button>
              <p className="upload-hint">
                Supports JPG, PNG, PDF • Max 10MB
              </p>
            </>
          ) : (
            <>
              {/* Story 3.1 AC: Instant preview */}
              <div className="file-preview">
                {previewUrl ? (
                  <img src={previewUrl} alt="Preview" className="preview-image" />
                ) : (
                  <div className="pdf-preview">
                    <svg
                      width="64"
                      height="64"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                    <p>PDF File</p>
                  </div>
                )}
                <div className="file-info">
                  <p className="file-name">{selectedFile.name}</p>
                  <p className="file-size">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                <button type="button" className="change-file-button" onClick={handleReset}>
                  Change File
                </button>
              </div>
            </>
          )}
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_EXTENSIONS.join(',')}
          onChange={handleFileInputChange}
          style={{ display: 'none' }}
          aria-label="File upload input"
        />

        {/* Story 3.10 AC: Error messages ≤20 words with actionable next step */}
        {error && (
          <div className="error-message" role="alert">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{error.message}</span>
          </div>
        )}

        {/* Story 3.1 AC: Upload progress indicator */}
        {isUploading && (
          <div className="upload-progress">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="progress-text">{uploadProgress}% uploaded</p>
          </div>
        )}

        {/* Upload button */}
        {selectedFile && !isUploading && (
          <button
            type="button"
            className="upload-button"
            onClick={handleUpload}
            disabled={isUploading}
          >
            Analyze Flyer with AI
          </button>
        )}

        {/* Story 3.1 AC: Mobile camera access note */}
        <p className="mobile-note">
          📱 On mobile? Tap "Choose File" to access your camera
        </p>
      </div>
    </div>
  )
}
