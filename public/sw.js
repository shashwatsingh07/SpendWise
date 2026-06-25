/* SpendWise service worker — lightweight, dependency-free.
   Strategy:
   - Navigations: network-first, fall back to cached app shell when offline (SPA routing safe).
   - Same-origin GET assets: stale-while-revalidate.
   - Everything else (cross-origin, the Anthropic API, non-GET): passed straight to the network. */
const CACHE = 'spendwise-v1'
const SHELL = '/index.html'

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(['/', SHELL])).then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  // Only handle our own origin; let fonts, the Claude API, etc. go straight through.
  if (url.origin !== self.location.origin) return

  // SPA navigations: try network, fall back to the cached shell so deep links work offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match(SHELL).then((r) => r || caches.match('/')))
    )
    return
  }

  // Static assets: serve cache fast, refresh in the background.
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((res) => {
          if (res && res.status === 200 && res.type === 'basic') {
            const copy = res.clone()
            caches.open(CACHE).then((c) => c.put(request, copy))
          }
          return res
        })
        .catch(() => cached)
      return cached || network
    })
  )
})
