import { useEffect, useRef, useState } from "react";
import { Trash2 } from "lucide-react";
import MessageInput from "./MessageInput";
import VoiceMessageBubble from "./VoiceMessageBubble";
import InstagramBubble from "./InstagramBubble";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { socket } from "../lib/socket";
import { formatMessageTime } from "../lib/utils";

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
  } = useChatStore();

  const { role: myRole } = useAuthStore();

  const chatRef = useRef(null);
  const loadingOlderRef = useRef(false);

  const touchStartX = useRef(null);
  const touchEndX = useRef(null);

  const [fullImage, setFullImage] = useState(null);

  useEffect(() => {
    getMessages();
  }, []);

  // 🔵 mark messages as seen
  useEffect(() => {

    messages.forEach((m) => {
      if (m.logger !== myRole && m.status !== "seen") {
        socket.emit("messageSeen", m._id);
      }
    });

  }, [messages]);

  const handleScroll = async () => {
    const el = chatRef.current;
    if (!el || loadingOlderRef.current) return;

    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 50;
    if (!nearBottom) return;

    const oldestId = messages[messages.length - 1]?._id;
    if (!oldestId) return;

    loadingOlderRef.current = true;
    await getMessages(oldestId);
    loadingOlderRef.current = false;
  };

  const handleTouchStart = (e) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = (message) => {
    if (!touchStartX.current || !touchEndX.current) return;

    const distance = touchEndX.current - touchStartX.current;

    if (distance > 60) {
      setReplyTo(message);
    }

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
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-3 space-y-3"
      >
        {messages.map((message) => {

          const isSelf = message.logger && myRole && message.logger === myRole;
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
                onClick={() =>
                  !isStickerImage(message.image) && setFullImage(message.image)
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

                {/* Instagram preview */}
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
                    className={`mt-2 rounded-md ${
                      isStickerImage(message.image)
                        ? "w-[72px] h-auto object-contain"
                        : "max-w-[180px]"
                    }`}
                  />
                )}

                {/* ✅ MESSAGE TICKS */}
                {isSelf && (
                  <div className="text-[15px] text-right mt-1 opacity-100">

                    {message.status === "sent" && "✓"}

                    {message.status === "delivered" && "✓✓"}

                    {message.status === "seen" && (
                      <span className="text-black">✓✓</span>
                    )}

                  </div>
                )}

              </div>
            </div>
          );
        })}
      </div>

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
