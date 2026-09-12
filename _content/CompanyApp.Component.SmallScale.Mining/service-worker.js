const MAP_CACHE = 'mining-maps-v1';
const TILE_PATTERN = /openstreetmap\.org\/tiles/;

self.addEventListener('fetch', event => {
  if (TILE_PATTERN.test(event.request.url)) {
    event.respondWith(
      caches.open(MAP_CACHE).then(cache =>
        cache.match(event.request).then(resp =>
          resp || fetch(event.request).then(networkResp => {
            cache.put(event.request, networkResp.clone());
            return networkResp;
          })
        )
      )
    );
  }
});
