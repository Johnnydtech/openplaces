'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast, { Toaster } from 'react-hot-toast'
import UploadZone from '@/components/UploadZone'
import FilePreview from '@/components/FilePreview'
import EventConfirmation from '@/components/EventConfirmation'
import LoadingSpinner from '@/components/LoadingSpinner'
import ManualEventForm from '@/components/ManualEventForm'
import { analyzeFlyer } from '@/lib/api'

export default function UploadPage() {
  const router = useRouter()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [isUploading, setIsUploading] = useState(false)
  const [extractedData, setExtractedData] = useState<any>(null)
  const [showManualForm, setShowManualForm] = useState(false)

  const handleFileSelect = async (file: File) => {
    // Client-side validation
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      toast.error('File is too large. Maximum size is 10MB.')
      return
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      toast.error('File type not supported. Please upload JPG, PNG, or PDF.')
      return
    }

    // Set file and create preview
    setSelectedFile(file)

    if (file.type !== 'application/pdf') {
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }

    // Auto-upload after file select
    await uploadFile(file)
  }

  const uploadFile = async (file: File) => {
    setIsUploading(true)
    setExtractedData(null)

    try {
      toast.loading('Analyzing flyer...', { id: 'upload' })

      const response = await analyzeFlyer(file)

      if (response.success && response.data) {
        toast.success('Event details extracted successfully!', { id: 'upload' })
        setExtractedData(response.data)
      } else {
        throw new Error('Unexpected API response format')
      }
    } catch (error: any) {
      console.error('Upload error:', error)

      if (error.response?.status === 400) {
        toast.error(error.response.data.detail || 'Invalid file. Please try another.', { id: 'upload' })
      } else if (error.response?.status === 504) {
        toast.error('Analysis timed out. Please try a clearer image.', { id: 'upload' })
      } else if (error.code === 'ECONNABORTED') {
        toast.error('Upload timed out. Please check your connection.', { id: 'upload' })
      } else {
        toast.error('AI extraction unavailable. Please enter details manually.', { id: 'upload' })
      }
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    setPreviewUrl('')
    setExtractedData(null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
  }

  const handleGetRecommendations = () => {
    // TODO: Story 4.x - Navigate to recommendations page
    toast.success('Redirecting to recommendations... (Story 4.x)')
    // router.push('/recommendations')
  }

  const handleManualSubmit = (data: any) => {
    setExtractedData(data)
    setShowManualForm(false)
    toast.success('Event details saved!')
  }

  const handleManualCancel = () => {
    setShowManualForm(false)
  }

  const handleEventUpdate = (updatedData: any) => {
    setExtractedData(updatedData)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <Toaster position="top-center" />

      {/* Header */}
      <nav className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">OpenPlaces</h1>
          <button
            onClick={() => router.push('/')}
            className="text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            ← Back to Home
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="mx-auto max-w-3xl px-4 py-12">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">
            Upload Your Event Flyer
          </h2>
          <p className="mt-2 text-lg text-gray-600">
            AI will extract event details automatically
          </p>
        </div>

        <div className="mt-8 space-y-6">
          {!selectedFile && !showManualForm && (
            <>
              <UploadZone onFileSelect={handleFileSelect} isUploading={isUploading} />
              <div className="text-center">
                <button
                  onClick={() => setShowManualForm(true)}
                  className="text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  Or enter details manually →
                </button>
              </div>
            </>
          )}

          {showManualForm && !extractedData && (
            <ManualEventForm
              onSubmit={handleManualSubmit}
              onCancel={handleManualCancel}
            />
          )}

          {selectedFile && !isUploading && !extractedData && !showManualForm && (
            <FilePreview
              file={selectedFile}
              previewUrl={previewUrl}
              onRemove={handleRemoveFile}
            />
          )}

          {isUploading && <LoadingSpinner />}

          {extractedData && (
            <>
              <FilePreview
                file={selectedFile!}
                previewUrl={previewUrl}
                onRemove={handleRemoveFile}
              />
              <EventConfirmation
                data={extractedData}
                onGetRecommendations={handleGetRecommendations}
                onUpdate={handleEventUpdate}
              />
            </>
          )}
        </div>
      </main>
    </div>
  )
}
