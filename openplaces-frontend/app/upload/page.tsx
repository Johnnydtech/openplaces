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
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      toast.error('File too large (max 10MB). Compress image or enter details manually.')
      return
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      toast.error('File type not supported. Upload JPG, PNG, or PDF instead.')
      return
    }

    setSelectedFile(file)

    if (file.type !== 'application/pdf') {
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }

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
        toast.error('File cannot be read. Try different file or enter manually.', { id: 'upload' })
      } else if (error.response?.status === 504) {
        toast.error('Analysis timed out. Use clearer image or enter manually.', { id: 'upload' })
      } else if (error.code === 'ECONNABORTED') {
        toast.error('Upload timed out. Check connection and try again.', { id: 'upload' })
      } else {
        toast.error('AI extraction unavailable. Enter event details manually instead.', { id: 'upload' })
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
    if (!extractedData) {
      toast.error('No event data available')
      return
    }

    if (!extractedData.latitude || !extractedData.longitude) {
      toast.error('Venue must be geocoded first')
      return
    }

    const eventData = {
      name: extractedData.event_name,
      date: extractedData.event_date,
      time: extractedData.event_time,
      venue_lat: extractedData.latitude,
      venue_lon: extractedData.longitude,
      target_audience: extractedData.target_audience,
      event_type: extractedData.event_type || 'Community event'
    }

    const params = new URLSearchParams({
      eventData: JSON.stringify(eventData)
    })
    router.push(`/recommendations?${params.toString()}`)
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
    <div className="min-h-screen" style={{ background: '#0f1c24' }}>
      <Toaster position="top-center" />

      {/* Header */}
      <nav className="border-b" style={{ background: '#1a2f3a', borderColor: '#2a4551' }}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <h1 className="text-2xl font-bold text-white">OpenPlaces</h1>
          <button
            onClick={() => router.push('/')}
            className="text-sm font-semibold hover:text-white transition-colors flex items-center gap-1"
            style={{ color: '#94a3b8' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
            </svg>
            Back to Home
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="mx-auto max-w-3xl px-6 py-12">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold tracking-tight text-white mb-3">
            Upload Your Event Flyer
          </h2>
          <p className="text-lg" style={{ color: '#94a3b8' }}>
            AI will extract event details automatically
          </p>
        </div>

        <div className="space-y-6">
          {!selectedFile && !showManualForm && (
            <>
              <UploadZone onFileSelect={handleFileSelect} isUploading={isUploading} />
              <div className="text-center">
                <button
                  onClick={() => setShowManualForm(true)}
                  className="text-sm font-semibold hover:underline"
                  style={{ color: '#4ade80' }}
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
