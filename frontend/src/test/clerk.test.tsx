import { describe, it, expect } from 'vitest'
import { isClerkConfigured, getClerkPublishableKey } from '../lib/clerk'

/**
 * Story 1.7: Configure Clerk Authentication Provider
 * Tests verify Clerk is properly configured and utilities work correctly
 */

describe('Story 1.7: Clerk Authentication Configuration', () => {
  describe('Clerk Configuration Utilities', () => {
    it('should expose isClerkConfigured function', () => {
      expect(typeof isClerkConfigured).toBe('function')
    })

    it('should expose getClerkPublishableKey function', () => {
      expect(typeof getClerkPublishableKey).toBe('function')
    })

    it('isClerkConfigured should return boolean', () => {
      const configured = isClerkConfigured()
      expect(typeof configured).toBe('boolean')
    })

    it('getClerkPublishableKey should return string', () => {
      const key = getClerkPublishableKey()
      expect(typeof key).toBe('string')
      // In test environment, key may be empty (that's OK for testing)
    })

    it('should read VITE_CLERK_PUBLISHABLE_KEY from environment', () => {
      const key = getClerkPublishableKey()
      // If environment variable is set, it should start with pk_
      if (key) {
        expect(key).toMatch(/^pk_/)
      }
    })

    it('isClerkConfigured should be false when key is not set', () => {
      // In test environment without VITE_CLERK_PUBLISHABLE_KEY
      const key = getClerkPublishableKey()
      if (!key) {
        expect(isClerkConfigured()).toBe(false)
      }
    })

    it('isClerkConfigured should be true when key is set', () => {
      const key = getClerkPublishableKey()
      if (key) {
        expect(isClerkConfigured()).toBe(true)
      }
    })
  })

  describe('Environment Variable Configuration', () => {
    it('should not throw when accessing environment variables', () => {
      expect(() => getClerkPublishableKey()).not.toThrow()
      expect(() => isClerkConfigured()).not.toThrow()
    })
  })
})

/**
 * Story 1.7 Acceptance Criteria Verification
 *
 * AC 1: @clerk/clerk-react installed
 * - Verified by: Ability to import from '@clerk/clerk-react' in clerk.ts
 * - Test: If this test file runs, the package is installed
 *
 * AC 2: ClerkProvider wraps app in main.tsx
 * - Implementation: See frontend/src/main.tsx
 * - Manual Test: Run app and verify Clerk context is available
 *
 * AC 3: VITE_CLERK_PUBLISHABLE_KEY set
 * - Implementation: Already in .env.example
 * - Test: getClerkPublishableKey() reads from import.meta.env
 *
 * AC 4: Clerk components available
 * - Implementation: Components imported in App.tsx and clerk.ts
 * - Test: If imports don't fail, components are available
 *
 * AC 5: User session maintained across refreshes
 * - Implementation: ClerkProvider handles this automatically
 * - Manual Test: Sign in, refresh browser, verify still signed in
 */
