/**
 * Story 2.1, 2.2, 2.3: Navigation bar with Clerk authentication
 *
 * Features:
 * - Sign Up button (Story 2.1)
 * - Sign In button (Story 2.2)
 * - UserButton with Sign Out (Story 2.3)
 */
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from '@clerk/clerk-react'
import './Navbar.css'

export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <h1>OpenPlaces</h1>
          <span className="navbar-tagline">Strategic Ad Placement</span>
        </div>

        <div className="navbar-actions">
          {/* Story 2.3 AC: UserButton in navbar for logged-in users */}
          <SignedIn>
            <UserButton
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: "w-10 h-10"
                }
              }}
            />
          </SignedIn>

          {/* Story 2.1 AC: "Sign Up" in navbar shows Clerk's registration form */}
          {/* Story 2.2 AC: "Sign In" in navbar shows Clerk's login form */}
          <SignedOut>
            <SignInButton mode="modal">
              <button className="navbar-button navbar-button-secondary">
                Sign In
              </button>
            </SignInButton>

            <SignUpButton mode="modal">
              <button className="navbar-button navbar-button-primary">
                Sign Up
              </button>
            </SignUpButton>
          </SignedOut>
        </div>
      </div>
    </nav>
  )
}
