'use client'

import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function UploadHistoryPage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Navbar */}
      <nav className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <Link href="/" className="text-2xl font-bold text-gray-900">
            OpenPlaces
          </Link>
          <button
            onClick={() => router.push('/')}
            className="text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            ← Back to Home
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">
            Upload History
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Welcome, {user?.firstName || 'User'}! 👋
          </p>
          <p className="mt-2 text-gray-500">
            This protected page is only accessible when you're logged in.
          </p>

          <div className="mt-12 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-12">
            <p className="text-2xl">📁</p>
            <p className="mt-4 text-lg font-semibold text-gray-700">
              Upload history feature coming soon!
            </p>
            <p className="mt-2 text-sm text-gray-500">
              Story 2.10 will implement flyer upload persistence with user linking.
            </p>
          </div>

          <div className="mt-8">
            <Link
              href="/upload"
              className="rounded-md bg-blue-600 px-6 py-3 text-base font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
            >
              Upload New Flyer
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
