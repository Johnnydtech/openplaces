'use client'

export default function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center gap-4 py-12">
      <div className="h-16 w-16 animate-spin rounded-full border-4" style={{ borderColor: 'rgba(74, 222, 128, 0.2)', borderTopColor: '#4ade80' }}></div>
      <div className="text-center">
        <p className="text-lg font-semibold text-white">Analyzing your flyer...</p>
        <p className="mt-1 text-sm" style={{ color: '#94a3b8' }}>This may take up to 60 seconds</p>
      </div>
    </div>
  )
}
