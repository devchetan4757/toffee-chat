import { useEffect, useRef, useState, useMemo } from "react";
import { Trash2, X } from "lucide-react";
import VoiceMessageBubble from "./VoiceMessageBubble";
import { useChatStore } from "../store/useChatStore";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import InstagramBubble from "./InstagramBubble";

// Detect Instagram Reel/Post URLs
const detectInstagramMedia = (text) => {
  if (!text) return null;

  const reelMatch = text.match(
    /(https?:\/\/(www\.)?instagram\.com\/reel\/[A-Za-z0-9_-]+)/
  );
  if (reelMatch) return { type: "reel", url: reelMatch[1] };

  const postMatch = text.match(
    /(https?:\/\/(www\.)?instagram\.com\/p\/[A-Za-z0-9_-]+)/
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

  const messageTopRef = useRef(null);
  const [viewImage, setViewImage] = useState(null);

  useEffect(() => getMessages(), [getMessages]);

  useEffect(() => {
    const cleanup = initSocket();
    return cleanup;
  }, [initSocket]);

  const sortedMessages = useMemo(
    () =>
      [...messages].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      ),
    [messages]
  );

  useEffect(() => {
    messageTopRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [sortedMessages.length]);

  if (isMessagesLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-auto">
        <MessageSkeleton />
        <MessageInput />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full relative">
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
        <div ref={messageTopRef} />

        {sortedMessages.length === 0 && (
          <p className="text-center text-xs opacity-50">No messages yet</p>
        )}

        {sortedMessages.map((message) => {
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
                >
                  <Trash2 size={12} />
                </button>
              </div>

              <div className="chat-bubble max-w-[80%] sm:max-w-[65%] md:max-w-[50%] px-3 py-2">
                {media ? (
                  <InstagramBubble url={media.url} type={media.type} />
                ) : (
                  message.text && (
                    <p className="text-xs sm:text-sm break-words">
                      {message.text}
                    </p>
                  )
                )}

                {message.audio && (
                  <VoiceMessageBubble src={message.audio} />
                )}

                {message.image && (
                  <img
                    src={message.image}
                    alt="message"
                    onClick={() => setViewImage(message.image)}
                    className="mt-2 max-w-[180px] rounded-md cursor-pointer"
                  />
                )}
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
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setViewImage(null)}
        >
          <X className="absolute top-4 right-4 text-white" />
          <img src={viewImage} className="max-w-[90vw] max-h-[90vh]" />
        </div>
      )}
    </div>
  );
};

export default ChatContainer;
