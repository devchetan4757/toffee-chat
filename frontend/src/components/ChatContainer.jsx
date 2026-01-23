import { useEffect, useRef, useState, useMemo } from "react";
import { Trash2, X } from "lucide-react";
import VoiceMessageBubble from "./VoiceMessageBubble";
import { useChatStore } from "../store/useChatStore";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import InstagramBubble from "./InstagramBubble";

const detectInstagramMedia = (text) => {
  if (!text) return null;

  const reelMatch = text.match(
    /(https?:\/\/(www\.)?instagram\.com\/reel\/[A-Za-z0-9_-]+\/?)/
  );
  if (reelMatch) return { type: "reel", url: reelMatch[1] };

  const postMatch = text.match(
    /(https?:\/\/(www\.)?instagram\.com\/p\/[A-Za-z0-9_-]+\/?)/
  );
  if (postMatch) return { type: "post", url: postMatch[1] };

  return null;
};

const ChatContainer = () => {
  const {
    messages,
    getMessages,
    deleteMessage,
    isMessagesLoading,
    initSocket,
  } = useChatStore();

  const [viewImage, setViewImage] = useState(null);

  const chatRef = useRef(null);
  const loadingOlderRef = useRef(false); // prevents double fetch

  // Initial load
  useEffect(() => {
    getMessages();
  }, [getMessages]);

  // Socket init once
  useEffect(() => {
    initSocket?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sort oldest -> newest (best for chat UI)
  const sortedMessages = useMemo(() => {
    return [...messages].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
  }, [messages]);

  // ✅ AUTO LOAD older messages when user scrolls to TOP
  const handleScroll = async () => {
    const el = chatRef.current;
    if (!el) return;

    // if already loading older, stop
    if (loadingOlderRef.current) return;

    // if user not at top, stop
    if (el.scrollTop > 10) return;

    // oldest message cursor
    const oldestId = sortedMessages[0]?._id;
    if (!oldestId) return;

    loadingOlderRef.current = true;

    // keep scroll position stable
    const prevScrollHeight = el.scrollHeight;

    await getMessages(oldestId);

    // after messages load, adjust scroll so user stays at same position
    requestAnimationFrame(() => {
      const newScrollHeight = el.scrollHeight;
      el.scrollTop = newScrollHeight - prevScrollHeight;
      loadingOlderRef.current = false;
    });
  };

  if (isMessagesLoading && messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col overflow-auto">
        <MessageSkeleton />
        <MessageInput />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full relative">
      {/* Messages */}
      <div
        ref={chatRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3"
      >
        {/* top loader hint */}
        <p className="text-center text-[10px] opacity-40">
          Scroll up to load older messages
        </p>

        {sortedMessages.map((message) => {
          const media = detectInstagramMedia(message.text);

          return (
            <div key={message._id} className="chat chat-start group">
              {/* Header */}
              <div className="chat-header mb-1 flex items-center gap-2">
                <time className="text-[10px] opacity-50">
                  {new Date(message.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </time>

                <button
                  onClick={() => deleteMessage(message._id)}
                  className="opacity-0 group-hover:opacity-100 transition"
                  title="Delete message"
                >
                  <Trash2 size={12} />
                </button>
              </div>

              {/* Bubble */}
              <div className="chat-bubble max-w-[80%] sm:max-w-[65%] md:max-w-[50%] px-3 py-2">
                {/* Instagram Media */}
                {media ? (
                  <InstagramBubble url={media.url} type={media.type} />
                ) : (
                  message.text && (
                    <p className="text-xs sm:text-sm leading-snug break-words">
                      {message.text}
                    </p>
                  )
                )}

                {/* Audio */}
                {message.audio && <VoiceMessageBubble src={message.audio} />}

                {/* Image */}
                {message.image && (
                  <img
                    src={message.image}
                    alt="message"
                    loading="lazy"
                    onClick={() => setViewImage(message.image)}
                    className="mt-2 w-full max-w-[180px] rounded-md object-cover cursor-pointer hover:opacity-90"
                  />
                )}

                {/* Stickers */}
                {message.stickers &&
                  message.stickers.map((sticker, idx) => (
                    <img
                      key={idx}
                      src={sticker}
                      alt="sticker"
                      className="w-12 h-12 object-contain inline-block mr-1 mt-1"
                    />
                  ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Input */}
      <div className="border-t bg-base-100">
        <MessageInput />
      </div>

      {/* Image Viewer */}
      {viewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-2 sm:p-4"
          onClick={() => setViewImage(null)}
        >
          <button
            className="absolute top-4 right-4 text-white"
            onClick={() => setViewImage(null)}
          >
            <X size={22} />
          </button>
          <img
            src={viewImage}
            alt="full-view"
            onClick={(e) => e.stopPropagation()}
            className="max-w-full max-h-full object-contain rounded-lg"
          />
        </div>
      )}
    </div>
  );
};

export default ChatContainer;
