import { useCallback, useEffect, useRef, useState } from "react";
import MessageInput from "./MessageInput";
import MessageBubble from "./MessageBubble";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { socket } from "../lib/socket";

const ChatContainer = () => {
  const {
    messages,
    getMessages,
    deleteMessage,
    isMessagesLoading,
    isFetchingMore,
    hasMore,
    setReplyTo,
  } = useChatStore();

  const { role: myRole } = useAuthStore();

  const chatRef = useRef(null);
  const loadingOlderRef = useRef(false);
  const [fullImage, setFullImage] = useState(null);

  useEffect(() => {
    const initChat = async () => {
      await getMessages();
    };
    initChat();
  }, []);

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

  const loadOlder = async () => {
    if (loadingOlderRef.current || isFetchingMore || !hasMore) return;

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
  };

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
    // isMessagesLoading is included so this re-runs the moment the real
    // chat UI (and therefore the refs) actually mounts — during the
    // initial skeleton render, chatRef/sentinelRef don't exist yet, so
    // the very first run of this effect would otherwise bail out and
    // never get a second chance since hasMore alone doesn't change
  }, [hasMore, isMessagesLoading]);

  const touchStartX = useRef(null);
  const touchEndX = useRef(null);

  // Stable callback identities (useCallback) so MessageBubble's memo
  // comparison isn't defeated by a brand-new function prop on every
  // ChatContainer render.
  const handleTouchStart = useCallback((e) => {
    touchStartX.current = e.targetTouches[0].clientX;
  }, []);

  const handleTouchMove = useCallback((e) => {
    touchEndX.current = e.targetTouches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback(
    (message) => {
      if (!touchStartX.current || !touchEndX.current) return;
      if (touchEndX.current - touchStartX.current > 60) setReplyTo(message);

      touchStartX.current = null;
      touchEndX.current = null;
    },
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
    <div className="flex-1 flex flex-col h-full">
      <div
        ref={chatRef}
        className="flex-1 overflow-y-auto p-3 space-y-3"
      >
        {messages.map((message) => (
          <MessageBubble
            key={message._id}
            message={message}
            isSelf={message.logger === myRole}
            onDelete={deleteMessage}
            onImageClick={handleImageClick}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
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
