import { useEffect, useRef, useState } from "react";
import { Trash2 } from "lucide-react";
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

  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const [fullImage, setFullImage] = useState(null);

  useEffect(() => {
    getMessages();
    initSocket();
  }, []);

  // Fetch older messages when scrolled to bottom
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
                {/* REPLY PREVIEW INSIDE MESSAGE */}
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

                {/* MESSAGE CONTENT */}
                {media ? (
                  <InstagramBubble url={media.url} type={media.type} />
                ) : (
                  message.text && <p>{message.text}</p>
                )}

                {message.audio && <VoiceMessageBubble src={message.audio} />}

                {message.image && (
                  <img
                    src={message.image}
                    onClick={() => setFullImage(message.image)}
                    className="mt-2 rounded-md max-w-[180px] cursor-pointer"
                  />
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
