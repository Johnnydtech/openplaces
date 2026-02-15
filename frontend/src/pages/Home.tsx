/**
 * Home Page
 * Public page - accessible to all users
 */
export default function Home() {
  return (
    <div className="page-container">
      <h1>Welcome to OpenPlaces</h1>
      <p className="tagline">Strategic Ad Placement Recommender for Arlington, VA</p>

      <div className="card">
        <h2>Get Started</h2>
        <p>Upload an event flyer to get strategic ad placement recommendations</p>
        {/* Story 3.1 implementation will add upload interface */}
      </div>

      <p className="read-the-docs">
        Sign up to save recommendations and track your upload history
      </p>
    </div>
  )
}
