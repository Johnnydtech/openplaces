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
        relative cursor-pointer rounded-lg border-2 border-dashed p-12 text-center transition-colors
        ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'}
        ${isUploading ? 'cursor-not-allowed opacity-50' : 'hover:border-blue-400 hover:bg-blue-50'}
      `}
    >
      <input {...getInputProps()} />

      <div className="flex flex-col items-center gap-4">
        {isDragActive ? (
          <>
            <div className="h-16 w-16 text-blue-500">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
              </svg>
            </div>
            <p className="text-lg font-semibold text-blue-600">Drop your flyer here</p>
          </>
        ) : (
          <>
            <div className="h-16 w-16 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
              </svg>
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-700">
                Drag & drop your event flyer
              </p>
              <p className="mt-2 text-sm text-gray-500">
                or click to browse files
              </p>
            </div>
            <p className="text-xs text-gray-400">
              JPG, PNG, or PDF (max 10MB)
            </p>
          </>
        )}
      </div>

      {/* Mobile camera button (hidden on desktop) */}
      <button
        type="button"
        className="mt-6 block w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 sm:hidden"
        onClick={(e) => {
          e.stopPropagation()
          // Trigger camera via input
          const input = document.querySelector('input[type="file"]') as HTMLInputElement
          if (input) {
            input.setAttribute('capture', 'environment')
            input.click()
          }
        }}
      >
        📷 Take Photo
      </button>
    </div>
  )
}
