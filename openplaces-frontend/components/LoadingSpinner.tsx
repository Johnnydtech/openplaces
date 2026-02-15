'use client'

export default function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center gap-4 py-12">
      <div className="h-16 w-16 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600"></div>
      <div className="text-center">
        <p className="text-lg font-semibold text-gray-900">Analyzing your flyer...</p>
        <p className="mt-1 text-sm text-gray-500">This may take up to 60 seconds</p>
      </div>
    </div>
  )
}
