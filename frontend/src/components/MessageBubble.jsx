import { memo, useCallback, useRef, useState } from "react";
import { Trash2, Reply } from "lucide-react";
import VoiceMessageBubble from "./VoiceMessageBubble";
import InstagramBubble from "./InstagramBubble";
import { formatMessageTime } from "../lib/utils";
import {
  isSkinEffect,
  effectBubbleClass,
  FireEffect,
  LoveEffect,
  CelebrationEffect,
  GiftEffect,
} from "./MessageEffects";

const detectInstagramMedia = (text) => {
  if (!text) return null;

  if (text.includes("instagram.com/reel")) {
    return { type: "reel", url: text };
  }

  if (text.includes("instagram.com/p")) {
    return { type: "post", url: text };
  }

  return null;
};

const isStickerImage = (img) =>
  typeof img === "string" &&
  img.includes("chat_stickers") &&
  img.includes("res.cloudinary.com");

const SWIPE_TRIGGER_PX = 60;
const SWIPE_MAX_PX = 78;
const SWIPE_MIN_PX = 8;

const rubberBand = (dx) => {
  if (dx <= SWIPE_MAX_PX) return dx;
  return SWIPE_MAX_PX + (dx - SWIPE_MAX_PX) * 0.25;
};

const MessageContent = memo(function MessageContent({
  message,
  media,
  isSelf,
  onImageClick,
}) {
  return (
    <>
      {message.replyTo && (
        <div
          className={`px-2 py-1.5 mb-1.5 rounded-md flex items-start gap-2 bg-black/10 border-l-[3px] ${
            isSelf
              ? "border-primary-content/70"
              : "border-primary"
          }`}
        >
          <div className="min-w-0 flex-1">
            {message.replyTo.text ? (
              <p className="text-sm opacity-80 line-clamp-2 break-words">
                {message.replyTo.text}
              </p>
            ) : message.replyTo.audio ? (
              <span className="text-sm opacity-70 flex items-center gap-1">
                Voice message
              </span>
            ) : message.replyTo.image ? (
              <span className="text-sm opacity-70 flex items-center gap-1">
                <Reply
                  size={12}
                  className="opacity-50 shrink-0 rotate-180"
                />
                Photo
              </span>
            ) : message.replyTo.stickers?.length > 0 ? (
              <span className="text-sm opacity-70">Sticker</span>
            ) : (
              <span className="text-sm opacity-60 italic">Message</span>
            )}
          </div>

          {message.replyTo.image && (
            <img
              src={message.replyTo.image}
              alt=""
              loading="lazy"
              decoding="async"
              className="w-9 h-9 rounded object-cover shrink-0"
            />
          )}

          {!message.replyTo.image &&
            message.replyTo.stickers?.length > 0 && (
              <img
                src={message.replyTo.stickers[0]}
                alt=""
                loading="lazy"
                decoding="async"
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
              loading="lazy"
              decoding="async"
              className="w-[72px] h-auto object-contain"
            />
          ))}
        </div>
      )}

      {message.image && (
        <img
          src={message.image}
          alt=""
          loading="lazy"
          decoding="async"
          onClick={(event) => {
            event.stopPropagation();

            if (
              !isStickerImage(message.image) &&
              onImageClick
            ) {
              onImageClick(message.image);
            }
          }}
          className={`mt-2 rounded-md bg-base-300/40 ${
            isStickerImage(message.image)
              ? "w-[72px] h-auto object-contain"
              : "max-w-[180px] min-h-[96px] object-cover cursor-pointer"
          }`}
        />
      )}
    </>
  );
});

const MessageBubble = memo(function MessageBubble({
  message,
  isSelf,
  onDelete,
  onImageClick,
  onSwipeReply,
  onCelebrationReplay,
}) {
  const media = detectInstagramMedia(message.text);
  const effect = message.effect ?? message.effect_type ?? null;

  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const axisRef = useRef(null);
  const firedRef = useRef(false);
  const clickSuppressedRef = useRef(false);

  const resetSwipe = useCallback(() => {
    setIsDragging(false);
    setDragX(0);
    axisRef.current = null;
    firedRef.current = false;
  }, []);

  const handleTouchStart = useCallback((e) => {
    const touch = e.targetTouches[0];
    if (!touch) return;

    startXRef.current = touch.clientX;
    startYRef.current = touch.clientY;
    axisRef.current = null;
    firedRef.current = false;
    clickSuppressedRef.current = false;
  }, []);

  const handleTouchMove = useCallback((e) => {
    const touch = e.targetTouches[0];
    if (!touch) return;

    const dx = touch.clientX - startXRef.current;
    const dy = touch.clientY - startYRef.current;

    if (axisRef.current === null) {
      if (
        Math.abs(dx) < SWIPE_MIN_PX &&
        Math.abs(dy) < SWIPE_MIN_PX
      ) {
        return;
      }

      axisRef.current =
        Math.abs(dx) > Math.abs(dy)
          ? "horizontal"
          : "vertical";

      if (axisRef.current === "horizontal") {
        setIsDragging(true);
      }
    }

    if (axisRef.current !== "horizontal") return;

    const clamped = dx > 0 ? rubberBand(dx) : 0;
    setDragX(clamped);

    if (
      !firedRef.current &&
      clamped >= SWIPE_TRIGGER_PX
    ) {
      firedRef.current = true;

      if (
        typeof navigator !== "undefined" &&
        navigator.vibrate
      ) {
        try {
          navigator.vibrate(15);
        } catch {
          // Ignore unsupported vibration APIs.
        }
      }
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (axisRef.current === "horizontal") {
      clickSuppressedRef.current =
        dragX > SWIPE_MIN_PX;

      if (firedRef.current && onSwipeReply) {
        onSwipeReply(message);
      }
    }

    resetSwipe();
  }, [dragX, message, onSwipeReply, resetSwipe]);

  const handleClick = useCallback(() => {
    if (clickSuppressedRef.current) {
      clickSuppressedRef.current = false;
      return;
    }

    if (
      message.image &&
      !isStickerImage(message.image) &&
      onImageClick
    ) {
      onImageClick(message.image);
      return;
    }

    // Tapping a celebration bubble again replays the chat-wide confetti
    // burst — the bubble's own confetti corners never stop, but the big
    // room-filling burst is a one-off, so this is how you bring it back
    // without having to resend the message.
    if (effect === "celebration" && onCelebrationReplay) {
      onCelebrationReplay(message);
    }
  }, [message, onImageClick, effect, onCelebrationReplay]);

  const replyIconProgress = Math.min(
    dragX / SWIPE_TRIGGER_PX,
    1
  );

  const fireActive = effect === "fire";
  const loveActive = effect === "love";
  const celebrationActive = effect === "celebration";
  const giftActive = effect === "gift";
  const skinActive = isSkinEffect(effect);

  return (
    <div
      className={`chat ${
        isSelf ? "chat-end" : "chat-start"
      } group relative`}
    >
      <div className="chat-header flex gap-2 text-[10px] opacity-60">
        {formatMessageTime(message.createdAt)}

        <button
          type="button"
          onClick={() => onDelete?.(message._id)}
          className="opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="Delete message"
        >
          <Trash2 size={12} />
        </button>
      </div>

      <div
        className="absolute top-1/2 left-0 -translate-y-1/2 flex items-center justify-center w-9 h-9 rounded-full bg-base-300 pointer-events-none"
        style={{
          opacity:
            dragX > SWIPE_MIN_PX
              ? replyIconProgress
              : 0,
          transform: `translateY(-50%) scale(${0.6 + replyIconProgress * 0.4})`,
          transition: isDragging
            ? "none"
            : "opacity 150ms ease, transform 150ms ease",
        }}
      >
        <Reply size={16} className="opacity-70" />
      </div>

      <div
        className={`chat-bubble max-w-[75%] cursor-pointer relative message-bubble ${
          skinActive ? effectBubbleClass(effect) : ""
        }`}
        style={{
          transform: `translateX(${dragX}px)`,
          transition: isDragging
            ? "none"
            : "transform 220ms cubic-bezier(0.34, 1.3, 0.64, 1)",
          overflow: "visible",
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={resetSwipe}
        onClick={handleClick}
      >
        {fireActive ? (
          <FireEffect>
            <MessageContent
              message={message}
              media={media}
              isSelf={isSelf}
              onImageClick={onImageClick}
            />
          </FireEffect>
        ) : loveActive ? (
          <LoveEffect>
            <MessageContent
              message={message}
              media={media}
              isSelf={isSelf}
              onImageClick={onImageClick}
            />
          </LoveEffect>
        ) : celebrationActive ? (
          <CelebrationEffect>
            <MessageContent
              message={message}
              media={media}
              isSelf={isSelf}
              onImageClick={onImageClick}
            />
          </CelebrationEffect>
        ) : giftActive ? (
          <GiftEffect messageId={message._id}>
            <MessageContent
              message={message}
              media={media}
              isSelf={isSelf}
              onImageClick={onImageClick}
            />
          </GiftEffect>
        ) : (
          <MessageContent
            message={message}
            media={media}
            isSelf={isSelf}
            onImageClick={onImageClick}
          />
        )}
      </div>
    </div>
  );
});

export default MessageBubble;
