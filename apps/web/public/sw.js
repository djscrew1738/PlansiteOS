const CACHE_NAME = 'pipelineos-v1';
const OFFLINE_URLS = ['/', '/index.html', '/offline.html'];

/**
 * Minimal IndexedDB helper (no deps).
 * Stores: pending-uploads { id, url, method, headers, bodyBase64, createdAt }
 */
function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('pipelineos-db', 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('pending-uploads')) {
        db.createObjectStore('pending-uploads', { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function dbGetAll(storeName) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

async function dbDelete(storeName, id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    tx.objectStore(storeName).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// Cache on install
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(OFFLINE_URLS)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Network-first, fallback to cache
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Skip non-GET and API calls (we handle uploads separately client-side)
  if (request.method !== 'GET' || request.url.includes('/api/')) return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        // Cache only successful, basic responses
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          try {
            cache.put(request, clone);
          } catch (_) {
            // ignore cache failures (opaque responses etc.)
          }
        });
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(request);
        return cached || caches.match('/offline.html');
      })
  );
});

// Background sync retry
self.addEventListener('sync', (event) => {
  if (event.tag === 'blueprint-upload') {
    event.waitUntil(retryFailedUploads());
  }
});

async function retryFailedUploads() {
  const pending = await dbGetAll('pending-uploads');

  for (const item of pending) {
    try {
      const headers = item.headers || {};
      const body = item.bodyBase64 ? base64ToArrayBuffer(item.bodyBase64) : undefined;

      const res = await fetch(item.url, {
        method: item.method || 'POST',
        headers,
        body
      });

      if (res.ok) {
        await dbDelete('pending-uploads', item.id);
        // Notify clients of successful upload
        self.clients.matchAll().then(clients => {
          clients.forEach(client => {
            client.postMessage({
              type: 'UPLOAD_SUCCESS',
              uploadId: item.id
            });
          });
        });
      }
    } catch (e) {
      // keep it queued
      console.log('Retry failed; will try later', e);
    }
  }
}

function base64ToArrayBuffer(base64) {
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}
