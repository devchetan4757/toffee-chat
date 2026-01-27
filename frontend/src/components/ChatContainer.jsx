import { useEffect, useRef, useState, useCallback } from "react";
import { Trash2 } from "lucide-react";
import { VariableSizeList as List } from "react-window";
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

  const listRef = useRef(null);
  const rowHeights = useRef({});
  const loadingOlderRef = useRef(false);

  useEffect(() => {
    getMessages();
    initSocket();
  }, []);

  // Load older messages manually or when reaching bottom
  const loadOlderMessages = async () => {
    if (loadingOlderRef.current) return;
    const oldestId = messages[messages.length - 1]?._id;
    if (!oldestId) return;

    loadingOlderRef.current = true;
    await getMessages(oldestId);
    loadingOlderRef.current = false;
  };

  // Measure and store dynamic row height
  const setRowHeight = (index, size) => {
    if (rowHeights.current[index] !== size) {
      rowHeights.current = { ...rowHeights.current, [index]: size };
      listRef.current?.resetAfterIndex(index);
    }
  };

  const getRowHeight = (index) => rowHeights.current[index] || 80;

  const Row = ({ index, style }) => {
    const message = messages[index];
    const media = detectInstagramMedia(message.text);
    const rowRef = useRef(null);

    useEffect(() => {
      if (rowRef.current) {
        setRowHeight(index, rowRef.current.getBoundingClientRect().height);
      }
    }, [index, message.text, message.image, message.audio, message.replyTo, message.stickers]);

    return (
      <div style={style} ref={rowRef} className="chat chat-start group">
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
          onTouchStart={(e) => (this.touchStartX = e.touches[0].clientX)}
          onTouchMove={(e) => (this.touchEndX = e.touches[0].clientX)}
          onTouchEnd={() => {
            if (this.touchEndX - this.touchStartX > 60) setReplyTo(message);
          }}
        >
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
                />
              )}
              {message.replyTo.audio && (
                <audio controls src={message.replyTo.audio} className="mt-1 w-full" />
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
            <img src={message.image} className="mt-2 rounded-md max-w-[180px]" />
          )}
        </div>
      </div>
    );
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
      <div className="flex-1 h-full">
        <AutoSizer>
          {({ height, width }) => (
            <List
              ref={listRef}
              height={height}
              width={width}
              itemCount={messages.length}
              itemSize={getRowHeight}
              overscanCount={5}
              direction="ltr"
            >
              {Row}
            </List>
          )}
        </AutoSizer>
      </div>

      {/* Load older messages button */}
      {messages.length > 0 && (
        <div className="flex justify-center py-2 border-t border-base-300">
          <button onClick={loadOlderMessages} className="btn btn-sm btn-outline">
            Load older messages
          </button>
        </div>
      )}

      <MessageInput />
    </div>
  );
};

export default ChatContainer;
