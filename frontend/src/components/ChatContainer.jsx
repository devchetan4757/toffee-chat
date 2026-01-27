import { useEffect, useRef, useState, useCallback } from "react";
import { Trash2 } from "lucide-react";
import { VariableSizeList as List } from "react-window";
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
  const listRef = useRef(null);
  const loadingOlderRef = useRef(false);
  const [containerHeight, setContainerHeight] = useState(0);

  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  useEffect(() => {
    getMessages();
    initSocket();

    const updateHeight = () => {
      if (chatRef.current) setContainerHeight(chatRef.current.clientHeight);
    };
    updateHeight();
    window.addEventListener("resize", updateHeight);
    return () => window.removeEventListener("resize", updateHeight);
  }, []);

  // Fetch older messages when scrolling near bottom
  const handleScroll = async ({ scrollOffset, scrollUpdateWasRequested }) => {
    if (loadingOlderRef.current) return;
    if (!listRef.current) return;

    const list = listRef.current;
    const totalHeight = listRef.current._getItemStyle(messages.length - 1).top;
    if (scrollOffset + containerHeight + 50 >= totalHeight) {
      const oldestId = messages[messages.length - 1]?._id;
      if (!oldestId) return;

      loadingOlderRef.current = true;
      await getMessages(oldestId);
      loadingOlderRef.current = false;
    }
  };

  const Row = useCallback(
    ({ index, style }) => {
      const message = messages[index];
      const media = detectInstagramMedia(message.text);

      return (
        <div style={style} key={message._id} className="chat chat-start group">
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

            {media ? (
              <InstagramBubble url={media.url} type={media.type} />
            ) : (
              message.text && <p>{message.text}</p>
            )}

            {message.audio && <VoiceMessageBubble src={message.audio} />}

            {message.image && (
              <img
                src={message.image}
                className="mt-2 rounded-md max-w-[180px]"
              />
            )}
          </div>
        </div>
      );
    },
    [messages]
  );

  if (isMessagesLoading && messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col">
        <MessageSkeleton />
        <MessageInput />
      </div>
    );
  }

  return (
    <div ref={chatRef} className="flex-1 flex flex-col h-full">
      {containerHeight > 0 && (
        <List
          height={containerHeight}
          itemCount={messages.length}
          itemSize={() => 140} // approx height per message
          width="100%"
          ref={listRef}
          onScroll={handleScroll}
          className="overflow-x-hidden"
        >
          {Row}
        </List>
      )}

      <MessageInput />
    </div>
  );
};

export default ChatContainer;
