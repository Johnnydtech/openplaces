/**
 * OpenPlaces Frontend Entry Point
 * Story 1.7: ClerkProvider configuration for authentication
 */

import React from 'react'
import ReactDOM from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import App from './App.tsx'
import './index.css'

// Story 1.7 AC: Read VITE_CLERK_PUBLISHABLE_KEY from environment
const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!CLERK_PUBLISHABLE_KEY) {
  console.warn(
    'VITE_CLERK_PUBLISHABLE_KEY not set - authentication features will be limited.\n' +
    'To enable authentication, add VITE_CLERK_PUBLISHABLE_KEY to frontend/.env.local'
  )
}

// Story 1.7 AC: ClerkProvider wraps app in main.tsx
// Story 2.1 AC: After registration, redirected to home
// Story 2.2 AC: After login, redirected to home
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ClerkProvider
      publishableKey={CLERK_PUBLISHABLE_KEY || ''}
      afterSignInUrl="/"
      afterSignUpUrl="/"
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
    >
      <App />
    </ClerkProvider>
  </React.StrictMode>,
)
