'use client'

import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs'
import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Navbar */}
      <nav className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">OpenPlaces</h1>

          <div className="flex items-center gap-4">
            {/* Show when user is NOT logged in */}
            <SignedOut>
              <Link
                href="/sign-up"
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
              >
                Sign Up
              </Link>
            </SignedOut>

            {/* Show when user IS logged in */}
            <SignedIn>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-16">
        <div className="text-center">
          <h2 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
            Strategic Ad Placement for Arlington, VA
          </h2>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            AI-powered recommendations for physical ad placement. Upload your event flyer and discover the best locations to reach your audience.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Link
              href="/upload"
              className="rounded-md bg-blue-600 px-6 py-3 text-base font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
            >
              Get Started
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
