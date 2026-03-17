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

const isStickerImage = (img) => img?.startsWith("data:image/webp");

const ChatContainer = () => {
  const {
    messages,
    getMessages,
    deleteMessage,
    isMessagesLoading,
    setReplyTo,
    replyTo,
  } = useChatStore();

  const { role: myRole } = useAuthStore();

  const chatRef = useRef(null);
  const loadingOlderRef = useRef(false);
  const [fullImage, setFullImage] = useState(null);

  // Fetch initial messages and mark as seen
  useEffect(() => {
    const initChat = async () => {
      await getMessages();

      messages.forEach((m) => {
        if (m.logger !== myRole) socket.emit("messageSeen", m._id);
      });
    };
    initChat();
  }, []);

  // ---------------- SCROLL HANDLER ----------------
  const handleScroll = async () => {
    const el = chatRef.current;
    if (!el || loadingOlderRef.current) return;

    if (el.scrollTop > 50) return;

    const oldestId = messages[messages.length - 1]?._id;
    if (!oldestId) return;

    loadingOlderRef.current = true;

    await getMessages(oldestId);

    loadingOlderRef.current = false;
  };

  // ---------------- SWIPE TO REPLY ----------------
  const touchStartX = useRef(null);
  const touchEndX = useRef(null);

  const handleTouchStart = (e) =>
    (touchStartX.current = e.targetTouches[0].clientX);

  const handleTouchMove = (e) =>
    (touchEndX.current = e.targetTouches[0].clientX);

  const handleTouchEnd = (message) => {
    if (!touchStartX.current || !touchEndX.current) return;
    if (touchEndX.current - touchStartX.current > 60)
      setReplyTo(message);
    touchStartX.current = null;
    touchEndX.current = null;
  };

  // ---------------- LOADING SKELETON ----------------
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
      {/* ---------------- MESSAGES ---------------- */}
      <div
        ref={chatRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-3 space-y-3"
      >
        {messages.map((message, i) => {
          const isSelf = message.logger === myRole;
          const media = detectInstagramMedia(message.text);

          const isLatestSelf =
            isSelf &&
            i === 0 &&
            !messages.slice(0, i).some((m) => m.logger === myRole);

          return (
            <div
              key={message._id}
              className={`chat ${
                isSelf ? "chat-end" : "chat-start"
              } group`}
            >
              {/* Time + delete + ticks */}
              <div className="chat-header flex gap-2 text-[10px] opacity-60">
                {formatMessageTime(message.createdAt)}
                {isSelf && isLatestSelf && (
                  <span className="ml-1 text-xs">
                    {message.seen ? (
                      <span className="text-blue-500">✓✓</span>
                    ) : (
                      <span className="text-gray-400">✓✓</span>
                    )}
                  </span>
                )}
                <button
                  onClick={() => deleteMessage(message._id)}
                  className="opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={12} />
                </button>
              </div>

              {/* Message Bubble */}
              <div
                className="chat-bubble max-w-[75%] cursor-pointer"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={() => handleTouchEnd(message)}
                onClick={() =>
                  !isStickerImage(message.image) &&
                  setFullImage(message.image)
                }
              >
                {/* Reply preview */}
                {message.replyTo && (
                  <div className="bg-gray-200 px-2 py-1 rounded-md mb-2 border-l-2 border-blue-500">
                    {message.replyTo.text && (
                      <p className="text-sm text-gray-700 truncate max-w-[90%]">
                        {message.replyTo.text}
                      </p>
                    )}
                    {message.replyTo.image && (
                      <img
                        src={message.replyTo.image}
                        className="mt-1 max-w-[100px] rounded-md"
                      />
                    )}
                    {message.replyTo.audio && (
                      <audio
                        controls
                        src={message.replyTo.audio}
                        className="mt-1 w-full"
                      />
                    )}
                  </div>
                )}

                {/* Instagram bubble */}
                {media ? (
                  <InstagramBubble
                    url={media.url}
                    type={media.type}
                  />
                ) : (
                  message.text && <p>{message.text}</p>
                )}

                {/* Audio */}
                {message.audio && (
                  <VoiceMessageBubble src={message.audio} />
                )}

                {/* ✅ STICKERS FIX */}
                {message.stickers?.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
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
                    className={`mt-2 rounded-md ${
                      isStickerImage(message.image)
                        ? "w-[72px] h-auto object-contain"
                        : "max-w-[180px]"
                    }`}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ---------------- MESSAGE INPUT ---------------- */}
      <MessageInput />

      {/* ---------------- FULL IMAGE MODAL ---------------- */}
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
