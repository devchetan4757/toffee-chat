import { memo } from "react";
import { Trash2 } from "lucide-react";
import VoiceMessageBubble from "./VoiceMessageBubble";
import InstagramBubble from "./InstagramBubble";
import { formatMessageTime } from "../lib/utils";

const detectInstagramMedia = (text) => {
  if (!text) return null;
  if (text.includes("instagram.com/reel")) return { type: "reel", url: text };
  if (text.includes("instagram.com/p")) return { type: "post", url: text };
  return null;
};

const isStickerImage = (img) =>
  typeof img === "string" &&
  img.includes("chat_stickers") &&
  img.includes("res.cloudinary.com");

// Memoized so that a status/array change on OTHER messages (or the
// seen-tracking effect re-running) never re-renders every bubble in
// the list — only the bubble whose own props actually changed.
const MessageBubble = memo(function MessageBubble({
  message,
  isSelf,
  onDelete,
  onImageClick,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
}) {
  const media = detectInstagramMedia(message.text);

  return (
    <div className={`chat ${isSelf ? "chat-end" : "chat-start"} group`}>
      <div className="chat-header flex gap-2 text-[10px] opacity-60">
        {formatMessageTime(message.createdAt)}

        <button
          onClick={() => onDelete(message._id)}
          className="opacity-0 group-hover:opacity-100"
        >
          <Trash2 size={12} />
        </button>
      </div>

      <div
        className="chat-bubble max-w-[75%] cursor-pointer"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={() => onTouchEnd(message)}
        onClick={() => {
          if (message.image && !isStickerImage(message.image)) {
            onImageClick(message.image);
          }
        }}
      >
        {message.replyTo && (
          <div className="bg-gray-200 px-2 py-1 rounded-md mb-2 border-l-2 border-blue-500 flex items-center gap-2">
            {message.replyTo.text && (
              <p className="text-sm text-gray-700 truncate max-w-[80%]">
                {message.replyTo.text}
              </p>
            )}

            {message.replyTo.image && (
              <img
                src={message.replyTo.image}
                className="w-10 h-10 rounded object-cover"
              />
            )}

            {message.replyTo.stickers?.length > 0 && (
              <img
                src={message.replyTo.stickers[0]}
                className="w-10 h-10 object-contain"
              />
            )}

            {message.replyTo.audio && (
              <span className="text-xs opacity-70">🎵</span>
            )}
          </div>
        )}

        {media ? (
          <InstagramBubble url={media.url} type={media.type} />
        ) : (
          message.text && <p>{message.text}</p>
        )}

        {message.audio && <VoiceMessageBubble src={message.audio} />}

        {message.stickers?.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {message.stickers.map((sticker, idx) => (
              <img
                key={idx}
                src={sticker}
                alt="sticker"
                className="w-[72px] h-auto object-contain"
              />
            ))}
          </div>
        )}

        {message.image && (
          <img
            src={message.image}
            loading="lazy"
            decoding="async"
            className={`mt-2 rounded-md bg-base-300/40 ${
              isStickerImage(message.image)
                ? "w-[72px] h-auto object-contain"
                : "max-w-[180px] min-h-[96px] object-cover"
            }`}
          />
        )}
      </div>
    </div>
  );
});

export default MessageBubble;
