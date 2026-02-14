/**
 * OpenPlaces Main Application Component
 * Story 1.7: Clerk authentication UI demonstration
 *
 * INSTRUCTIONS: This is the updated App.tsx with Clerk authentication.
 * After npm install @clerk/clerk-react, replace App.tsx with this file:
 *   mv frontend/src/App.NEW.tsx frontend/src/App.tsx
 */

import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton
} from '@clerk/clerk-react'
import './App.css'

function App() {
  return (
    <>
      <div className="app-container">
        <header className="app-header" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1rem 2rem',
          borderBottom: '1px solid #e0e0e0',
          marginBottom: '2rem'
        }}>
          <div>
            <h1 style={{ margin: 0 }}>OpenPlaces</h1>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: '#666' }}>
              Strategic Ad Placement Recommender
            </p>
          </div>

          {/* Story 1.7 AC: Clerk components available */}
          <div className="auth-buttons" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <SignedOut>
              <SignInButton mode="modal">
                <button className="sign-in-button" style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '0.375rem',
                  border: '1px solid #646cff',
                  background: 'white',
                  color: '#646cff',
                  cursor: 'pointer',
                  fontWeight: 500
                }}>
                  Sign In
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="sign-up-button" style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '0.375rem',
                  border: 'none',
                  background: '#646cff',
                  color: 'white',
                  cursor: 'pointer',
                  fontWeight: 500
                }}>
                  Sign Up
                </button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <UserButton />
            </SignedIn>
          </div>
        </header>

        <main style={{ padding: '0 2rem' }}>
          <p className="tagline" style={{
            fontSize: '1.125rem',
            color: '#666',
            marginBottom: '2rem'
          }}>
            Strategic Ad Placement Recommender for Arlington, VA
          </p>

          {/* Anonymous User View */}
          <SignedOut>
            <div className="card" style={{
              padding: '1.5rem',
              borderRadius: '0.5rem',
              border: '1px solid #e0e0e0',
              marginBottom: '1rem'
            }}>
              <h3 style={{ marginTop: 0 }}>Welcome to OpenPlaces!</h3>
              <p style={{ marginBottom: '1rem' }}>
                Sign in to save your recommendations and access all features.
              </p>
              <p style={{
                fontSize: '0.875rem',
                color: '#666',
                background: '#f5f5f5',
                padding: '0.75rem',
                borderRadius: '0.25rem',
                marginBottom: 0
              }}>
                💡 <strong>Freemium Model:</strong> Continue as a guest to see top 3 zone recommendations,
                or sign up for full access to all 10 recommended zones plus saved recommendations.
              </p>
            </div>
          </SignedOut>

          {/* Authenticated User View */}
          <SignedIn>
            <div className="card" style={{
              padding: '1.5rem',
              borderRadius: '0.5rem',
              border: '1px solid #e0e0e0',
              background: '#f0fdf4',
              borderColor: '#86efac',
              marginBottom: '1rem'
            }}>
              <h3 style={{ marginTop: 0, color: '#166534' }}>Welcome back!</h3>
              <p style={{ marginBottom: '1rem', color: '#166534' }}>
                You have full access to all 10 zone recommendations, saved recommendations, and upload history.
              </p>
              <p style={{
                fontSize: '0.875rem',
                color: '#166534',
                background: '#dcfce7',
                padding: '0.75rem',
                borderRadius: '0.25rem',
                marginBottom: 0
              }}>
                📍 <strong>Ready to start:</strong> Upload an event flyer to get AI-powered placement recommendations
                for Arlington, VA. Your recommendations will be saved to your account.
              </p>
            </div>
          </SignedIn>

          {/* Development Status */}
          <div style={{
            marginTop: '2rem',
            padding: '1rem',
            background: '#f5f5f5',
            borderRadius: '0.5rem',
            fontSize: '0.875rem'
          }}>
            <p style={{ margin: '0 0 0.5rem 0', fontWeight: 600 }}>
              Development Environment Status:
            </p>
            <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
              <li>✅ React 18 + TypeScript + Vite 5.x</li>
              <li>✅ FastAPI backend at localhost:8000</li>
              <li>✅ CORS configured for localhost:5173</li>
              <li>✅ Clerk authentication configured</li>
              <li>✅ Supabase PostgreSQL + PostGIS ready</li>
            </ul>
          </div>

          <p className="read-the-docs" style={{
            marginTop: '2rem',
            fontSize: '0.875rem',
            color: '#888',
            textAlign: 'center'
          }}>
            Story 1.7: Clerk Authentication Provider configured
          </p>
        </main>
      </div>
    </>
  )
}

export default App
