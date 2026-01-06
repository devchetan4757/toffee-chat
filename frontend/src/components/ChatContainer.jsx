import { useEffect, useRef, useState } from "react";
import { Trash2, X } from "lucide-react";

import { useChatStore } from "../store/useChatStore";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { formatMessageTime } from "../lib/utils";

const ChatContainer = () => {
  const {
    messages,
    getMessages,
    deleteMessage,
    isMessagesLoading,
    initSocket,
  } = useChatStore();

  const messageEndRef = useRef(null);
  const [viewImage, setViewImage] = useState(null);

  // Fetch messages
  useEffect(() => {
    getMessages();
  }, [getMessages]);

  // Init socket
  useEffect(() => {
    const cleanup = initSocket();
    return cleanup;
  }, [initSocket]);

  // Auto scroll
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

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
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-center text-xs opacity-50">
            No messages yet
          </p>
        )}

        {messages.map((message) => (
          <div key={message._id} className="chat chat-start group">
            {/* Header */}
            <div className="chat-header mb-1 flex items-center gap-2">
              <time className="text-[10px] opacity-50">
                {formatMessageTime(message.createdAt)}
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
              {message.text && (
                <p className="text-xs sm:text-sm leading-snug break-words">
                  {message.text}
                </p>
              )}

              {message.image && (
                <img
                  src={message.image}
                  alt="message"
                  loading="lazy"
                  onClick={() => setViewImage(message.image)}
                  className="
                    mt-2
                    w-full
                    max-w-[150px] sm:max-w-[180px]
                    rounded-md
                    object-cover
                    cursor-pointer
                    hover:opacity-90
                  "
                />
              )}
            </div>
          </div>
        ))}

        <div ref={messageEndRef} />
      </div>

      {/* Input */}
      <div className="border-t bg-base-100">
        <MessageInput />
      </div>

      {/* Responsive Image Viewer */}
      {viewImage && (
        <div
          className="
            fixed inset-0 z-50
            bg-black/90
            flex items-center justify-center
            p-2 sm:p-4 md:p-6
          "
          onClick={() => setViewImage(null)}
        >
          {/* Close button */}
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
            className="
              w-auto h-auto
              max-w-full max-h-full
              sm:max-w-[90vw] sm:max-h-[90vh]
              object-contain
              rounded-lg
            "
          />
        </div>
      )}
    </div>
  );
};

export default ChatContainer;
