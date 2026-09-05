// Local, on-device cache for chat wallpaper images, using IndexedDB.
//
// A gallery-picked wallpaper is just a URL pointing at the server. Left
// alone, the browser may re-fetch (or at least re-validate) those bytes
// every time the wallpaper is toggled back on. This module fetches the
// image ONCE, stores the raw bytes (a Blob — actual binary, not a
// base64 string) in IndexedDB, and hands back a local object URL on
// every future request. Toggling after that never touches the network.
//
// Mirrors the pattern already used in messageIdbCache.js.

const DB_NAME = "toffe-wallpaper";
const DB_VERSION = 1;
const STORE = "images";

let dbPromise = null;

function openDb() {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB not available"));
      return;
    }

    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE); // keyed manually (by URL), no keyPath
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

  return dbPromise;
}

// Returns the cached Blob for this URL, or null on a cache miss / any
// error (indexedDB unavailable, private browsing, etc). Callers should
// treat null as "go fetch it" rather than an actual failure.
async function get(url) {
  try {
    const db = await openDb();
    return await new Promise((resolve) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).get(url);
      req.onsuccess = () => resolve(req.result?.blob || null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

// Best-effort write — a failed cache write shouldn't break wallpaper
// rendering, it just means next time falls back to a network fetch.
async function set(url, blob) {
  try {
    const db = await openDb();
    await new Promise((resolve) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put({ blob, cachedAt: Date.now() }, url);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {
    // ignore — degrade gracefully
  }
}

async function clear() {
  try {
    const db = await openDb();
    await new Promise((resolve) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {
    // ignore
  }
}

export const wallpaperIdbCache = { get, set, clear };
