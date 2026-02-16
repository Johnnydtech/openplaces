'use client'

import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { ZoneRecommendation, EventDataForRecommendations } from '@/lib/api'

// Story 5.1 AC: API key from environment variables (not hardcoded)
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_API_KEY || ''

// Arlington, VA coordinates
const ARLINGTON_CENTER = {
  lat: 38.8816,
  lng: -77.0910
}

interface MapProps {
  className?: string
  recommendations?: ZoneRecommendation[]  // Story 5.3: Zone markers
  eventData?: EventDataForRecommendations | null  // Story 5.4: Venue marker
  hoveredZoneId?: string | null  // Story 5.7: Highlight support
  onZoneHover?: (zoneId: string) => void  // Story 5.8: Map hover callback
  onZoneLeave?: () => void  // Story 5.8: Map hover callback
  onZoneClick?: (zone: ZoneRecommendation, rank: number) => void  // Zone click callback
  zoomToLocation?: { lat: number; lon: number; zoneId: string } | null  // Zoom to specific location
}

export default function Map({ className = '', recommendations = [], eventData = null, hoveredZoneId = null, onZoneHover, onZoneLeave, onZoneClick, zoomToLocation = null }: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const markersRef = useRef<mapboxgl.Marker[]>([])  // Story 5.3: Track markers for cleanup
  const venueMarkerRef = useRef<mapboxgl.Marker | null>(null)  // Story 5.4: Track venue marker
  const markerElementsRef = useRef(new globalThis.Map<string, HTMLElement>())  // Story 5.7: Track marker elements for highlighting
  const [mapLoaded, setMapLoaded] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  // Story 5.3: Color coding by rank
  const getRankColor = (rank: number): string => {
    if (rank <= 3) return '#10b981'   // Green (top 3)
    if (rank <= 7) return '#f59e0b'   // Yellow/Orange (4-7)
    return '#ef4444'                   // Red/Orange (8-10)
  }

  // Story 5.3: Add zone markers to map
  const addZoneMarkers = (zones: ZoneRecommendation[]) => {
    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove())
    markersRef.current = []
    markerElementsRef.current.clear()  // Story 5.7: Clear marker elements

    // Add new markers for each zone
    zones.forEach((zone, index) => {
      const rank = index + 1
      const color = getRankColor(rank)

      // Create custom HTML marker element
      const el = document.createElement('div')
      el.className = 'zone-marker'
      // Story 5.9: Make marker keyboard-focusable
      el.setAttribute('tabindex', '0')
      el.setAttribute('role', 'button')
      el.setAttribute('aria-label', `Zone ${rank}: ${zone.zone_name}, ${Math.round((zone.audience_match_score / 40) * 100)}% audience match${zone.risk_warning?.is_flagged ? ' - Risk Warning' : ''}`)

      // Story 7.2: Add warning badge if zone is flagged
      const hasWarning = zone.risk_warning?.is_flagged

      el.innerHTML = `
        <div style="position: relative; cursor: pointer;">
          <img
            src="/logo.png"
            alt="OpenPlace marker"
            style="
              width: 48px;
              height: 48px;
              filter: drop-shadow(0 4px 6px rgba(0,0,0,0.4));
              transition: transform 0.2s;
            "
          />
          <div style="
            position: absolute;
            top: 12px;
            left: 50%;
            transform: translateX(-50%);
            width: 22px;
            height: 22px;
            background-color: ${color};
            color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 11px;
            border: 2px solid white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          ">
            ${rank}
          </div>
          ${hasWarning ? `
            <div style="
              position: absolute;
              top: -4px;
              right: -4px;
              width: 16px;
              height: 16px;
              background-color: #f97316;
              border-radius: 50%;
              border: 2px solid white;
              box-shadow: 0 2px 4px rgba(0,0,0,0.3);
              display: flex;
              align-items: center;
              justify-content: center;
            ">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" style="width: 10px; height: 10px; color: white;">
                <path fill-rule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
              </svg>
            </div>
          ` : ''}
        </div>
      `

      // Hover effect
      el.addEventListener('mouseenter', () => {
        const img = el.querySelector('img') as HTMLElement
        if (img) img.style.transform = 'scale(1.15)'
        onZoneHover?.(zone.zone_id)  // Story 5.8: Notify parent on hover
      })
      el.addEventListener('mouseleave', () => {
        const img = el.querySelector('img') as HTMLElement
        if (img) img.style.transform = 'scale(1)'
        onZoneLeave?.()  // Story 5.8: Notify parent on leave
      })

      // Story 5.9: Focus indicator
      el.addEventListener('focus', () => {
        const img = el.querySelector('img') as HTMLElement
        if (img) {
          img.style.outline = '3px solid #3b82f6'
          img.style.outlineOffset = '2px'
          img.style.borderRadius = '50%'
        }
      })

      el.addEventListener('blur', () => {
        const img = el.querySelector('img') as HTMLElement
        if (img) {
          img.style.outline = 'none'
        }
      })

      // Story 5.9: Keyboard activation (Enter/Space)
      el.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onZoneClick?.(zone, rank)
        }
      })

      // Story 5.5: Click handler to open details panel
      el.addEventListener('click', () => {
        onZoneClick?.(zone, rank)
      })

      // Story 5.7: Store marker element for highlighting
      markerElementsRef.current.set(zone.zone_id, el)

      // Create Mapbox marker
      const marker = new mapboxgl.Marker(el)
        .setLngLat([zone.longitude, zone.latitude])
        .addTo(map.current!)

      markersRef.current.push(marker)
    })
  }

  // Story 5.6: Create GeoJSON circle for distance visualization
  const createGeoJSONCircle = (center: [number, number], radiusInMeters: number, points: number = 64) => {
    const coords = {
      latitude: center[1],
      longitude: center[0]
    }

    const km = radiusInMeters / 1000
    const ret = []
    const distanceX = km / (111.320 * Math.cos((coords.latitude * Math.PI) / 180))
    const distanceY = km / 110.574

    for (let i = 0; i < points; i++) {
      const theta = (i / points) * (2 * Math.PI)
      const x = distanceX * Math.cos(theta)
      const y = distanceY * Math.sin(theta)

      ret.push([coords.longitude + x, coords.latitude + y])
    }
    ret.push(ret[0]) // Close the circle

    return {
      type: 'Feature' as const,
      geometry: {
        type: 'Polygon' as const,
        coordinates: [ret]
      },
      properties: {}
    }
  }

  // Story 5.6: Add distance circles to map
  const addDistanceCircles = (venueLat: number, venueLon: number) => {
    if (!map.current) return

    const distances = [
      { km: 1, color: '#9ca3af', opacity: 0.15 },
      { km: 3, color: '#9ca3af', opacity: 0.15 },
      { km: 5, color: '#9ca3af', opacity: 0.15 }
    ]

    distances.forEach(({ km, color, opacity }) => {
      const radiusInMeters = km * 1000
      const circle = createGeoJSONCircle([venueLon, venueLat], radiusInMeters)

      // Add source for circle
      map.current!.addSource(`circle-${km}km`, {
        type: 'geojson',
        data: circle
      })

      // Add fill layer (semi-transparent)
      map.current!.addLayer({
        id: `circle-fill-${km}km`,
        type: 'fill',
        source: `circle-${km}km`,
        paint: {
          'fill-color': color,
          'fill-opacity': opacity
        }
      })

      // Add outline layer (slightly more visible)
      map.current!.addLayer({
        id: `circle-outline-${km}km`,
        type: 'line',
        source: `circle-${km}km`,
        paint: {
          'line-color': color,
          'line-width': 2,
          'line-opacity': 0.4
        }
      })

      // Add label for distance
      map.current!.addLayer({
        id: `circle-label-${km}km`,
        type: 'symbol',
        source: `circle-${km}km`,
        layout: {
          'text-field': `${km}km`,
          'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'],
          'text-size': 12,
          'symbol-placement': 'line',
          'text-rotation-alignment': 'map'
        },
        paint: {
          'text-color': '#6b7280',
          'text-halo-color': '#ffffff',
          'text-halo-width': 2
        }
      })
    })
  }

  // Zoom to specific location when zoomToLocation changes
  useEffect(() => {
    if (!zoomToLocation || !map.current) return

    map.current.flyTo({
      center: [zoomToLocation.lon, zoomToLocation.lat],
      zoom: 16,
      duration: 1500,
      essential: true
    })
  }, [zoomToLocation])

  // Story 5.7: Update marker highlighting when hoveredZoneId changes
  useEffect(() => {
    if (!hoveredZoneId) {
      // Remove all highlights
      markerElementsRef.current.forEach(el => {
        const img = el.querySelector('img') as HTMLElement
        if (img) {
          img.style.transform = 'scale(1)'
          img.style.filter = 'drop-shadow(0 4px 6px rgba(0,0,0,0.4))'
        }
      })
      return
    }

    // Highlight the hovered marker
    const hoveredEl = markerElementsRef.current.get(hoveredZoneId)
    if (hoveredEl) {
      const img = hoveredEl.querySelector('img') as HTMLElement
      if (img) {
        img.style.transform = 'scale(1.3)'
        img.style.filter = 'drop-shadow(0 6px 16px rgba(74, 222, 128, 0.8))'
        img.style.transition = 'all 0.2s ease-out'
      }
    }

    // Remove highlight from other markers
    markerElementsRef.current.forEach((el, zoneId) => {
      if (zoneId !== hoveredZoneId) {
        const img = el.querySelector('img') as HTMLElement
        if (img) {
          img.style.transform = 'scale(1)'
          img.style.filter = 'drop-shadow(0 4px 6px rgba(0,0,0,0.4))'
        }
      }
    })
  }, [hoveredZoneId])

  // Story 5.4: Add venue marker to map
  const addVenueMarker = (event: EventDataForRecommendations) => {
    // Remove existing venue marker if any
    if (venueMarkerRef.current) {
      venueMarkerRef.current.remove()
      venueMarkerRef.current = null
    }

    // Create custom HTML marker element for venue
    const el = document.createElement('div')
    el.className = 'venue-marker'
    // Story 5.9: Make venue marker keyboard-focusable
    el.setAttribute('tabindex', '0')
    el.setAttribute('role', 'button')
    el.setAttribute('aria-label', `Event venue: ${event.name}`)
    el.innerHTML = `
      <div style="
        width: 40px;
        height: 40px;
        background-color: #3b82f6;
        color: white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
        border: 3px solid white;
        box-shadow: 0 3px 6px rgba(0,0,0,0.4);
        cursor: default;
        position: relative;
        z-index: 1000;
      ">
        ⭐
      </div>
    `

    // Create popup with venue/event name
    const popup = new mapboxgl.Popup({
      offset: 25,
      closeButton: false,
      closeOnClick: false
    }).setHTML(`
      <div style="
        padding: 8px 12px;
        font-size: 14px;
        font-weight: 600;
        color: #1f2937;
      ">
        📍 ${event.name}
      </div>
    `)

    // Create Mapbox marker
    const marker = new mapboxgl.Marker({
      element: el,
      anchor: 'center'
    })
      .setLngLat([event.venue_lon, event.venue_lat])
      .setPopup(popup)
      .addTo(map.current!)

    // Story 5.9: Focus indicator for venue marker
    el.addEventListener('focus', () => {
      const innerDiv = el.querySelector('div') as HTMLElement
      if (innerDiv) {
        innerDiv.style.outline = '2px solid #3b82f6'
        innerDiv.style.outlineOffset = '2px'
      }
    })

    el.addEventListener('blur', () => {
      const innerDiv = el.querySelector('div') as HTMLElement
      if (innerDiv) {
        innerDiv.style.outline = 'none'
      }
    })

    // Story 5.9: Keyboard activation for popup
    el.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        marker.togglePopup()
      }
    })

    // Show popup on hover
    el.addEventListener('mouseenter', () => {
      marker.togglePopup()
    })
    el.addEventListener('mouseleave', () => {
      marker.togglePopup()
    })

    venueMarkerRef.current = marker
  }

  useEffect(() => {
    // Check if API key is configured
    if (!MAPBOX_TOKEN) {
      setLoadError('Mapbox API key not configured. Add NEXT_PUBLIC_MAPBOX_API_KEY to .env.local')
      return
    }

    // Prevent reinitializing if map already exists
    if (map.current) return

    // Story 5.1 AC: Configure Mapbox with API key
    mapboxgl.accessToken = MAPBOX_TOKEN

    try {
      // Story 5.1 AC: Render basic map centered on Arlington, VA
      // Story 5.2 AC: Interactive map with rotation support
      map.current = new mapboxgl.Map({
        container: mapContainer.current!,
        style: 'mapbox://styles/mapbox/dark-v11', // Dark theme style
        center: [ARLINGTON_CENTER.lng, ARLINGTON_CENTER.lat],
        zoom: 12, // Zoom level to show most of Arlington
        attributionControl: true,
        // Story 5.2: Rotation configuration
        pitch: 0, // Start with top-down view
        bearing: 0, // Start with north up
        dragRotate: true, // Enable rotation via shift+drag or right-click drag
        touchPitch: true, // Enable pitch on touch devices
        keyboard: true // Enable keyboard shortcuts for navigation
      })

      // Add navigation controls (zoom +/-, compass)
      // Position at bottom-right to avoid blocking sidebar close button
      map.current.addControl(new mapboxgl.NavigationControl(), 'bottom-right')

      // Story 5.1 AC: Map loads within 2 seconds
      const loadStartTime = Date.now()

      map.current.on('load', () => {
        const loadTime = Date.now() - loadStartTime
        console.log(`Map loaded in ${loadTime}ms`)

        if (loadTime > 2000) {
          console.warn(`Map load time (${loadTime}ms) exceeds 2s target`)
        }

        // Story 5.4: Add venue marker after map loads
        // Story 5.6: Add distance circles centered on venue
        if (eventData) {
          addDistanceCircles(eventData.venue_lat, eventData.venue_lon)
          addVenueMarker(eventData)

          // If no recommendations yet, zoom to venue
          if (recommendations.length === 0) {
            map.current?.flyTo({
              center: [eventData.venue_lon, eventData.venue_lat],
              zoom: 15,
              duration: 1500
            })
          }
        }

        // Story 5.3: Add zone markers after map loads
        if (recommendations.length > 0) {
          addZoneMarkers(recommendations)

          // Auto-fit map to show all recommendations + venue
          const bounds = new mapboxgl.LngLatBounds()

          // Add all zone coordinates to bounds
          recommendations.forEach(zone => {
            bounds.extend([zone.longitude, zone.latitude])
          })

          // Add venue to bounds if exists
          if (eventData) {
            bounds.extend([eventData.venue_lon, eventData.venue_lat])
          }

          // Fit map to bounds with padding
          map.current?.fitBounds(bounds, {
            padding: { top: 100, bottom: 100, left: 550, right: 100 }, // Account for left sidebar
            maxZoom: 13.5,
            duration: 1500
          })
        }

        setMapLoaded(true)
      })

      // Story 5.2 AC: Performance tracking for interactions (<200ms requirement)
      map.current.on('movestart', () => {
        const moveStartTime = Date.now()

        map.current?.once('moveend', () => {
          const moveTime = Date.now() - moveStartTime
          console.log(`Map movement took ${moveTime}ms`)

          if (moveTime > 200) {
            console.warn(`Map movement (${moveTime}ms) exceeds 200ms target`)
          }
        })
      })

      map.current.on('zoomstart', () => {
        const zoomStartTime = Date.now()

        map.current?.once('zoomend', () => {
          const zoomTime = Date.now() - zoomStartTime
          console.log(`Map zoom took ${zoomTime}ms`)

          if (zoomTime > 200) {
            console.warn(`Map zoom (${zoomTime}ms) exceeds 200ms target`)
          }
        })
      })

      map.current.on('error', (e) => {
        console.error('Mapbox error:', e)
        setLoadError('Failed to load map. Check your Mapbox API key.')
      })

    } catch (error) {
      console.error('Map initialization error:', error)
      setLoadError('Failed to initialize map')
    }

    // Cleanup on unmount
    return () => {
      // Story 5.3: Remove all markers
      markersRef.current.forEach(marker => marker.remove())
      markersRef.current = []

      // Story 5.4: Remove venue marker
      if (venueMarkerRef.current) {
        venueMarkerRef.current.remove()
        venueMarkerRef.current = null
      }

      // Story 5.6: Remove distance circles
      if (map.current) {
        const circleLayerIds = [
          'circle-fill-1km', 'circle-outline-1km', 'circle-label-1km',
          'circle-fill-3km', 'circle-outline-3km', 'circle-label-3km',
          'circle-fill-5km', 'circle-outline-5km', 'circle-label-5km'
        ]

        circleLayerIds.forEach(layerId => {
          if (map.current?.getLayer(layerId)) {
            map.current.removeLayer(layerId)
          }
        })

        const circleSourceIds = ['circle-1km', 'circle-3km', 'circle-5km']
        circleSourceIds.forEach(sourceId => {
          if (map.current?.getSource(sourceId)) {
            map.current.removeSource(sourceId)
          }
        })
      }

      if (map.current) {
        map.current.remove()
        map.current = null
      }
    }
  }, [recommendations, eventData])  // Story 5.4: Re-render when eventData changes

  if (loadError) {
    return (
      <div className={`flex items-center justify-center rounded-lg ${className}`} style={{ background: '#0a1628' }}>
        <div className="text-center p-8">
          <p className="font-medium mb-2" style={{ color: '#ef4444' }}>Map Error</p>
          <p className="text-sm" style={{ color: '#94a3b8' }}>{loadError}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`} style={{ width: '100%', height: '100%' }}>
      {/* Map container */}
      <div
        ref={mapContainer}
        className="absolute inset-0 overflow-hidden"
        style={{ width: '100%', height: '100%' }}
        tabIndex={0}
        role="region"
        aria-label="Interactive map of Arlington, VA with placement zone recommendations"
      />

      {/* Loading indicator */}
      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(10, 22, 40, 0.95)' }}>
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 mx-auto mb-4" style={{ borderColor: 'rgba(74, 222, 128, 0.2)', borderTopColor: '#4ade80' }}></div>
            <p className="text-sm text-white">Loading map...</p>
          </div>
        </div>
      )}
    </div>
  )
}
