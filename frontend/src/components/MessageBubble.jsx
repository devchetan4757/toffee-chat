import { memo, useRef, useState } from "react";
import { Trash2, Reply } from "lucide-react";
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

// How far (px) the bubble needs to travel before lifting a finger
// counts as "reply", not just a stray drag.
const SWIPE_TRIGGER_PX = 60;
// Visual cap on how far the bubble is allowed to slide — WhatsApp
// doesn't let the row travel further than the reply icon needs.
const SWIPE_MAX_PX = 78;
// Below this, a touch is treated as a tap/scroll, not a swipe attempt
// — keeps clicking the bubble (to open an image) unaffected.
const SWIPE_MIN_PX = 8;

// Rubber-band past the cap: real movement continues to register (so a
// long swipe still visually responds) but with diminishing returns,
// which is what makes the stop feel elastic instead of a hard wall.
const rubberBand = (dx) => {
  if (dx <= SWIPE_MAX_PX) return dx;
  const over = dx - SWIPE_MAX_PX;
  return SWIPE_MAX_PX + over * 0.25;
};

// Memoized so that a status/array change on OTHER messages (or the
// seen-tracking effect re-running) never re-renders every bubble in
// the list — only the bubble whose own props actually changed. The
// swipe gesture keeps its live offset in *local* state (below) rather
// than lifted to ChatContainer, so dragging one bubble never touches
// this memo boundary or re-renders its siblings.
const MessageBubble = memo(function MessageBubble({
  message,
  isSelf,
  onDelete,
  onImageClick,
  onSwipeReply,
}) {
  const media = detectInstagramMedia(message.text);

  // ================= SWIPE TO REPLY =================
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  // null = not yet decided, "horizontal" = swiping (own the gesture),
  // "vertical" = the user is scrolling the list, ignore for the rest
  // of this touch.
  const axisRef = useRef(null);
  const firedRef = useRef(false);
  const clickSuppressedRef = useRef(false);

  const resetSwipe = () => {
    setIsDragging(false);
    setDragX(0);
    axisRef.current = null;
    firedRef.current = false;
  };

  const handleTouchStart = (e) => {
    const touch = e.targetTouches[0];
    startXRef.current = touch.clientX;
    startYRef.current = touch.clientY;
    axisRef.current = null;
    firedRef.current = false;
    clickSuppressedRef.current = false;
  };

  const handleTouchMove = (e) => {
    const touch = e.targetTouches[0];
    const dx = touch.clientX - startXRef.current;
    const dy = touch.clientY - startYRef.current;

    if (axisRef.current === null) {
      if (Math.abs(dx) < SWIPE_MIN_PX && Math.abs(dy) < SWIPE_MIN_PX) return;
      // Whichever direction moved further decides the gesture — once
      // decided it's locked for the rest of this touch, so a slightly
      // diagonal swipe doesn't flicker between scrolling and replying.
      axisRef.current = Math.abs(dx) > Math.abs(dy) ? "horizontal" : "vertical";
      if (axisRef.current === "horizontal") setIsDragging(true);
    }

    if (axisRef.current !== "horizontal") return;

    // Only rightward swipes reveal the reply icon, matching the
    // one-direction gesture WhatsApp uses on both sent and received
    // bubbles — no leftward drag, so it never fights with anything else.
    const clamped = dx > 0 ? rubberBand(dx) : 0;
    setDragX(clamped);

    if (!firedRef.current && clamped >= SWIPE_TRIGGER_PX) {
      firedRef.current = true;
      if (navigator.vibrate) navigator.vibrate(15);
    }
  };

  const handleTouchEnd = () => {
    if (axisRef.current === "horizontal") {
      // A real swipe happened — eat the click that would otherwise
      // fire right after (which would open the image lightbox).
      clickSuppressedRef.current = dragX > SWIPE_MIN_PX;
      if (firedRef.current) onSwipeReply(message);
    }
    resetSwipe();
  };

  const handleClick = () => {
    if (clickSuppressedRef.current) {
      clickSuppressedRef.current = false;
      return;
    }
    if (message.image && !isStickerImage(message.image)) {
      onImageClick(message.image);
    }
  };

  const replyIconProgress = Math.min(dragX / SWIPE_TRIGGER_PX, 1);

  return (
    <div className={`chat ${isSelf ? "chat-end" : "chat-start"} group relative`}>
      <div className="chat-header flex gap-2 text-[10px] opacity-60">
        {formatMessageTime(message.createdAt)}

        <button
          onClick={() => onDelete(message._id)}
          className="opacity-0 group-hover:opacity-100"
        >
          <Trash2 size={12} />
        </button>
      </div>

      {/* Reply icon revealed behind the bubble as it slides right */}
      <div
        className="absolute top-1/2 left-0 -translate-y-1/2 flex items-center justify-center w-9 h-9 rounded-full bg-base-300 pointer-events-none"
        style={{
          opacity: dragX > SWIPE_MIN_PX ? replyIconProgress : 0,
          transform: `translateY(-50%) scale(${0.6 + replyIconProgress * 0.4})`,
          transition: isDragging ? "none" : "opacity 150ms ease, transform 150ms ease",
        }}
      >
        <Reply size={16} className="opacity-70" />
      </div>

      <div
        className="chat-bubble max-w-[75%] cursor-pointer"
        style={{
          transform: `translateX(${dragX}px)`,
          transition: isDragging ? "none" : "transform 220ms cubic-bezier(0.34, 1.3, 0.64, 1)",
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={resetSwipe}
        onClick={handleClick}
      >
        {message.replyTo && (
          <div
            className={`px-2 py-1.5 mb-1.5 rounded-md flex items-start gap-2 bg-black/10 border-l-[3px] ${
              isSelf ? "border-primary-content/70" : "border-primary"
            }`}
          >
            {/* Text column — wraps up to 2 lines like WhatsApp, then
                clips with an ellipsis, instead of cutting off at line 1. */}
            <div className="min-w-0 flex-1">
              {message.replyTo.text ? (
                <p className="text-sm opacity-80 line-clamp-2 break-words">
                  {message.replyTo.text}
                </p>
              ) : message.replyTo.audio ? (
                <span className="text-sm opacity-70 flex items-center gap-1">
                  🎵 Voice message
                </span>
              ) : message.replyTo.image ? (
                <span className="text-sm opacity-70 flex items-center gap-1">
                  <Reply size={12} className="opacity-50 shrink-0 rotate-180" />
                  Photo
                </span>
              ) : message.replyTo.stickers?.length > 0 ? (
                <span className="text-sm opacity-70">Sticker</span>
              ) : (
                <span className="text-sm opacity-60 italic">Message</span>
              )}
            </div>

            {/* Thumbnail — sits to the right of the text, same as WhatsApp's
                reply preview, instead of squeezing into the text row. */}
            {message.replyTo.image && (
              <img
                src={message.replyTo.image}
                className="w-9 h-9 rounded object-cover shrink-0"
              />
            )}

            {!message.replyTo.image && message.replyTo.stickers?.length > 0 && (
              <img
                src={message.replyTo.stickers[0]}
                className="w-9 h-9 object-contain shrink-0"
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
