/**
 * Clerk Authentication Utilities
 * Story 1.7: Configure Clerk Authentication Provider
 */

import { useUser, useAuth, useClerk } from '@clerk/clerk-react'

export { useUser, useAuth, useClerk }

/**
 * Check if Clerk is properly configured
 * @returns true if VITE_CLERK_PUBLISHABLE_KEY is set
 */
export function isClerkConfigured(): boolean {
  return Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY)
}

/**
 * Get the Clerk publishable key from environment
 * @returns Clerk publishable key or empty string if not set
 */
export function getClerkPublishableKey(): string {
  return import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || ''
}

/**
 * Type guard to check if user is authenticated
 * This is a convenience wrapper around Clerk's useAuth hook
 */
export function useIsAuthenticated(): boolean {
  const { isSignedIn } = useAuth()
  return Boolean(isSignedIn)
}
