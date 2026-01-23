import { useEffect, useRef, useState } from "react";
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
  const { messages, getMessages, deleteMessage, isMessagesLoading, initSocket } =
    useChatStore();

  const [viewImage, setViewImage] = useState(null);
  const chatRef = useRef(null);
  const loadingOlderRef = useRef(false);

  useEffect(() => getMessages(), [getMessages]); // initial load
  useEffect(() => initSocket?.(), [initSocket]); // socket init

  const handleScroll = async () => {
    const el = chatRef.current;
    if (!el) return;

    // Already loading older?
    if (loadingOlderRef.current) return;

    // If user not at bottom (10px tolerance)
    if (el.scrollTop + el.clientHeight < el.scrollHeight - 10) return;

    // Last message = oldest
    const oldestId = messages[messages.length - 1]?._id;
    if (!oldestId) return;

    loadingOlderRef.current = true;
    const prevScrollHeight = el.scrollHeight;

    await getMessages(oldestId);

    requestAnimationFrame(() => {
      const newScrollHeight = el.scrollHeight;
      el.scrollTop = el.scrollTop + (newScrollHeight - prevScrollHeight);
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
        {messages.length === 0 && (
          <p className="text-center text-xs opacity-50">No messages yet</p>
        )}

        {messages.map((message) => {
          const media = detectInstagramMedia(message.text);

          return (
            <div key={message._id} className="chat chat-start group">
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

              <div className="chat-bubble max-w-[80%] sm:max-w-[65%] md:max-w-[50%] px-3 py-2">
                {media ? (
                  <InstagramBubble url={media.url} type={media.type} />
                ) : (
                  message.text && (
                    <p className="text-xs sm:text-sm leading-snug break-words">
                      {message.text}
                    </p>
                  )
                )}

                {message.audio && <VoiceMessageBubble src={message.audio} />}

                {message.image && (
                  <img
                    src={message.image}
                    alt="message"
                    loading="lazy"
                    onClick={() => setViewImage(message.image)}
                    className="mt-2 w-full max-w-[180px] rounded-md object-cover cursor-pointer hover:opacity-90"
                  />
                )}

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

      <div className="border-t bg-base-100">
        <MessageInput />
      </div>

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
