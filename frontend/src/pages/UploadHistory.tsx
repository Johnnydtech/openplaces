/**
 * Story 2.10: Upload History Page (Protected)
 * View flyer upload history with auto-expiration after 7 days
 */
import { useState, useEffect } from 'react'
import { useUser } from '@clerk/clerk-react'
import toast from 'react-hot-toast'
import './UploadHistory.css'

interface FlyerUpload {
  id: string
  storage_path: string
  public_url: string
  event_data: any
  created_at: string
  expires_at: string
}

export default function UploadHistory() {
  const { user } = useUser()
  const [uploads, setUploads] = useState<FlyerUpload[]>([])
  const [loading, setLoading] = useState(true)

  // Story 2.10 AC: View at /upload-history
  useEffect(() => {
    if (!user) return

    const fetchUploadHistory = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/flyer-uploads/history`,
          {
            headers: {
              'X-Clerk-User-Id': user.id
            }
          }
        )

        if (!response.ok) {
          throw new Error('Failed to fetch upload history')
        }

        const data = await response.json()
        setUploads(data.uploads || [])
      } catch (error) {
        console.error('Error fetching upload history:', error)
        toast.error('Failed to load upload history')
      } finally {
        setLoading(false)
      }
    }

    fetchUploadHistory()
  }, [user])

  // Delete upload
  const handleDelete = async (uploadId: string) => {
    if (!window.confirm('Delete this upload?')) {
      return
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/flyer-uploads/${uploadId}`,
        {
          method: 'DELETE',
          headers: {
            'X-Clerk-User-Id': user!.id
          }
        }
      )

      if (!response.ok) {
        throw new Error('Failed to delete upload')
      }

      toast.success('Upload deleted')
      setUploads(uploads.filter(u => u.id !== uploadId))
    } catch (error) {
      console.error('Error deleting upload:', error)
      toast.error('Failed to delete upload')
    }
  }

  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
  }

  // Calculate days until expiration
  const getDaysUntilExpiration = (expiresAt: string) => {
    const now = new Date()
    const expires = new Date(expiresAt)
    const daysLeft = Math.ceil((expires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return daysLeft
  }

  if (loading) {
    return (
      <div className="page-container">
        <h1>Upload History</h1>
        <p>Loading...</p>
      </div>
    )
  }

  // Empty state
  if (uploads.length === 0) {
    return (
      <div className="page-container">
        <h1>Upload History</h1>
        <div className="empty-state">
          <p>No uploads yet</p>
          <p className="empty-state-hint">
            Upload event flyers to get ad placement recommendations
          </p>
        </div>
      </div>
    )
  }

  // Story 2.10 AC: Display upload history
  return (
    <div className="page-container">
      <h1>Upload History</h1>
      <p className="page-subtitle">{uploads.length} upload{uploads.length !== 1 ? 's' : ''}</p>

      <div className="uploads-grid">
        {uploads.map(upload => {
          const daysLeft = getDaysUntilExpiration(upload.expires_at)

          return (
            <div key={upload.id} className="upload-card">
              {/* Flyer image preview */}
              <div className="upload-image-container">
                <img
                  src={upload.public_url}
                  alt="Event flyer"
                  className="upload-image"
                  onError={(e) => {
                    // Fallback if image fails to load
                    (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect fill="%23f3f4f6" width="200" height="200"/><text x="50%" y="50%" text-anchor="middle" fill="%236b7280" font-size="14">Image unavailable</text></svg>'
                  }}
                />
              </div>

              {/* Upload info */}
              <div className="upload-info">
                <div className="upload-header">
                  <div>
                    <h3 className="upload-title">
                      {upload.event_data?.name || 'Event Flyer'}
                    </h3>
                    <p className="upload-date">
                      Uploaded {formatDate(upload.created_at)}
                    </p>
                  </div>

                  <button
                    className="delete-button-small"
                    onClick={() => handleDelete(upload.id)}
                    aria-label="Delete upload"
                  >
                    ×
                  </button>
                </div>

                {/* Story 2.10 AC: Auto-deleted after 7 days - show expiration */}
                <div className={`expiration-notice ${daysLeft <= 2 ? 'expiring-soon' : ''}`}>
                  {daysLeft > 0 ? (
                    <>Expires in {daysLeft} day{daysLeft !== 1 ? 's' : ''}</>
                  ) : (
                    <>Expired</>
                  )}
                </div>

                {/* Event details if available */}
                {upload.event_data && (
                  <div className="event-details">
                    {upload.event_data.date && (
                      <p><strong>Date:</strong> {upload.event_data.date}</p>
                    )}
                    {upload.event_data.venue && (
                      <p><strong>Venue:</strong> {upload.event_data.venue}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
