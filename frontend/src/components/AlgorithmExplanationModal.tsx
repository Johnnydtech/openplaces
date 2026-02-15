/**
 * Story 4.13: Plain Language Algorithm Explanation Modal
 * Helps users understand how the recommendation algorithm works
 */
import './AlgorithmExplanationModal.css'

interface AlgorithmExplanationModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function AlgorithmExplanationModal({
  isOpen,
  onClose
}: AlgorithmExplanationModalProps) {
  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <h2>How Does This Work?</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close modal">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          <p className="modal-intro">
            We analyze Arlington's placement zones using four key factors to find the best matches for your event:
          </p>

          {/* Factor 1: Audience Match (40%) */}
          <div className="factor-section">
            <div className="factor-header">
              <div className="factor-icon audience-icon">👥</div>
              <div className="factor-title-group">
                <h3>1. Audience Match (40%)</h3>
                <span className="factor-weight">Heaviest weight</span>
              </div>
            </div>
            <p className="factor-description">
              <strong>Does the zone attract your target audience?</strong>
            </p>
            <p className="factor-example">
              <em>Example:</em> If you're promoting a coffee tasting event for young professionals,
              we'll prioritize zones near offices and coffee shops where 25-34 year olds spend time,
              like Ballston Metro or Clarendon restaurants.
            </p>
          </div>

          {/* Factor 2: Timing (30%) */}
          <div className="factor-section">
            <div className="factor-header">
              <div className="factor-icon timing-icon">🕐</div>
              <div className="factor-title-group">
                <h3>2. Timing (30%)</h3>
                <span className="factor-weight">Second priority</span>
              </div>
            </div>
            <p className="factor-description">
              <strong>Are people there when you need them?</strong>
            </p>
            <p className="factor-example">
              <em>Example:</em> For a Saturday concert, we prioritize zones during weekday evenings
              (5-7pm) when commuters are heading home and planning their weekends — not Saturday morning
              when it's too late.
            </p>
          </div>

          {/* Factor 3: Distance (20%) */}
          <div className="factor-section">
            <div className="factor-header">
              <div className="factor-icon distance-icon">📍</div>
              <div className="factor-title-group">
                <h3>3. Distance (20%)</h3>
                <span className="factor-weight">Proximity matters</span>
              </div>
            </div>
            <p className="factor-description">
              <strong>How close is the zone to your event venue?</strong>
            </p>
            <p className="factor-example">
              <em>Example:</em> If your venue is in Clarendon, nearby zones like Clarendon Metro
              and Whole Foods Clarendon score higher than distant zones in Ballston, since your
              audience is more likely to see ads close to where they'll attend.
            </p>
          </div>

          {/* Factor 4: Dwell Time (10%) */}
          <div className="factor-section">
            <div className="factor-header">
              <div className="factor-icon dwell-icon">⏱️</div>
              <div className="factor-title-group">
                <h3>4. Dwell Time (10%)</h3>
                <span className="factor-weight">Nice to have</span>
              </div>
            </div>
            <p className="factor-description">
              <strong>Do people stop and look, or rush past?</strong>
            </p>
            <p className="factor-example">
              <em>Example:</em> A coffee shop bulletin board (45-second average dwell time)
              beats a Metro turnstile area (15 seconds) because people actually pause to read,
              not just glance while rushing through.
            </p>
          </div>

          {/* Final Score */}
          <div className="score-explanation">
            <h3>Your Final Score</h3>
            <p>
              We add up all four factors to give each zone a score from 0 to 100.
              The zones with the highest scores are your top recommendations —
              but remember, these are <strong>signals</strong>, not commands.
              You know your event best, so use these insights to make the final decision.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="modal-close-button" onClick={onClose}>
            Got it!
          </button>
        </div>
      </div>
    </div>
  )
}
