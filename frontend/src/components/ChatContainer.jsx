import { useEffect, useRef } from "react";
import { Trash2 } from "lucide-react";

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

  // Fetch messages once on mount
  useEffect(() => {
    getMessages();
  }, [getMessages]);

  // Init socket once
  useEffect(() => {
    const cleanup = initSocket();
    return cleanup;
  }, [initSocket]);

  // Auto-scroll to bottom when messages change
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
    <div className="flex-1 flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-4 space-y-4">
        {messages.length === 0 && (
          <p className="text-center text-sm opacity-50">
            No messages yet
          </p>
        )}

        {messages.map((message) => (
          <div key={message._id} className="chat chat-start group">
            <div className="chat-header mb-1 flex items-center gap-2">
              <time className="text-xs opacity-50">
                {formatMessageTime(message.createdAt)}
              </time>

              <button
                onClick={() => deleteMessage(message._id)}
                className="opacity-0 group-hover:opacity-100 transition"
                title="Delete message"
              >
                <Trash2 size={14} />
              </button>
            </div>

            <div className="chat-bubble max-w-[90%] sm:max-w-[75%] md:max-w-[60%] break-words">
              {message.text && <p className="text-sm sm:text-base md:text-base">{message.text}</p>}

              {message.image && (
                <img
                  src={message.image}
                  alt="message"
                  loading="lazy"
                  className="mt-2 w-full max-w-[220px] sm:max-w-xs rounded-lg object-contain"
                />
              )}
            </div>
          </div>
        ))}

        {/* Scroll anchor */}
        <div ref={messageEndRef} />
      </div>

      {/* Sticky Input */}
      <div className="border-t bg-base-100">
        <MessageInput />
      </div>
    </div>
  );
};

export default ChatContainer;
