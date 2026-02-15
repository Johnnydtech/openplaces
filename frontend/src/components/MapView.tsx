/**
 * Story 5.1: Integrate Mapbox GL JS Library
 * Story 5.2: Display Interactive Arlington-Centered Map
 * Story 5.3: Display Placement Zone Markers with Rank Badges
 * Story 5.4: Display Event Venue Marker with Differentiated Style
 * Story 5.5: Click Zone Marker to View Details Panel
 * Story 5.6: Display Distance Circles Centered on Venue
 * Story 5.7: Hover List Item to Highlight Map Zone
 * Story 5.8: Hover Map Zone to Highlight List Item
 * Story 5.9: Keyboard Navigation for Map Controls
 *
 * Interactive Mapbox GL map component for visualizing placement zones
 */

import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { ZoneRecommendation } from '../api/recommendations'
import './MapView.css'

// Story 5.2 AC: Arlington, VA center coordinates
const ARLINGTON_CENTER = {
  lat: 38.8816,
  lon: -77.0910
}

const DEFAULT_ZOOM = 12

interface MapViewProps {
  recommendations: ZoneRecommendation[]
  venueCoordinates: { lat: number; lon: number } | null
  highlightedZoneId?: string | null
  onZoneClick?: (zoneId: string) => void
  onZoneHover?: (zoneId: string | null) => void
  isAuthenticated: boolean
}

export default function MapView({
  recommendations,
  venueCoordinates,
  highlightedZoneId = null,
  onZoneClick,
  onZoneHover,
  isAuthenticated
}: MapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const markersRef = useRef<Map<string, mapboxgl.Marker>>(new Map())
  const venueMarkerRef = useRef<mapboxgl.Marker | null>(null)
  const [isMapLoaded, setIsMapLoaded] = useState(false)
  const [mapError, setMapError] = useState<string | null>(null)

  // Story 5.1 AC: Initialize Mapbox with API key
  useEffect(() => {
    const apiKey = import.meta.env.VITE_MAPBOX_API_KEY

    if (!apiKey) {
      setMapError('Mapbox API key not configured')
      return
    }

    mapboxgl.accessToken = apiKey

    if (!mapContainerRef.current) return

    // Story 5.2 AC: Create map centered on Arlington, VA
    try {
      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [ARLINGTON_CENTER.lon, ARLINGTON_CENTER.lat],
        zoom: DEFAULT_ZOOM,
        // Story 5.2 AC: Interactive controls
        dragPan: true,
        scrollZoom: true,
        boxZoom: true,
        dragRotate: true, // Shift+drag to rotate
        keyboard: true, // Story 5.9: Keyboard navigation
        doubleClickZoom: true,
        touchZoomRotate: true
      })

      // Story 5.2 AC: Add zoom and navigation controls
      map.addControl(new mapboxgl.NavigationControl(), 'top-right')
      map.addControl(new mapboxgl.FullscreenControl(), 'top-right')

      map.on('load', () => {
        setIsMapLoaded(true)
        setMapError(null)
      })

      map.on('error', (e) => {
        console.error('Mapbox error:', e)
        setMapError('Failed to load map')
      })

      mapRef.current = map

      return () => {
        map.remove()
        mapRef.current = null
      }
    } catch (error) {
      console.error('Error initializing map:', error)
      setMapError('Failed to initialize map')
    }
  }, [])

  // Story 5.4 AC: Display Event Venue Marker
  useEffect(() => {
    if (!mapRef.current || !isMapLoaded || !venueCoordinates) return

    // Remove existing venue marker
    if (venueMarkerRef.current) {
      venueMarkerRef.current.remove()
    }

    // Create venue marker element (blue star icon)
    const venueEl = document.createElement('div')
    venueEl.className = 'venue-marker'
    venueEl.innerHTML = '★'
    venueEl.setAttribute('role', 'button')
    venueEl.setAttribute('aria-label', 'Event venue location')

    // Create venue marker
    const venueMarker = new mapboxgl.Marker({
      element: venueEl,
      anchor: 'bottom'
    })
      .setLngLat([venueCoordinates.lon, venueCoordinates.lat])
      .setPopup(
        new mapboxgl.Popup({ offset: 25 })
          .setHTML('<strong>Your Event Venue</strong>')
      )
      .addTo(mapRef.current)

    venueMarkerRef.current = venueMarker
  }, [isMapLoaded, venueCoordinates])

  // Story 5.3 AC: Display Placement Zone Markers with Rank Badges
  useEffect(() => {
    if (!mapRef.current || !isMapLoaded) return

    // Clear existing zone markers
    markersRef.current.forEach(marker => marker.remove())
    markersRef.current.clear()

    // Story 5.3 AC: Top 10 for authenticated, top 3 for anonymous
    const displayLimit = isAuthenticated ? 10 : 3
    const displayedZones = recommendations.slice(0, displayLimit)

    displayedZones.forEach((zone) => {
      // Story 5.3 AC: Create marker element with rank badge
      const markerEl = document.createElement('div')
      markerEl.className = `zone-marker ${getRankClass(zone.rank)} ${zone.risk_warning ? 'has-warning' : ''}`
      markerEl.innerHTML = `
        <span class="rank-number">#${zone.rank}</span>
        ${zone.risk_warning ? '<span class="marker-warning-badge">⚠️</span>' : ''}
      `
      markerEl.setAttribute('role', 'button')
      markerEl.setAttribute('aria-label', `Zone ${zone.zone_name}, rank ${zone.rank}${zone.risk_warning ? ' - has risk warning' : ''}`)
      markerEl.setAttribute('tabindex', '0')

      // Story 5.5 AC: Click marker to view details
      markerEl.addEventListener('click', (e) => {
        e.stopPropagation()
        onZoneClick?.(zone.zone_id)
      })

      // Story 5.9 AC: Keyboard navigation
      markerEl.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onZoneClick?.(zone.zone_id)
        }
      })

      // Story 5.8 AC: Hover marker to highlight list item
      markerEl.addEventListener('mouseenter', () => {
        onZoneHover?.(zone.zone_id)
      })

      markerEl.addEventListener('mouseleave', () => {
        onZoneHover?.(null)
      })

      // Create marker
      const marker = new mapboxgl.Marker({
        element: markerEl,
        anchor: 'center'
      })
        .setLngLat([zone.longitude, zone.latitude])
        .addTo(mapRef.current!)

      markersRef.current.set(zone.zone_id, marker)
    })
  }, [isMapLoaded, recommendations, isAuthenticated, onZoneClick, onZoneHover])

  // Story 5.7 AC: Highlight map marker when list item is hovered
  useEffect(() => {
    markersRef.current.forEach((marker, zoneId) => {
      const markerEl = marker.getElement()
      if (highlightedZoneId === zoneId) {
        markerEl.classList.add('highlighted')
      } else {
        markerEl.classList.remove('highlighted')
      }
    })
  }, [highlightedZoneId])

  // Story 5.6 AC: Display distance circles centered on venue
  useEffect(() => {
    if (!mapRef.current || !isMapLoaded || !venueCoordinates) return

    const map = mapRef.current

    // Wait for map style to load before adding sources
    if (!map.isStyleLoaded()) {
      map.once('styledata', () => addDistanceCircles(map, venueCoordinates))
    } else {
      addDistanceCircles(map, venueCoordinates)
    }
  }, [isMapLoaded, venueCoordinates])

  // Story 5.3 AC: Helper to get rank badge color class
  const getRankClass = (rank: number): string => {
    if (rank <= 3) return 'rank-top'     // Green (top 3)
    if (rank <= 7) return 'rank-middle'  // Yellow (4-7)
    return 'rank-lower'                   // Orange (8-10)
  }

  // Story 5.6 AC: Add distance circles (1km, 3km, 5km)
  const addDistanceCircles = (map: mapboxgl.Map, center: { lat: number; lon: number }) => {
    const circles = [
      { radius: 1, id: 'circle-1km' },
      { radius: 3, id: 'circle-3km' },
      { radius: 5, id: 'circle-5km' }
    ]

    circles.forEach(({ radius, id }) => {
      // Remove existing layer if present
      if (map.getLayer(id)) {
        map.removeLayer(id)
      }
      if (map.getSource(id)) {
        map.removeSource(id)
      }

      // Create circle GeoJSON
      const circleGeoJSON = createCircle(center, radius)

      map.addSource(id, {
        type: 'geojson',
        data: circleGeoJSON
      })

      map.addLayer({
        id: id,
        type: 'line',
        source: id,
        paint: {
          'line-color': '#9ca3af',
          'line-width': 2,
          'line-opacity': 0.5,
          'line-dasharray': [2, 2]
        }
      })
    })
  }

  // Helper to create circle GeoJSON (approximate km to degrees)
  const createCircle = (center: { lat: number; lon: number }, radiusKm: number) => {
    const points = 64
    const coords = []
    const distanceX = radiusKm / (111.320 * Math.cos((center.lat * Math.PI) / 180))
    const distanceY = radiusKm / 110.574

    for (let i = 0; i < points; i++) {
      const theta = (i / points) * (2 * Math.PI)
      const x = distanceX * Math.cos(theta)
      const y = distanceY * Math.sin(theta)
      coords.push([center.lon + x, center.lat + y])
    }
    coords.push(coords[0]) // Close the circle

    return {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: coords
      }
    }
  }

  // Story 5.1 AC: Error state if Mapbox fails
  if (mapError) {
    return (
      <div className="map-container map-error">
        <div className="error-content">
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p>{mapError}</p>
          <p className="error-hint">Check your Mapbox API key configuration</p>
        </div>
      </div>
    )
  }

  return (
    <div className="map-container">
      <div ref={mapContainerRef} className="map" />
      {!isMapLoaded && (
        <div className="map-loading">
          <div className="loading-spinner"></div>
          <p>Loading map...</p>
        </div>
      )}
    </div>
  )
}
