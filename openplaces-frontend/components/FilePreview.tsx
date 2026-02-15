'use client'

import Image from 'next/image'

interface FilePreviewProps {
  file: File
  previewUrl: string
  onRemove: () => void
}

export default function FilePreview({ file, previewUrl, onRemove }: FilePreviewProps) {
  const isPDF = file.type === 'application/pdf'

  return (
    <div className="relative rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <button
        onClick={onRemove}
        className="absolute right-2 top-2 rounded-full bg-red-500 p-1 text-white hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        aria-label="Remove file"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
        </svg>
      </button>

      {isPDF ? (
        <div className="flex h-48 items-center justify-center bg-gray-100">
          <div className="text-center">
            <p className="text-4xl">📄</p>
            <p className="mt-2 text-sm font-medium text-gray-700">{file.name}</p>
            <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
          </div>
        </div>
      ) : (
        <div className="relative h-48 w-full">
          <Image
            src={previewUrl}
            alt="Flyer preview"
            fill
            className="rounded object-contain"
          />
        </div>
      )}

      <div className="mt-3 text-sm text-gray-600">
        <p className="font-medium">{file.name}</p>
        <p className="text-xs text-gray-400">
          {file.type} • {(file.size / 1024 / 1024).toFixed(2)} MB
        </p>
      </div>
    </div>
  )
}
