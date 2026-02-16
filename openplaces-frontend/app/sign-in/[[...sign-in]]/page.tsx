'use client'

import { SignIn } from '@clerk/nextjs'
import dynamic from 'next/dynamic'

// Dynamically import map to avoid SSR issues
const MapComponent = dynamic(() => import('@/components/Map'), { ssr: false })

export default function SignInPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden">
      {/* Background Map */}
      <div className="absolute inset-0 opacity-40">
        <MapComponent
          className="h-full w-full"
          recommendations={[]}
          eventData={null}
        />
      </div>

      {/* Dark Overlay */}
      <div className="absolute inset-0" style={{ background: 'rgba(15, 28, 36, 0.85)' }} />

      {/* Arlington Beta Badge */}
      <div className="absolute top-6 right-6 z-20">
        <div
          className="rounded-lg px-4 py-2 backdrop-blur-xl shadow-lg"
          style={{
            background: 'rgba(26, 47, 58, 0.95)',
            border: '1px solid rgba(74, 222, 128, 0.3)'
          }}
        >
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="#4ade80" className="w-4 h-4">
              <path fillRule="evenodd" d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 103 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 002.273 1.765 11.842 11.842 0 00.976.544l.062.029.018.008.006.003zM10 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="text-xs font-semibold text-white">Currently Available in Arlington, VA Only</p>
              <p className="text-xs" style={{ color: '#4ade80' }}>Beta Program</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sign In Form */}
      <div className="relative z-10">
        <SignIn
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "shadow-2xl",
            },
          }}
          fallbackRedirectUrl="/"
        />
      </div>
    </div>
  )
}
