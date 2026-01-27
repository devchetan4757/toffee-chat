import { useEffect, useRef, useState } from "react";
import { Trash2, X, ArrowUp } from "lucide-react";
import VoiceMessageBubble from "./VoiceMessageBubble";
import InstagramBubble from "./InstagramBubble";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { useChatStore } from "../store/useChatStore";
import { formatMessageTime } from "../lib/utils";

const detectInstagramMedia = (text) => {
  if (!text) return null;
  if (text.includes("instagram.com/reel")) return { type: "reel", url: text };
  if (text.includes("instagram.com/p")) return { type: "post", url: text };
  return null;
};

const ChatContainer = () => {
  const {
    messages,
    getMessages,
    deleteMessage,
    isMessagesLoading,
    initSocket,
    setReplyTo,
  } = useChatStore();

  const chatRef = useRef(null);
  const loadingOlderRef = useRef(false);
  const [viewImage, setViewImage] = useState(null);

  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  useEffect(() => {
    getMessages();
    initSocket();
  }, []);

  // 🔹 Scroll-based loading (still works)
  const handleScroll = async () => {
    const el = chatRef.current;
    if (!el || loadingOlderRef.current) return;

    const nearBottom =
      el.scrollHeight - el.scrollTop - el.clientHeight < 50;

    if (!nearBottom) return;

    await loadOlderMessages();
  };

  // 🔹 Manual button loader
  const loadOlderMessages = async () => {
    if (loadingOlderRef.current) return;

    const oldestId = messages[messages.length - 1]?._id;
    if (!oldestId) return;

    loadingOlderRef.current = true;
    await getMessages(oldestId);
    loadingOlderRef.current = false;
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
    <div className="flex-1 flex flex-col h-full relative">
      <div
        ref={chatRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-3 space-y-3"
      >
        {messages.map((message) => {
          const media = detectInstagramMedia(message.text);

          return (
            <div key={message._id} className="chat chat-start group">
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
                className="chat-bubble max-w-[75%]"
                onTouchStart={(e) =>
                  (touchStartX.current = e.touches[0].clientX)
                }
                onTouchMove={(e) =>
                  (touchEndX.current = e.touches[0].clientX)
                }
                onTouchEnd={() => {
                  if (touchEndX.current - touchStartX.current > 60) {
                    setReplyTo(message);
                  }
                }}
              >
                {/* 🔹 REPLY PREVIEW */}
                {message.replyTo && (
                  <div className="mb-1 px-2 py-1 border-l-4 border-primary bg-base-300 rounded text-xs opacity-80">
                    <div className="truncate">
                      {message.replyTo.text || "Media"}
                    </div>
                  </div>
                )}

                {media ? (
                  <InstagramBubble url={media.url} type={media.type} />
                ) : (
                  message.text && <p>{message.text}</p>
                )}

                {message.audio && (
                  <VoiceMessageBubble src={message.audio} />
                )}

                {message.image && (
                  <img
                    src={message.image}
                    className="mt-2 rounded-md max-w-[180px] cursor-pointer"
                    onClick={() => setViewImage(message.image)}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 🔹 LOAD OLDER MESSAGES BUTTON (BOTTOM) */}
      {messages.length > 0 && (
        <div className="flex justify-center py-2 border-t border-base-300">
          <button
            onClick={loadOlderMessages}
            className="btn btn-sm btn-outline gap-2"
          >
            <ArrowUp size={14} />
            Load older messages
          </button>
        </div>
      )}

      <MessageInput />

      {/* 🔹 FULLSCREEN IMAGE */}
      {viewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setViewImage(null)}
        >
          <button
            className="absolute top-4 right-4 text-white"
            onClick={() => setViewImage(null)}
          >
            <X size={24} />
          </button>
          <img
            src={viewImage}
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};

export default ChatContainer;
