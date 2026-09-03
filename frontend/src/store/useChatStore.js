import { create } from "zustand";
import { toast } from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { socket } from "../lib/socket";
import { useAuthStore } from "./useAuthStore";
import { messageIdbCache } from "../lib/messageIdbCache";

const INITIAL_PAGE_SIZE = 25; // first load — bigger so the chat feels populated
const PAGE_SIZE = 20; // normal scroll-up loads
const BURST_PAGE_SIZE = 50; // used when the user is swiping fast (see isBurst below)

// Minimum time a loading indicator stays on screen. Fetches are now
// often served from the in-memory backend cache or from a page we
// already prefetched, so they can resolve in a handful of milliseconds
// — faster than a browser paint. Without a floor here, isFetchingMore
// flips true then false again before React ever gets a frame to draw
// the spinner, so it looks like "it loads but there's no spinner".
const MIN_SPINNER_MS = 300;

// How many pages we try to keep pre-fetched and ready ahead of the
// user's current scroll position. Depth 1 only ever has the *next*
// page ready; depth 2 means that even a fast double-swipe still finds
// both pages waiting locally instead of hitting the network on the
// second one.
const PREFETCH_DEPTH = 2;

async function withMinDuration(promise, minMs) {
  const start = Date.now();
  try {
    return await promise;
  } finally {
    const elapsed = Date.now() - start;
    const remaining = minMs - elapsed;
    if (remaining > 0) await new Promise((r) => setTimeout(r, remaining));
  }
}

export const useChatStore = create((set, get) => ({
  messages: [],
  isMessagesLoading: false,
  isFetchingMore: false,
  hasMore: true,

  // queue of pages fetched ahead of time in the background, in order,
  // each keyed by the cursor (oldest loaded message id) it was fetched
  // for. When the user actually scrolls that far, we apply from here
  // instantly instead of waiting on a live network round trip.
  prefetchQueue: [], // Array<{ cursor, messages, hasMore }>

  // timestamp of the last time we actually kicked off an older-page
  // load (network, cache, or queue) — used by the UI to detect a fast
  // swipe (several loadOlder calls in quick succession) so we can pull
  // a bigger chunk instead of trickling one small page at a time.
  _lastOlderLoadAt: 0,

  // reply feature
  replyTo: null,
  setReplyTo: (message) => set({ replyTo: message }),
  clearReplyTo: () => set({ replyTo: null }),

  // low-level fetch only — no loading flags, no state writes.
  // Shared by both the real load and the background prefetch.
  _fetchPage: async (cursor, limit) => {
    const res = await axiosInstance.get("/messages", {
      params: { limit, ...(cursor ? { cursor } : {}) },
    });
    return res.data; // { messages, hasMore }
  },

  // Keeps prefetchQueue topped up to PREFETCH_DEPTH pages ahead of
  // wherever the queue currently ends (or, if empty, ahead of the
  // messages currently on screen). Chains itself until the pipe is
  // full or there's nothing older left — this is the "background,
  // one-by-one" fetch the user asked for: it runs quietly regardless
  // of whether the user is scrolling, so by the time they get there
  // it's usually already local.
  _schedulePrefetch: () => {
    const { hasMore, prefetchQueue, messages, _fetchPage } = get();
    if (!hasMore) return;
    if (prefetchQueue.length >= PREFETCH_DEPTH) return;

    const tail = prefetchQueue[prefetchQueue.length - 1];
    if (tail && !tail.hasMore) return; // previous prefetched page said there's nothing further

    const baseCursor = tail
      ? tail.messages[tail.messages.length - 1]?._id
      : messages[messages.length - 1]?._id;

    if (!baseCursor) return;

    _fetchPage(baseCursor, PAGE_SIZE)
      .then((data) => {
        if (!data) return;
        set((state) => {
          // guard against duplicate scheduling landing twice
          if (state.prefetchQueue.some((p) => p.cursor === baseCursor)) {
            return state;
          }
          return {
            prefetchQueue: [
              ...state.prefetchQueue,
              { cursor: baseCursor, messages: data.messages, hasMore: data.hasMore },
            ],
          };
        });
        // keep chaining until the pipe is full or history runs out
        get()._schedulePrefetch();
      })
      .catch(() => {
        /* silent — the real load path will just fetch normally if needed */
      });
  },

  // shared apply logic — keeps merge/reverse behavior identical
  // whether the source is network, IndexedDB, or the prefetch queue
  _applyPage: (cursor, data) => {
    const { messages: fetched = [], hasMore: more = false } = data || {};
    set((state) => {
      if (!cursor) {
        return { messages: [...fetched].reverse(), hasMore: more };
      }
      const existingIds = new Set(state.messages.map((m) => m._id));
      const older = [...fetched]
        .filter((m) => !existingIds.has(m._id))
        .reverse();
      return {
        messages: [...state.messages, ...older],
        hasMore: more,
      };
    });
  },

  // ---------------- GET MESSAGES ----------------
  // cursor omitted -> first page (most recent messages, INITIAL_PAGE_SIZE)
  // cursor provided -> next older page(s), appended after the current
  //                    oldest message
  // opts.burst: true when the caller detected the user is swiping fast
  //             — pulls a bigger chunk (draining multiple queued
  //             prefetch pages at once, or a single larger network
  //             fetch) so a quick fling doesn't stall waiting on
  //             several small round trips back to back.
  // Note: messages are stored newest-first (index 0 = newest), so
  // "older" pages get appended to the END of the array, not the start.
  getMessages: async (cursor, opts = {}) => {
    const { burst = false } = opts;
    const { isFetchingMore, hasMore, isMessagesLoading, prefetchQueue } = get();

    // guard: don't fire overlapping requests, and stop once we know
    // there's nothing older left to load
    if (cursor && (isFetchingMore || !hasMore)) return;
    if (isMessagesLoading) return;

    set({ _lastOlderLoadAt: Date.now() });

    // instant path: one or more of the next pages were already
    // fetched ahead of time and are sitting in the queue
    if (cursor && prefetchQueue[0]?.cursor === cursor) {
      // on a fast swipe, drain the whole queue (up to PREFETCH_DEPTH
      // pages) in one go instead of applying just the first page
      const take = burst ? prefetchQueue.length : 1;
      const pages = prefetchQueue.slice(0, take);
      const rest = prefetchQueue.slice(take);

      set((state) => {
        const existingIds = new Set(state.messages.map((m) => m._id));
        let appended = [];
        let finalHasMore = state.hasMore;

        for (const page of pages) {
          const older = page.messages
            .filter((m) => !existingIds.has(m._id))
            .reverse();
          older.forEach((m) => existingIds.add(m._id));
          appended = [...appended, ...older];
          finalHasMore = page.hasMore;
        }

        return {
          messages: [...state.messages, ...appended],
          hasMore: finalHasMore,
          prefetchQueue: rest,
        };
      });

      get()._schedulePrefetch(); // keep the pipe topped up
      return;
    }

    // instant local path: render from IndexedDB immediately if this
    // page was fetched in a previous visit — actual "WhatsApp-style"
    // instant history, not just a faster network call.
    const cachedPage = await messageIdbCache.get(cursor);
    if (cachedPage) {
      get()._applyPage(cursor, cachedPage);
    }

    // only show a loading state if we had nothing local to show — the
    // network call below still runs regardless, to reconcile. When we
    // do show it, hold it for at least MIN_SPINNER_MS so a very fast
    // response doesn't flash it on and off invisibly.
    const willShowSpinner = !cachedPage;
    if (willShowSpinner) {
      set(cursor ? { isFetchingMore: true } : { isMessagesLoading: true });
    }

    try {
      const limit = cursor
        ? (burst ? BURST_PAGE_SIZE : PAGE_SIZE)
        : INITIAL_PAGE_SIZE;

      const fetchPromise = get()._fetchPage(cursor, limit);
      const data = willShowSpinner
        ? await withMinDuration(fetchPromise, MIN_SPINNER_MS)
        : await fetchPromise;

      get()._applyPage(cursor, data);
      messageIdbCache.set(cursor, data); // persist for next time

      get()._schedulePrefetch();
    } catch (error) {
      // if we already rendered a cached page, fail silently — the
      // user has data on screen, no need to interrupt them just
      // because the background reconcile failed
      if (!cachedPage) {
        toast.error(error?.response?.data?.message || "Failed to load messages");
      }
    } finally {
      if (willShowSpinner) {
        set(cursor ? { isFetchingMore: false } : { isMessagesLoading: false });
      }
    }
  },

  // ---------------- SEND MESSAGE ----------------
  sendMessage: async (data) => {
    try {
      const { role } = useAuthStore.getState();

      const messageWithLogger = {
        ...data,
        logger: role || null,
      };

      await axiosInstance.post("/messages/send", messageWithLogger);

      set({ replyTo: null });

    } catch {
      toast.error("Failed to send message");
    }
  },

  // ---------------- DELETE MESSAGE ----------------
  deleteMessage: async (id) => {
    try {
      await axiosInstance.delete(`/messages/${id}`);

      set((state) => ({
        messages: state.messages.filter((m) => m._id !== id),
      }));

    } catch {
      toast.error("Failed to delete message");
    }
  },

  // ---------------- INIT SOCKET ----------------
  initSocket: () => {
    socket.off("newMessage");
    socket.off("deleteMessage");
    socket.off("messageStatus");
    socket.off("onlineUsers");

    const { role } = useAuthStore.getState();

    if (role) {
      socket.emit("join", role);
    }

    socket.on("newMessage", (message) => {
      set((state) => {
        socket.emit("messageDelivered", message._id);

        if (state.messages.some((m) => m._id === message._id)) return state;

        return { messages: [message, ...state.messages] };
      });
    });

    socket.on("messageStatus", ({ id, status }) => {
      set((state) => ({
        messages: state.messages.map((m) =>
          m._id === id ? { ...m, status } : m
        ),
      }));
    });

    socket.on("deleteMessage", (id) => {
      set((state) => ({
        messages: state.messages.filter((m) => m._id !== id),
      }));
    });

    socket.on("onlineUsers", (users) => {
      set({ onlineUsers: users });
    });

    // ✅ proper cleanup function
    return () => {
      socket.off("newMessage");
      socket.off("deleteMessage");
      socket.off("messageStatus");
      socket.off("onlineUsers");
    };
  },
}));
