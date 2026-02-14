import { useState } from 'react'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div className="app-container">
        <h1>OpenPlaces</h1>
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
