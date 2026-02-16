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
    <div className="relative rounded-xl border p-4 shadow-2xl backdrop-blur-xl" style={{ background: 'rgba(26, 47, 58, 0.85)', borderColor: 'rgba(74, 222, 128, 0.2)' }}>
      <button
        onClick={onRemove}
        className="absolute right-2 top-2 z-10 rounded-full p-1.5 text-white transition-colors hover:opacity-80"
        style={{ background: '#ef4444' }}
        aria-label="Remove file"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
        </svg>
      </button>

      {isPDF ? (
        <div className="flex h-48 items-center justify-center rounded" style={{ background: '#1e3a48' }}>
          <div className="text-center">
            <p className="text-4xl">📄</p>
            <p className="mt-2 text-sm font-medium text-white">{file.name}</p>
            <p className="text-xs" style={{ color: '#94a3b8' }}>{(file.size / 1024 / 1024).toFixed(2)} MB</p>
          </div>
        </div>
      ) : (
        <div className="relative h-48 w-full rounded overflow-hidden" style={{ background: '#1e3a48' }}>
          <Image
            src={previewUrl}
            alt="Flyer preview"
            fill
            className="object-contain"
          />
        </div>
      )}

      <div className="mt-3 text-sm">
        <p className="font-medium text-white">{file.name}</p>
        <p className="text-xs" style={{ color: '#94a3b8' }}>
          {file.type} • {(file.size / 1024 / 1024).toFixed(2)} MB
        </p>
      </div>
    </div>
  )
}
