/**
 * OpenPlaces App
 * Story 2.1-2.4: Authentication and routing
 * Story 2.6: Toast notifications for save actions
 */
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react'
import { Toaster } from 'react-hot-toast'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Upload from './pages/Upload'
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
      {/* Story 2.6: Toast notifications for save actions */}
      <Toaster position="top-right" />

      <Navbar />
      <div className="app-container">
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Home />} />
          <Route path="/upload" element={<Upload />} />

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
