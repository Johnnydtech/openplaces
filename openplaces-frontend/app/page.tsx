'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs'
import Link from 'next/link'
import toast, { Toaster } from 'react-hot-toast'
import UploadZone from '@/components/UploadZone'
import FilePreview from '@/components/FilePreview'
import EventConfirmation from '@/components/EventConfirmation'
import LoadingSpinner from '@/components/LoadingSpinner'
import { analyzeFlyer } from '@/lib/api'

export default function Home() {
  const router = useRouter()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [isUploading, setIsUploading] = useState(false)
  const [extractedData, setExtractedData] = useState<any>(null)

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

  const handleEventUpdate = (updatedData: any) => {
    setExtractedData(updatedData)
  }

  return (
    <div
      className="min-h-screen flex flex-col relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #0a1628 0%, #1a2f3a 50%, #0f3d3e 100%)'
      }}
    >
      {/* Animated background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute w-96 h-96 rounded-full opacity-20 blur-3xl animate-pulse"
          style={{
            background: 'radial-gradient(circle, #4ade80 0%, transparent 70%)',
            top: '-10%',
            right: '-5%',
            animationDuration: '4s'
          }}
        />
        <div
          className="absolute w-96 h-96 rounded-full opacity-20 blur-3xl animate-pulse"
          style={{
            background: 'radial-gradient(circle, #22d3ee 0%, transparent 70%)',
            bottom: '-10%',
            left: '-5%',
            animationDuration: '6s',
            animationDelay: '2s'
          }}
        />
      </div>

      <Toaster position="top-center" />

      {/* Navbar */}
      <nav
        className="border-b backdrop-blur-xl relative z-10"
        style={{
          background: 'rgba(26, 47, 58, 0.7)',
          borderColor: 'rgba(42, 69, 81, 0.5)'
        }}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <h1 className="text-2xl font-bold text-white">OpenPlaces</h1>

          <div className="flex items-center gap-4">
            <SignedIn>
              <Link
                href="/saved-recommendations"
                className="text-sm font-semibold hover:text-white transition-colors"
                style={{ color: '#94a3b8' }}
              >
                Saved
              </Link>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>

            <SignedOut>
              <Link
                href="/sign-in"
                className="text-sm font-semibold hover:text-white transition-colors"
                style={{ color: '#94a3b8' }}
              >
                Sign In
              </Link>
              <Link
                href="/sign-up"
                className="rounded-md px-4 py-2 text-sm font-semibold transition-colors"
                style={{ background: '#4ade80', color: '#0f1c24' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#22c55e' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#4ade80' }}
              >
                Sign Up
              </Link>
            </SignedOut>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center relative z-10">
        <div className="mx-auto max-w-4xl px-6 py-16 w-full">
          {!selectedFile && !extractedData ? (
            // Hero Section with Upload
            <div className="text-center mb-12">
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                <h2 className="text-5xl font-bold tracking-tight text-white sm:text-6xl mb-6 leading-tight">
                  Strategic Ad Placement<br />
                  <span
                    className="inline-block bg-clip-text text-transparent animate-in fade-in duration-1000"
                    style={{
                      backgroundImage: 'linear-gradient(135deg, #4ade80 0%, #22d3ee 100%)'
                    }}
                  >
                    for Arlington, VA
                  </span>
                </h2>
              </div>
              <p
                className="mt-6 text-lg leading-8 max-w-2xl mx-auto mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700"
                style={{ color: '#94a3b8', animationDelay: '150ms' }}
              >
                AI-powered recommendations for physical ad placement. Upload your event flyer and discover the best locations to reach your audience.
              </p>

              <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700" style={{ animationDelay: '300ms' }}>
                <UploadZone onFileSelect={handleFileSelect} isUploading={isUploading} />
              </div>

              {/* Feature Cards */}
              <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div
                  className="rounded-xl p-6 backdrop-blur-sm border transition-all duration-300 hover:scale-105 hover:shadow-2xl"
                  style={{
                    background: 'rgba(26, 47, 58, 0.5)',
                    borderColor: 'rgba(74, 222, 128, 0.2)'
                  }}
                >
                  <div className="flex items-center justify-center w-12 h-12 rounded-full mx-auto mb-4" style={{ background: '#2a4551' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="#4ade80" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">AI-Powered Analysis</h3>
                  <p className="text-sm" style={{ color: '#94a3b8' }}>
                    Upload your flyer and let AI extract event details automatically
                  </p>
                </div>

                <div
                  className="rounded-xl p-6 backdrop-blur-sm border transition-all duration-300 hover:scale-105 hover:shadow-2xl"
                  style={{
                    background: 'rgba(26, 47, 58, 0.5)',
                    borderColor: 'rgba(74, 222, 128, 0.2)'
                  }}
                >
                  <div className="flex items-center justify-center w-12 h-12 rounded-full mx-auto mb-4" style={{ background: '#2a4551' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="#4ade80" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">Smart Recommendations</h3>
                  <p className="text-sm" style={{ color: '#94a3b8' }}>
                    Get top 10 ranked zones based on audience match and timing
                  </p>
                </div>

                <div
                  className="rounded-xl p-6 backdrop-blur-sm border transition-all duration-300 hover:scale-105 hover:shadow-2xl"
                  style={{
                    background: 'rgba(26, 47, 58, 0.5)',
                    borderColor: 'rgba(74, 222, 128, 0.2)'
                  }}
                >
                  <div className="flex items-center justify-center w-12 h-12 rounded-full mx-auto mb-4" style={{ background: '#2a4551' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="#4ade80" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">Risk Warnings</h3>
                  <p className="text-sm" style={{ color: '#94a3b8' }}>
                    Get alerted about deceptive hotspots and better alternatives
                  </p>
                </div>
              </div>
            </div>
          ) : (
            // Upload Results Section
            <div className="space-y-6">
              <button
                onClick={handleRemoveFile}
                className="text-sm font-semibold hover:text-white transition-colors flex items-center gap-2 mb-4"
                style={{ color: '#94a3b8' }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                  <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
                </svg>
                Upload a different flyer
              </button>

              {isUploading && <LoadingSpinner />}

              {selectedFile && !isUploading && (
                <FilePreview
                  file={selectedFile}
                  previewUrl={previewUrl}
                  onRemove={handleRemoveFile}
                />
              )}

              {extractedData && (
                <EventConfirmation
                  data={extractedData}
                  onGetRecommendations={handleGetRecommendations}
                  onUpdate={handleEventUpdate}
                />
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
