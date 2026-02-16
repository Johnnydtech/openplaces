'use client'

import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs'
import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0f1c24' }}>
      {/* Navbar */}
      <nav className="border-b" style={{ background: '#1a2f3a', borderColor: '#2a4551' }}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <h1 className="text-2xl font-bold text-white">OpenPlaces</h1>

          <div className="flex items-center gap-4">
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

            <SignedIn>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex items-center">
        <div className="mx-auto max-w-4xl px-6 py-16 text-center">
          <h2 className="text-5xl font-bold tracking-tight text-white sm:text-6xl mb-6">
            Strategic Ad Placement<br />
            <span style={{ color: '#4ade80' }}>for Arlington, VA</span>
          </h2>
          <p className="mt-6 text-lg leading-8 max-w-2xl mx-auto" style={{ color: '#94a3b8' }}>
            AI-powered recommendations for physical ad placement. Upload your event flyer and discover the best locations to reach your audience.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Link
              href="/upload"
              className="rounded-lg px-8 py-4 text-lg font-semibold transition-all"
              style={{ background: '#4ade80', color: '#0f1c24' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#22c55e'
                e.currentTarget.style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#4ade80'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              Get Started →
            </Link>
            <SignedIn>
              <Link
                href="/saved-recommendations"
                className="rounded-lg px-8 py-4 text-lg font-semibold border transition-all"
                style={{ color: '#4ade80', borderColor: '#4ade80' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#1e3a48'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                }}
              >
                View Saved
              </Link>
            </SignedIn>
          </div>

          {/* Feature Cards */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-lg p-6" style={{ background: '#1a2f3a' }}>
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

            <div className="rounded-lg p-6" style={{ background: '#1a2f3a' }}>
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

            <div className="rounded-lg p-6" style={{ background: '#1a2f3a' }}>
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
      </main>
    </div>
  )
}
