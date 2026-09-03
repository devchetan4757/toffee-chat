import { useEffect, useRef, useState } from "react";
import { Trash2 } from "lucide-react";
import MessageInput from "./MessageInput";
import VoiceMessageBubble from "./VoiceMessageBubble";
import InstagramBubble from "./InstagramBubble";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils";
import { socket } from "../lib/socket";

const detectInstagramMedia = (text) => {
  if (!text) return null;
  if (text.includes("instagram.com/reel")) return { type: "reel", url: text };
  if (text.includes("instagram.com/p")) return { type: "post", url: text };
  return null;
};

// sticker detection (Cloudinary safe)
const isStickerImage = (img) =>
  typeof img === "string" &&
  (img.includes("chat_stickers") && img.includes("res.cloudinary.com"));

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

  // mark newly loaded messages as seen (runs on every messages change,
  // not just the closure from initial load)
  useEffect(() => {
    messages.forEach((m) => {
      if (m.logger !== myRole) socket.emit("messageSeen", m._id);
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

  const handleTouchStart = (e) =>
    (touchStartX.current = e.targetTouches[0].clientX);

  const handleTouchMove = (e) =>
    (touchEndX.current = e.targetTouches[0].clientX);

  const handleTouchEnd = (message) => {
    if (!touchStartX.current || !touchEndX.current) return;
    if (touchEndX.current - touchStartX.current > 60) setReplyTo(message);

    touchStartX.current = null;
    touchEndX.current = null;
  };

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
        {messages.map((message, i) => {
          const isSelf = message.logger === myRole;
          const media = detectInstagramMedia(message.text);

          return (
            <div
              key={message._id}
              className={`chat ${isSelf ? "chat-end" : "chat-start"} group`}
            >
              <div className="chat-header flex gap-2 text-[10px] opacity-60">
                {formatMessageTime(message.createdAt)}

                <button
                  onClick={() => deleteMessage(message._id)}
                  className="opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={12} />
                </button>
              </div>

              <div
                className="chat-bubble max-w-[75%] cursor-pointer"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={() => handleTouchEnd(message)}
                onClick={() => {
                  if (message.image && !isStickerImage(message.image)) {
                    setFullImage(message.image);
                  }
                }}
              >
                {message.replyTo && (
  <div className="bg-gray-200 px-2 py-1 rounded-md mb-2 border-l-2 border-blue-500 flex items-center gap-2">

    {/* TEXT */}
    {message.replyTo.text && (
      <p className="text-sm text-gray-700 truncate max-w-[80%]">
        {message.replyTo.text}
      </p>
    )}

    {/* IMAGE */}
    {message.replyTo.image && (
      <img
        src={message.replyTo.image}
        className="w-10 h-10 rounded object-cover"
      />
    )}

    {/* STICKER */}
    {message.replyTo.stickers?.length > 0 && (
      <img
        src={message.replyTo.stickers[0]}
        className="w-10 h-10 object-contain"
      />
    )}

    {/* AUDIO (optional indicator only) */}
    {message.replyTo.audio && (
      <span className="text-xs opacity-70">🎵</span>
    )}
  </div>
)}

                {/* Instagram */}
                {media ? (
                  <InstagramBubble url={media.url} type={media.type} />
                ) : (
                  message.text && <p>{message.text}</p>
                )}

                {/* Audio */}
                {message.audio && (
                  <VoiceMessageBubble src={message.audio} />
                )}

                {/* Stickers */}
                {message.stickers?.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {message.stickers.map((sticker, idx) => (
                      <img
                        key={idx}
                        src={sticker}
                        alt="sticker"
                        className="w-[72px] h-auto object-contain"
                      />
                    ))}
                  </div>
                )}

                {/* Image */}
                {message.image && (
                  <img
                    src={message.image}
                    loading="lazy"
                    decoding="async"
                    className={`mt-2 rounded-md bg-base-300/40 ${
                      isStickerImage(message.image)
                        ? "w-[72px] h-auto object-contain"
                        : "max-w-[180px] min-h-[96px] object-cover"
                    }`}
                  />
                )}
              </div>
            </div>
          );
        })}

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
