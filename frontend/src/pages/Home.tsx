/**
 * Home Page
 * Public page - accessible to all users
 */
import { useNavigate } from 'react-router-dom'
import './Home.css'

export default function Home() {
  const navigate = useNavigate()

  return (
    <div className="page-container home-page">
      <div className="hero-section">
        <h1>Welcome to OpenPlaces</h1>
        <p className="tagline">Strategic Ad Placement Recommender for Arlington, VA</p>

        <button
          className="upload-button-primary"
          onClick={() => navigate('/upload')}
        >
          📤 Upload Event Flyer
        </button>

        <p className="upload-hint">
          Get AI-powered placement zone recommendations in seconds
        </p>
      </div>

      <div className="features-section">
        <div className="feature-card">
          <div className="feature-icon">🎯</div>
          <h3>Smart Recommendations</h3>
          <p>AI analyzes your event to suggest the best placement zones</p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">🗺️</div>
          <h3>Interactive Map</h3>
          <p>Visualize zones with rankings, distances, and timing insights</p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">⚠️</div>
          <h3>Risk Warnings</h3>
          <p>Get alerts about deceptive hotspots with better alternatives</p>
        </div>
      </div>

      <p className="read-the-docs">
        Sign up to save recommendations and track your upload history
      </p>
    </div>
  )
}
