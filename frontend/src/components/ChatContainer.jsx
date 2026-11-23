import { useCallback, useEffect, useRef, useState } from "react";
import { Image as ImageIcon } from "lucide-react";
import MessageInput from "./MessageInput";
import MessageBubble from "./MessageBubble";
import { isBurstEffect, CelebrationBurst } from "./MessageEffects";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import ChatWallpaperPicker from "./ChatWallpaperPicker";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { socket } from "../lib/socket";
import { useCachedWallpaperUrl } from "../lib/useCachedWallpaperUrl";

// Minimum gap enforced between two runs of the chat-wide celebration
// burst, whether triggered by a new message or a re-tap on the bubble —
// stops a flurry of taps from restarting the animation every few hundred
// ms, which looks stuttery instead of "replaying".
const CELEBRATION_MIN_GAP_MS = 2000;

const ChatContainer = () => {
  const {
    messages,
    getMessages,
    deleteMessage,
    isMessagesLoading,
    isFetchingMore,
    isFetchingNewer,
    hasMore,
    hasMoreNewer,
    scrollToMessageId,
    setReplyTo,
    getNewerMessages,
    clearScrollToMessage,
  } = useChatStore();

  const { role: myRole, wallpaper } = useAuthStore();

  const chatRef = useRef(null);
  const loadingOlderRef = useRef(false);
  const loadingNewerRef = useRef(false);
  const newerSentinelRef = useRef(null);
  const [fullImage, setFullImage] = useState(null);
  const [wallpaperPickerOpen, setWallpaperPickerOpen] = useState(false);
  const [highlightedMessageId, setHighlightedMessageId] = useState(null);

  // ================= CELEBRATION BURST (chat-wide, one-off) =================
  // The bubble's own confetti skin (see MessageBubble/MessageEffects) is
  // permanent for that message. This is the separate few-seconds-and-gone
  // overlay that rains confetti over the whole chat area right after a
  // celebration-effect message shows up — for the sender the moment they
  // send it, and for the other side the moment it arrives over the socket.
  // `key` forces a fresh remount (fresh random confetti + fresh timer) if
  // a second celebration message lands while one is still playing.
  const [celebrationActive, setCelebrationActive] = useState(false);
  const [celebrationRunId, setCelebrationRunId] = useState(0);
  const celebrationSeenRef = useRef(new Set());
  const lastCelebrationAtRef = useRef(0);

  const triggerCelebration = useCallback(() => {
    const now = Date.now();
    if (now - lastCelebrationAtRef.current < CELEBRATION_MIN_GAP_MS) return;
    lastCelebrationAtRef.current = now;
    setCelebrationRunId((id) => id + 1);
    setCelebrationActive(true);
  }, []);

  // Cache/decode is keyed off the SAVED url, not the active-gated one —
  // this runs as soon as a wallpaper is saved (including on page load,
  // restored from the server) rather than waiting for the toggle, so
  // the bytes and the decoded bitmap are already sitting locally by the
  // time the user actually flips it on.
  const cachedWallpaperUrl = useCachedWallpaperUrl(wallpaper?.savedUrl);

  // The only URL that should actually be painted behind the chat right
  // now — null whenever the wallpaper is toggled off, even if one is
  // saved for later.
  const appliedWallpaperUrl = wallpaper?.active ? cachedWallpaperUrl : null;

  useEffect(() => {
    const initChat = async () => {
      await getMessages();
    };
    initChat();
  }, [getMessages]);

  // mark newly loaded messages as seen. Only emit for messages we
  // haven't already marked — otherwise every messages-array update
  // (including the ones caused by the server's own messageStatus
  // reply) re-emits "seen" for the ENTIRE history, which triggers
  // another status broadcast, which replaces the array again, which
  // re-runs this effect... a feedback loop that pins the main thread
  // and made everything (typing, dragging, scrolling) feel laggy.
  const seenIdsRef = useRef(new Set());

  useEffect(() => {
    messages.forEach((m) => {
      if (m.logger !== myRole && !seenIdsRef.current.has(m._id)) {
        seenIdsRef.current.add(m._id);
        socket.emit("messageSeen", m._id);
      }
    });
  }, [messages, myRole]);

  // Fire the chat-wide confetti burst once per celebration message — the
  // moment it first shows up in `messages`, whether that's this device
  // sending it or the other side's message arriving over the socket.
  // Guarded by `celebrationSeenRef` so it never replays on re-renders, and
  // by the createdAt check so scrolling old history back into view (or a
  // fresh page load) doesn't replay bursts for celebrations sent long ago.
  useEffect(() => {
    const now = Date.now();

    messages.forEach((m) => {
      if (celebrationSeenRef.current.has(m._id)) return;
      celebrationSeenRef.current.add(m._id);

      if (!isBurstEffect(m.effect)) return;

      const createdAt = m.createdAt ? new Date(m.createdAt).getTime() : now;
      if (now - createdAt < 8000) {
        triggerCelebration();
      }
    });
  }, [messages, triggerCelebration]);

  // Tapping a celebration bubble replays the same chat-wide burst —
  // bumping the run id remounts CelebrationBurst even if one is already
  // mid-flight, so a re-tap always restarts it with fresh confetti,
  // subject to the same minimum-gap cooldown as above.
  const handleCelebrationReplay = useCallback(() => {
    triggerCelebration();
  }, [triggerCelebration]);

  // no forced auto-scroll — newest messages are already at the top
  // (array is newest-first), so the natural default scroll position
  // (top) already shows the latest messages. No effect needed.

  const sentinelRef = useRef(null);
  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  // Tracks the timestamp of the previous loadOlder() call. If the next
  // one comes in quickly after it, the user is flinging the list fast
  // rather than scrolling gently — in that case we ask for a bigger
  // chunk (burst mode) instead of trickling one small page at a time,
  // which is what caused a fast swipe to feel like it kept stalling.
  const lastLoadAtRef = useRef(0);
  const BURST_THRESHOLD_MS = 600;

  const loadOlder = useCallback(async () => {
    if (loadingOlderRef.current || !hasMore) return;

    const oldestId = messagesRef.current[messagesRef.current.length - 1]?._id;
    if (!oldestId) return;

    const now = Date.now();
    const isBurst = now - lastLoadAtRef.current < BURST_THRESHOLD_MS;
    lastLoadAtRef.current = now;

    loadingOlderRef.current = true;

    // older messages get appended BELOW the current view (at the end
    // of the array), so unlike a "load older at top" pattern, no
    // scroll-position compensation is needed — nothing above the
    // user's current position shifts.
    await getMessages(oldestId, { burst: isBurst });

    loadingOlderRef.current = false;
  }, [getMessages, hasMore]);

  const loadNewer = useCallback(async () => {
    if (loadingNewerRef.current || !hasMoreNewer) return;

    const newestId = messagesRef.current[0]?._id;
    const root = chatRef.current;
    if (!newestId || !root) return;

    loadingNewerRef.current = true;
    const previousHeight = root.scrollHeight;
    const loaded = await getNewerMessages(newestId);

    if (loaded) {
      requestAnimationFrame(() => {
        root.scrollTop += root.scrollHeight - previousHeight;
        loadingNewerRef.current = false;
      });
    } else {
      loadingNewerRef.current = false;
    }
  }, [getNewerMessages, hasMoreNewer]);

  // IntersectionObserver instead of scroll-position math: fires
  // reliably regardless of scroll speed (mobile momentum scrolling
  // can skip past a scrollTop threshold entirely on a single fling),
  // and doesn't recompute scrollHeight/scrollTop on every scroll tick.
  useEffect(() => {
    const sentinel = sentinelRef.current;
    const root = chatRef.current;
    if (!sentinel || !root) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadOlder();
      },
      { root, rootMargin: "0px 0px 400px 0px" } // trigger 400px before it's actually visible — gives a fast swipe enough runway to hit the prefetch queue before the user reaches the bottom
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
    // isMessagesLoading ensures the observer attaches when the real chat
    // UI replaces the initial skeleton.
  }, [hasMore, isMessagesLoading, loadOlder]);

  useEffect(() => {
    const sentinel = newerSentinelRef.current;
    const root = chatRef.current;
    if (!sentinel || !root || !hasMoreNewer) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadNewer();
      },
      { root, rootMargin: "400px 0px 0px 0px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMoreNewer, isMessagesLoading, loadNewer]);

  useEffect(() => {
    if (!scrollToMessageId || !chatRef.current) return;

    const target = Array.from(
      chatRef.current.querySelectorAll("[data-message-id]")
    ).find((element) => element.dataset.messageId === scrollToMessageId);

    if (!target) return;

    target.scrollIntoView({ behavior: "smooth", block: "center" });
    setHighlightedMessageId(scrollToMessageId);
    clearScrollToMessage();
  }, [clearScrollToMessage, messages, scrollToMessageId]);

  useEffect(() => {
    if (!highlightedMessageId) return;
    const timeout = window.setTimeout(
      () => setHighlightedMessageId(null),
      1800
    );
    return () => window.clearTimeout(timeout);
  }, [highlightedMessageId]);

  // Swipe-to-reply now lives entirely inside MessageBubble (it needs
  // a live per-bubble offset while dragging, which has to be local
  // state to avoid re-rendering every other bubble on every touchmove).
  // ChatContainer only needs to know when a swipe actually completed,
  // via this one stable callback — kept with useCallback so the memo
  // comparison on MessageBubble still holds across re-renders.
  const handleSwipeReply = useCallback(
    (message) => setReplyTo(message),
    [setReplyTo]
  );

  const handleImageClick = useCallback((image) => setFullImage(image), []);

  if (isMessagesLoading && messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col">
        <MessageSkeleton />
        <MessageInput />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full relative">
      {celebrationActive && (
        <CelebrationBurst
          key={celebrationRunId}
          onDone={() => setCelebrationActive(false)}
        />
      )}

      {/* Wallpaper control — its own thin strip in the gap above the
          message list (below the navbar), right-aligned. Tapping it
          fans out small round icons to its left instead of opening a
          big dropdown panel or full-screen modal. */}
      <div className="flex items-center justify-end px-2 py-1 border-b border-base-300">
        <div className="relative">
          <ChatWallpaperPicker
            isOpen={wallpaperPickerOpen}
            onClose={() => setWallpaperPickerOpen(false)}
          />
          <button
            onClick={() => setWallpaperPickerOpen((prev) => !prev)}
            className="btn btn-sm btn-circle btn-ghost"
            aria-label="Chat wallpaper"
          >
            <ImageIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div
        ref={chatRef}
        className="relative flex-1 overflow-y-auto p-3 space-y-3"
        style={
          appliedWallpaperUrl
            ? {
                backgroundImage: `url(${appliedWallpaperUrl})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
                // "scroll" (the default) sizes/positions the image
                // against the element's own visible box, not the full
                // scrollable content height — which is what keeps it
                // looking normal instead of stretched. It also stays
                // put in place while messages scroll over it, instead
                // of moving/disappearing with the content ("local"
                // attachment did both of those wrong).
                backgroundAttachment: "scroll",
              }
            : undefined
        }
      >
        {hasMoreNewer && (
          <div ref={newerSentinelRef} className="h-px" />
        )}
        {isFetchingNewer && (
          <div className="flex justify-center py-1">
            <span className="loading loading-spinner loading-sm opacity-60" />
          </div>
        )}

        {messages.map((message) => (
          <MessageBubble
            key={message._id}
            message={message}
            isSelf={message.logger === myRole}
            isSearchTarget={highlightedMessageId === message._id}
            onDelete={deleteMessage}
            onImageClick={handleImageClick}
            onSwipeReply={handleSwipeReply}
            onCelebrationReplay={handleCelebrationReplay}
          />
        ))}

        {/* sentinel: crossing into view (200px early, per rootMargin
            above) triggers loading the next older page */}
        {hasMore && <div ref={sentinelRef} className="h-px" />}
      </div>

      {isFetchingMore && (
        <div className="flex justify-center py-1 bg-base-100">
          <span className="loading loading-spinner loading-sm opacity-60" />
        </div>
      )}

      <MessageInput />

      {fullImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center"
          onClick={() => setFullImage(null)}
        >
          <img
            src={fullImage}
            className="max-w-full max-h-full object-contain"
          />
        </div>
      )}
    </div>
  );
};

export default ChatContainer;
