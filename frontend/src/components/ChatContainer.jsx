import { useEffect, useRef, useState } from "react";
import { Trash2, X } from "lucide-react";
import { FixedSizeList as List } from "react-window"; // virtualized list
import AutoSizer from "react-virtualized-auto-sizer";

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

  useEffect(() => {
    getMessages(); // initial load
    initSocket();
  }, []);

  // Load older messages when reaching bottom
  const loadOlderMessages = async () => {
    if (loadingOlderRef.current) return;
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage) return;

    loadingOlderRef.current = true;
    await getMessages(lastMessage._id, 50); // load 50 older messages at a time
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

  // Render each message
  const Row = ({ index, style }) => {
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

        <div className="chat-bubble max-w-[75%]">
          {/* REPLY PREVIEW */}
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
                  alt="reply"
                />
              )}
              {message.replyTo.audio && (
                <audio controls src={message.replyTo.audio} className="mt-1 w-full" />
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
              className="mt-2 rounded-md max-w-[180px] cursor-pointer"
              onClick={() => setViewImage(message.image)}
            />
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col h-full relative">
      <div ref={chatRef} className="flex-1 relative">
        <AutoSizer>
          {({ height, width }) => (
            <List
              height={height}
              itemCount={messages.length}
              itemSize={110} // approximate height of each message
              width={width}
              onItemsRendered={({ visibleStopIndex }) => {
                // load older when scrolling to bottom
                if (visibleStopIndex >= messages.length - 1) loadOlderMessages();
              }}
              overscanCount={5}
            >
              {Row}
            </List>
          )}
        </AutoSizer>
      </div>

      <MessageInput />

      {/* FULLSCREEN IMAGE */}
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
