'use client'

import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { ZoneRecommendation, EventDataForRecommendations } from '@/lib/api'
import ZoneDetailsPanel from './ZoneDetailsPanel'

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
}

export default function Map({ className = '', recommendations = [], eventData = null, hoveredZoneId = null }: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const markersRef = useRef<mapboxgl.Marker[]>([])  // Story 5.3: Track markers for cleanup
  const venueMarkerRef = useRef<mapboxgl.Marker | null>(null)  // Story 5.4: Track venue marker
  const markerElementsRef = useRef<Map<string, HTMLElement>>(new Map())  // Story 5.7: Track marker elements for highlighting
  const [mapLoaded, setMapLoaded] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  // Story 5.5: Track selected zone for details panel
  const [selectedZone, setSelectedZone] = useState<{ zone: ZoneRecommendation; rank: number } | null>(null)

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
      el.innerHTML = `
        <div style="
          width: 36px;
          height: 36px;
          background-color: ${color};
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 14px;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          cursor: pointer;
          transition: transform 0.2s;
        ">
          ${rank}
        </div>
      `

      // Hover effect
      el.addEventListener('mouseenter', () => {
        const innerDiv = el.querySelector('div') as HTMLElement
        if (innerDiv) innerDiv.style.transform = 'scale(1.1)'
      })
      el.addEventListener('mouseleave', () => {
        const innerDiv = el.querySelector('div') as HTMLElement
        if (innerDiv) innerDiv.style.transform = 'scale(1)'
      })

      // Story 5.5: Click handler to open details panel
      el.addEventListener('click', () => {
        setSelectedZone({ zone, rank })
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

  // Story 5.7: Update marker highlighting when hoveredZoneId changes
  useEffect(() => {
    if (!hoveredZoneId) {
      // Remove all highlights
      markerElementsRef.current.forEach(el => {
        const innerDiv = el.querySelector('div') as HTMLElement
        if (innerDiv) {
          innerDiv.style.transform = 'scale(1)'
          innerDiv.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)'
        }
      })
      return
    }

    // Highlight the hovered marker
    const hoveredEl = markerElementsRef.current.get(hoveredZoneId)
    if (hoveredEl) {
      const innerDiv = hoveredEl.querySelector('div') as HTMLElement
      if (innerDiv) {
        innerDiv.style.transform = 'scale(1.5)'
        innerDiv.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.6)'
        innerDiv.style.transition = 'all 0.1s ease-out'
      }
    }

    // Remove highlight from other markers
    markerElementsRef.current.forEach((el, zoneId) => {
      if (zoneId !== hoveredZoneId) {
        const innerDiv = el.querySelector('div') as HTMLElement
        if (innerDiv) {
          innerDiv.style.transform = 'scale(1)'
          innerDiv.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)'
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
        style: 'mapbox://styles/mapbox/streets-v12', // Mapbox Streets style
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
      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right')

      // Story 5.1 AC: Map loads within 2 seconds
      const loadStartTime = Date.now()

      map.current.on('load', () => {
        const loadTime = Date.now() - loadStartTime
        console.log(`Map loaded in ${loadTime}ms`)

        if (loadTime > 2000) {
          console.warn(`Map load time (${loadTime}ms) exceeds 2s target`)
        }

        // Story 5.3: Add zone markers after map loads
        if (recommendations.length > 0) {
          addZoneMarkers(recommendations)
        }

        // Story 5.4: Add venue marker after map loads
        // Story 5.6: Add distance circles centered on venue
        if (eventData) {
          addDistanceCircles(eventData.venue_lat, eventData.venue_lon)
          addVenueMarker(eventData)
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
      <div className={`flex items-center justify-center bg-gray-100 rounded-lg ${className}`}>
        <div className="text-center p-8">
          <p className="text-red-600 font-medium mb-2">Map Error</p>
          <p className="text-sm text-gray-600">{loadError}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      {/* Map container */}
      <div
        ref={mapContainer}
        className="absolute inset-0 rounded-lg overflow-hidden"
      />

      {/* Loading indicator */}
      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-75">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
            <p className="text-sm text-gray-600">Loading map...</p>
          </div>
        </div>
      )}

      {/* Story 5.5: Zone details panel */}
      {selectedZone && (
        <ZoneDetailsPanel
          zone={selectedZone.zone}
          rank={selectedZone.rank}
          onClose={() => setSelectedZone(null)}
        />
      )}
    </div>
  )
}
