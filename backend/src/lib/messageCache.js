import Message from "../models/message.model.js";

/**
 * Keeps the most recent messages warm in memory so that the common
 * case — opening the chat, scrolling back a page or two — never has
 * to make a MongoDB round trip. Only requests for history older than
 * what's cached fall through to the database.
 *
 * Ordered newest-first (index 0 = newest), matching how the frontend
 * consumes it. Kept small enough (MAX_SIZE) that memory use stays
 * trivial for a two-person chat.
 */

const MAX_SIZE = 300;

let cache = null; // null until first populated
let loadingPromise = null;

async function ensureCache() {
  if (cache) return cache;
  if (loadingPromise) return loadingPromise;

  loadingPromise = Message.find({})
    .sort({ _id: -1 })
    .limit(MAX_SIZE)
    .select("-__v")
    .lean()
    .then((docs) => {
      cache = docs;
      loadingPromise = null;
      return cache;
    })
    .catch((err) => {
      loadingPromise = null;
      throw err;
    });

  return loadingPromise;
}

/**
 * Returns { messages, hasMore, servedFromCache } for a page request.
 * - No cursor: most recent `limit` messages.
 * - With cursor: the `limit` messages older than cursor, IF cursor is
 *   found within the cached window. Returns null if a DB query is
 *   needed instead (cursor points past what's cached).
 */
async function getPage({ cursor, limit }) {
  const list = await ensureCache();

  if (!cursor) {
    const slice = list.slice(0, limit);
    // if the cache itself was truncated at MAX_SIZE, there may be
    // more we haven't loaded — be conservative about hasMore
    const hasMore = list.length > limit || list.length === MAX_SIZE;
    return { messages: slice, hasMore, servedFromCache: true };
  }

  const idx = list.findIndex((m) => String(m._id) === String(cursor));
  if (idx === -1) {
    // cursor is older than anything we've cached — let the caller
    // fall back to a direct DB query
    return null;
  }

  const slice = list.slice(idx + 1, idx + 1 + limit);
  const reachedEndOfCache = idx + 1 + limit >= list.length;
  const hasMore = !reachedEndOfCache || list.length === MAX_SIZE;

  return { messages: slice, hasMore, servedFromCache: true };
}

/** Call after a new message is saved so the cache stays current. */
function onMessageCreated(message) {
  if (!cache) return; // will be picked up on next ensureCache()
  cache.unshift(message);
  if (cache.length > MAX_SIZE) cache.length = MAX_SIZE;
}

/** Call after a message is deleted so the cache stays current. */
function onMessageDeleted(id) {
  if (!cache) return;
  cache = cache.filter((m) => String(m._id) !== String(id));
}

/** Drops the cache entirely; next request repopulates it from DB. */
function invalidate() {
  cache = null;
}

export const messageCache = {
  getPage,
  onMessageCreated,
  onMessageDeleted,
  invalidate,
};
