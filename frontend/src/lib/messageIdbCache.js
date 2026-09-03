// Local, on-device cache for message pages using IndexedDB.
//
// This is the actual mechanism behind apps like WhatsApp feeling instant
// when you scroll into old messages: they aren't re-fetched over the
// network at all — they're already stored on the device from a previous
// sync. This module gives the same behavior in the browser: once a page
// of messages has been fetched, it's saved here and any future request
// for that same page (same session, or a fresh page reload days later)
// resolves instantly from disk, with a network refresh happening quietly
// in the background to keep things eventually consistent.
//
// Usage pattern (stale-while-revalidate):
//   const cachedPage = await messageIdbCache.get(cacheKey);
//   if (cachedPage) render(cachedPage); // instant
//   const freshPage = await fetchFromServer();
//   render(freshPage); // reconcile
//   messageIdbCache.set(cacheKey, freshPage);

const DB_NAME = "toffe-messages";
const DB_VERSION = 1;
const STORE = "pages";

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
        db.createObjectStore(STORE); // keyed manually, no keyPath
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

  return dbPromise;
}

// cacheKey convention: "initial" for the first/most-recent page,
// or the cursor id string for a subsequent older page.
function keyFor(cursor) {
  return cursor ? `page:${cursor}` : "page:initial";
}

async function get(cursor) {
  try {
    const db = await openDb();
    return await new Promise((resolve) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).get(keyFor(cursor));
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null); // cache miss on any error — just fall through to network
    });
  } catch {
    return null; // IndexedDB unavailable (e.g. private browsing) — degrade gracefully
  }
}

async function set(cursor, data) {
  try {
    const db = await openDb();
    await new Promise((resolve) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put(
        { ...data, cachedAt: Date.now() },
        keyFor(cursor)
      );
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve(); // best-effort — a failed write shouldn't break the app
    });
  } catch {
    // silently ignore — local cache is an optimization, not a requirement
  }
}

/** Wipe the whole local cache — call on logout or if data ever looks stale/corrupt. */
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

export const messageIdbCache = { get, set, clear };
