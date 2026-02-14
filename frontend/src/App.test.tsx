import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from './App'

describe('App', () => {
  it('renders OpenPlaces heading', () => {
    render(<App />)
    const heading = screen.getByRole('heading', { name: /OpenPlaces/i })
    expect(heading).toBeInTheDocument()
  })

  it('displays the tagline', () => {
    render(<App />)
    const tagline = screen.getByText(/Strategic Ad Placement Recommender for Arlington, VA/i)
    expect(tagline).toBeInTheDocument()
  })

  it('shows development environment message', () => {
    render(<App />)
    const message = screen.getByText(/Frontend is running with React 18 \+ TypeScript \+ Vite 5\.x/i)
    expect(message).toBeInTheDocument()
  })
})
