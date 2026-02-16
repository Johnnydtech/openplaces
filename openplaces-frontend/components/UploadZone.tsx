'use client'

import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'

interface UploadZoneProps {
  onFileSelect: (file: File) => void
  isUploading: boolean
}

export default function UploadZone({ onFileSelect, isUploading }: UploadZoneProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onFileSelect(acceptedFiles[0])
      }
    },
    [onFileSelect]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'application/pdf': ['.pdf'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false,
    disabled: isUploading,
  })

  return (
    <div
      {...getRootProps()}
      className={`
        relative cursor-pointer rounded-lg border-2 border-dashed p-12 text-center transition-all
        ${isDragActive ? 'scale-[1.02]' : ''}
        ${isUploading ? 'cursor-not-allowed opacity-50' : 'hover:border-opacity-100'}
      `}
      style={{
        borderColor: isDragActive ? '#4ade80' : '#2a4551',
        background: isDragActive ? '#4ade8020' : '#1a2f3a'
      }}
    >
      <input {...getInputProps()} />

      <div className="flex flex-col items-center gap-4">
        {isDragActive ? (
          <>
            <div className="h-16 w-16" style={{ color: '#4ade80' }}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
              </svg>
            </div>
            <p className="text-lg font-semibold" style={{ color: '#4ade80' }}>Drop your flyer here</p>
          </>
        ) : (
          <>
            <div className="h-16 w-16" style={{ color: '#94a3b8' }}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
              </svg>
            </div>
            <div>
              <p className="text-lg font-semibold text-white">
                Drag & drop your event flyer
              </p>
              <p className="mt-2 text-sm" style={{ color: '#94a3b8' }}>
                or click to browse files
              </p>
            </div>
            <p className="text-xs" style={{ color: '#94a3b8' }}>
              JPG, PNG, or PDF (max 10MB)
            </p>
          </>
        )}
      </div>

      {/* Mobile camera button (hidden on desktop) */}
      <button
        type="button"
        className="mt-6 block w-full rounded-lg px-4 py-2 text-sm font-semibold transition-colors focus:outline-none sm:hidden"
        style={{ background: '#4ade80', color: '#0f1c24' }}
        onClick={(e) => {
          e.stopPropagation()
          const input = document.querySelector('input[type="file"]') as HTMLInputElement
          if (input) {
            input.setAttribute('capture', 'environment')
            input.click()
          }
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = '#22c55e' }}
        onMouseLeave={(e) => { e.currentTarget.style.background = '#4ade80' }}
      >
        📷 Take Photo
      </button>
    </div>
  )
}
