/**
 * OpenPlaces App
 * Story 2.1, 2.2, 2.3: Navbar with authentication
 */
import { useState } from 'react'
import Navbar from './components/Navbar'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <Navbar />
      <div className="app-container">
        <h1>Welcome to OpenPlaces</h1>
        <p className="tagline">Strategic Ad Placement Recommender for Arlington, VA</p>

        <div className="card">
          <button onClick={() => setCount((count) => count + 1)}>
            count is {count}
          </button>
          <p>
            Development environment ready. Start building features!
          </p>
        </div>

        <p className="read-the-docs">
          Frontend is running with React 18 + TypeScript + Vite 5.x
        </p>
      </div>
    </>
  )
}

export default App
