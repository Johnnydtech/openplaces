/**
 * OpenPlaces App
 * Story 2.1-2.4: Authentication and routing
 */
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import SavedRecommendations from './pages/SavedRecommendations'
import UploadHistory from './pages/UploadHistory'
import './App.css'

/**
 * Story 2.4: ProtectedRoute wrapper
 * Redirects unauthenticated users to sign-in with return URL
 */
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SignedIn>{children}</SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <div className="app-container">
        <Routes>
          {/* Public route */}
          <Route path="/" element={<Home />} />

          {/* Story 2.4 AC: Protected routes for authenticated users */}
          <Route
            path="/saved-recommendations"
            element={
              <ProtectedRoute>
                <SavedRecommendations />
              </ProtectedRoute>
            }
          />

          <Route
            path="/upload-history"
            element={
              <ProtectedRoute>
                <UploadHistory />
              </ProtectedRoute>
            }
          />

          {/* Catch-all redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App
