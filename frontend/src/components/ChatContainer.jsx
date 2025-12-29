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
  const didInitRef = useRef(false);

  // 1️⃣ Fetch messages once on mount
  useEffect(() => {
    getMessages(1);
  }, [getMessages]);

  // 2️⃣ Init socket listeners ONCE
  useEffect(() => {
    if (didInitRef.current) return;
    initSocket();
    didInitRef.current = true;
  }, [initSocket]);

  // 3️⃣ Auto-scroll when messages change
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
    <div className="flex-1 flex flex-col overflow-auto">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <p className="text-center text-sm opacity-50">
            No messages yet
          </p>
        )}

        {messages.map((message) => (
          <div
            key={message._id}
            className="chat chat-start group"
          >
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

            <div className="chat-bubble">

              {message.image && (
                <img
                  src={message.image}
                  alt="Attachment"
                  loading="lazy"
                  className="mt-2 max-w-xs rounded-lg"
                />
              )}
               {message.text && <p>{message.text}</p>}
            </div>
          </div>
        ))}

        {/* Scroll anchor */}
        <div ref={messageEndRef} />
      </div>

      <MessageInput />
    </div>
  );
};

export default ChatContainer;
