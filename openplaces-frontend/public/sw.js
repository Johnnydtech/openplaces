// Story 5.10: Service Worker for offline Mapbox tile caching
// Ensures map works reliably during demos without internet connection

const CACHE_NAME = 'openplaces-map-tiles-v1'
const TILE_CACHE_DURATION = 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds

// Mapbox tile URL patterns to cache
const TILE_URL_PATTERN = /^https:\/\/api\.mapbox\.com\/.*\/(tiles|sprites|fonts|styles)\/.*/

// Install event - activate immediately
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Installing service worker for map tile caching')
  self.skipWaiting()
})

// Activate event - take control of all clients immediately
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activating service worker')
  event.waitUntil(clients.claim())
})

// Fetch event - intercept Mapbox tile requests and cache them
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Only cache Mapbox tile requests (tiles, sprites, fonts, styles)
  if (!TILE_URL_PATTERN.test(request.url)) {
    return // Let browser handle normally
  }

  // Cache-first strategy with network fallback
  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      // Try to get from cache first
      const cachedResponse = await cache.match(request)

      if (cachedResponse) {
        // Check if cache is still fresh (within TILE_CACHE_DURATION)
        const cacheDate = cachedResponse.headers.get('sw-cache-date')
        if (cacheDate) {
          const age = Date.now() - parseInt(cacheDate, 10)
          if (age < TILE_CACHE_DURATION) {
            console.log('[ServiceWorker] Serving fresh tile from cache:', url.pathname)
            return cachedResponse
          } else {
            console.log('[ServiceWorker] Cache expired for tile:', url.pathname)
          }
        }
      }

      // Fetch from network
      try {
        console.log('[ServiceWorker] Fetching tile from network:', url.pathname)
        const networkResponse = await fetch(request)

        if (networkResponse.ok) {
          // Clone response and add cache timestamp header
          const responseToCache = networkResponse.clone()
          const headers = new Headers(responseToCache.headers)
          headers.set('sw-cache-date', Date.now().toString())

          const cachedResponse = new Response(responseToCache.body, {
            status: responseToCache.status,
            statusText: responseToCache.statusText,
            headers: headers
          })

          // Store in cache for future offline use
          cache.put(request, cachedResponse)
          console.log('[ServiceWorker] Cached tile:', url.pathname)
        }

        return networkResponse
      } catch (error) {
        // Network failed - try to serve stale cache as fallback
        if (cachedResponse) {
          console.log('[ServiceWorker] Network failed, serving stale cache:', url.pathname)
          return cachedResponse
        }

        // No cache and no network - return error response
        console.error('[ServiceWorker] Tile unavailable (no cache, no network):', url.pathname)
        return new Response('Tile unavailable', {
          status: 503,
          statusText: 'Service Unavailable'
        })
      }
    })
  )
})

// Message handler for cache management
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.delete(CACHE_NAME).then(() => {
        console.log('[ServiceWorker] Cache cleared')
        event.ports[0].postMessage({ success: true })
      })
    )
  }

  if (event.data && event.data.type === 'GET_CACHE_SIZE') {
    event.waitUntil(
      caches.open(CACHE_NAME).then(async (cache) => {
        const keys = await cache.keys()
        const size = keys.length
        console.log('[ServiceWorker] Cache size:', size, 'tiles')
        event.ports[0].postMessage({ size })
      })
    )
  }
})
