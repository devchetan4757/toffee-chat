import { useEffect, useRef } from "react";
import { Trash2, X } from "lucide-react";
import VoiceMessageBubble from "./VoiceMessageBubble";
import InstagramBubble from "./InstagramBubble";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { useChatStore } from "../store/useChatStore";

const detectInstagramMedia = (text) => {
  if (!text) return null;

  if (text.includes("instagram.com/reel"))
    return { type: "reel", url: text };

  if (text.includes("instagram.com/p"))
    return { type: "post", url: text };

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

  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  useEffect(() => {
    getMessages();
    initSocket();
  }, []);

  // Fetch older messages when scrolled to bottom
  const handleScroll = async () => {
    const el = chatRef.current;
    if (!el || loadingOlderRef.current) return;

    const nearBottom =
      el.scrollHeight - el.scrollTop - el.clientHeight < 50;

    if (!nearBottom) return;

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
    <div className="flex-1 flex flex-col h-full">
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
                {new Date(message.createdAt).toLocaleTimeString()}
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
                    setReplyTo(message); // swipe right → reply
                  }
                }}
              >
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
                    className="mt-2 rounded-md max-w-[180px]"
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>

      <MessageInput />
    </div>
  );
};

export default ChatContainer;
