import { useRef, useState, useCallback, useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import { Image, Send, Mic, Square, X, Smile } from "lucide-react";
import toast from "react-hot-toast";
import StickerPicker from "./StickerPicker";
import { axiosInstance } from "../lib/axios";

const blobToBase64 = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

const isStickerImage = (img) => img?.startsWith("data:image/webp");

const BOX_WIDTH = 350;
const BOX_HEIGHT = 140;
const MIN_SCALE = 0.7;
const MAX_SCALE = 1.6;
// How far (px) the pointer has to move before a press counts as a
// drag instead of a tap. Below this, buttons click and the textarea
// focuses normally; above it, the whole widget moves. The icon
// buttons (mic/image/smile/send) have no padding around them, so
// ordinary click wobble on a small target needs some headroom or it
// keeps getting misread as a drag — which silently eats the click.
const DRAG_THRESHOLD = 10;

const clampScale = (s) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, s));
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

const MessageInput = () => {
  const { sendMessage, replyTo, clearReplyTo, sendTyping } = useChatStore();

  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [showStickerPicker, setShowStickerPicker] = useState(false);

  // ================= CLOUDINARY STICKERS =================
  const [stickers, setStickers] = useState([]);
  const [stickersLoading, setStickersLoading] = useState(false);
  const stickersFetchedRef = useRef(false);

  // force=true bypasses the cache (used after upload/delete). Otherwise
  // stickers are only fetched once per session — opening the picker
  // again just shows what's already in state instantly.
  const fetchStickers = async (force = false) => {
    if (stickersFetchedRef.current && !force) return;
    setStickersLoading(true);
    try {
      const res = await axiosInstance.get("/upload/stickers");
      setStickers(res.data.stickers || []);
      stickersFetchedRef.current = true;
    } catch {
      toast.error("Failed to load stickers");
    } finally {
      setStickersLoading(false);
    }
  };

  // ================= POSITION / SCALE (POINTER EVENTS) =================
  // Dragging can start from ANYWHERE on the widget, including on top
  // of the textarea or the buttons — there's no "closest(button) ?
  // bail" gate anymore. Instead every pointerdown is a *candidate*
  // drag: we only commit to dragging once the pointer has moved past
  // DRAG_THRESHOLD px. A press that never moves that far is left
  // completely alone (no preventDefault, no capture-driven side
  // effects) so it plays, click, and focus fire exactly like normal.
  // That's what makes it "work anywhere" instead of only in the thin
  // gaps between controls, which is what made it feel inaccurate.
  const [position, setPosition] = useState({ top: 100, left: 50 });
  const [dragging, setDragging] = useState(false);
  const [scale, setScale] = useState(1);

  const positionRef = useRef(position);
  const scaleRef = useRef(scale);
  const draggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const pointersRef = useRef(new Map()); // pointerId -> {x, y}
  const candidateRef = useRef(null); // {pointerId, startX, startY} while below threshold
  const suppressClickRef = useRef(false); // eats the click that follows a real drag
  const pinchStartDistRef = useRef(null);
  const pinchStartScaleRef = useRef(1);
  const rafRef = useRef(null);
  const pendingPosRef = useRef(null);

  const containerRef = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // ================= IMAGE =================
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) {
      toast.error("Select a valid image");
      return;
    }

    setImageFile(file);

    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  // ================= AUDIO =================
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size) audioChunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch {
      toast.error("Microphone permission denied");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  // ================= SEND MESSAGE =================
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() && !imagePreview && !audioBlob) return;

    try {
      let imageUrl = null;
      let audioUrl = null;

      if (imagePreview && !isStickerImage(imagePreview)) {
        const imgRes = await axiosInstance.post("/upload/image", {
          image: imagePreview,
        });
        imageUrl = imgRes.data.url;
      }

      if (audioBlob) {
        const audioBase64 = await blobToBase64(audioBlob);
        const audioRes = await axiosInstance.post("/upload/audio", {
          audio: audioBase64,
        });
        audioUrl = audioRes.data.url;
      }

      setText("");
      setImagePreview(null);
      setImageFile(null);
      setAudioBlob(null);
      clearReplyTo();

      await sendMessage({
        text: text.trim(),
        image: imageUrl || null,
        stickers: [],
        audio: audioUrl,
        replyTo: replyTo
          ? {
              _id: replyTo._id,
              text: replyTo.text || null,
              image: replyTo.image || null,
              audio: replyTo.audio || null,
              stickers: replyTo.stickers || null,
            }
          : null,
      });

      requestAnimationFrame(() => {
        textareaRef.current?.focus();
      });
    } catch (err) {
      console.error("Failed to send message:", err);
      toast.error("Failed to send message");
    }
  };

  // ================= STICKER SEND =================
  const handleStickerSend = async (url) => {
    try {
      await sendMessage({
        text: "",
        image: null,
        audio: null,
        stickers: [url],
        replyTo: replyTo
          ? {
              _id: replyTo._id,
              text: replyTo.text || null,
              image: replyTo.image || null,
              audio: replyTo.audio || null,
              stickers: replyTo.stickers || null,
            }
          : null,
      });

      clearReplyTo();
      setShowStickerPicker(false);
    } catch {
      toast.error("Failed to send sticker");
    }
  };

  // ================= AUTOGROW =================
  useEffect(() => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = "auto";
    textareaRef.current.style.height =
      Math.min(textareaRef.current.scrollHeight, 140) + "px";
  }, [text]);

  // ================= POSITION HELPERS =================
  const clampPosition = useCallback((pos) => {
    const vv = window.visualViewport;
    const viewportLeft = vv?.offsetLeft ?? 0;
    const viewportTop = vv?.offsetTop ?? 0;
    const vw = vv?.width ?? window.innerWidth;
    const vh = vv?.height ?? window.innerHeight;
    const currentScale = scaleRef.current;

    const maxLeft = viewportLeft + vw - BOX_WIDTH * currentScale;
    const maxTop = viewportTop + vh - BOX_HEIGHT * currentScale;

    return {
      left: Math.min(Math.max(viewportLeft, pos.left), Math.max(viewportLeft, maxLeft)),
      top: Math.min(Math.max(viewportTop, pos.top), Math.max(viewportTop, maxTop)),
    };
  }, []);

  const applyTransform = (pos, currentScale) => {
    const el = containerRef.current;
    if (el) {
      el.style.transform = `translate3d(${pos.left}px, ${pos.top}px, 0) scale(${currentScale})`;
    }
  };

  const applyPositionToDom = (pos) => {
    positionRef.current = pos;
    applyTransform(pos, scaleRef.current);
  };

  const scheduleDragPosition = (rawPos) => {
    pendingPosRef.current = clampPosition(rawPos);

    if (rafRef.current !== null) return;

    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      if (pendingPosRef.current) {
        applyPositionToDom(pendingPosRef.current);
      }
    });
  };

  const commitPosition = () => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    setPosition(positionRef.current);
  };

  // ================= POINTER DRAG / PINCH =================
  const beginDrag = (x, y, pointerId) => {
    // Capture is taken lazily, only once we know this is a real drag
    // (not on every pointerdown). Taking it eagerly on every press was
    // what made buttons feel less responsive — some browsers skip the
    // native hover/active feedback on an element once its pointer is
    // captured, even for a press that never moved.
    if (pointerId != null) containerRef.current?.setPointerCapture?.(pointerId);
    draggingRef.current = true;
    setDragging(true);
    dragStartRef.current = {
      x: x - positionRef.current.left,
      y: y - positionRef.current.top,
    };
  };

  const onPointerDown = (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;

    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointersRef.current.size === 2) {
      // second finger down -> this is a pinch, not a tap/drag
      candidateRef.current = null;
      containerRef.current?.setPointerCapture?.(e.pointerId);
      const [p1, p2] = [...pointersRef.current.values()];
      pinchStartDistRef.current = distance(p1, p2);
      pinchStartScaleRef.current = scaleRef.current;
      draggingRef.current = false;
      setDragging(false);
      return;
    }

    if (pointersRef.current.size === 1) {
      // don't commit to dragging yet — wait for real movement so a
      // plain tap/click on a button or the textarea still works.
      candidateRef.current = {
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
      };
    }
  };

  const onPointerMove = (e) => {
    if (!pointersRef.current.has(e.pointerId)) return;
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointersRef.current.size === 2) {
      const [p1, p2] = [...pointersRef.current.values()];
      if (pinchStartDistRef.current) {
        const ratio = distance(p1, p2) / pinchStartDistRef.current;
        const newScale = clampScale(pinchStartScaleRef.current * ratio);
        scaleRef.current = newScale;
        setScale(newScale);
        applyTransform(positionRef.current, newScale);
      }
      e.preventDefault();
      return;
    }

    // still deciding whether this press is a tap or a drag
    const cand = candidateRef.current;
    if (cand && cand.pointerId === e.pointerId && !draggingRef.current) {
      const moved = distance(
        { x: cand.startX, y: cand.startY },
        { x: e.clientX, y: e.clientY }
      );
      if (moved < DRAG_THRESHOLD) return;

      // threshold crossed -> this is a drag. Start it from the
      // ORIGINAL press point so the widget doesn't jump to catch up.
      suppressClickRef.current = true;
      beginDrag(cand.startX, cand.startY, e.pointerId);
    }

    if (!draggingRef.current) return;
    scheduleDragPosition({
      left: e.clientX - dragStartRef.current.x,
      top: e.clientY - dragStartRef.current.y,
    });
    e.preventDefault();
  };

  const endPointer = (e) => {
    pointersRef.current.delete(e.pointerId);
    try {
      containerRef.current?.releasePointerCapture?.(e.pointerId);
    } catch {
      /* no-op: pointer capture may already be released by the browser */
    }

    if (candidateRef.current?.pointerId === e.pointerId) {
      candidateRef.current = null;
    }

    if (pointersRef.current.size >= 2) return; // still pinching

    pinchStartDistRef.current = null;

    if (pointersRef.current.size === 1) {
      // one finger lifted mid-pinch — resume a normal drag with
      // whichever pointer is still down.
      const [[remainingId, remaining]] = [...pointersRef.current.entries()];
      beginDrag(remaining.x, remaining.y, remainingId);
      return;
    }

    if (draggingRef.current) {
      draggingRef.current = false;
      setDragging(false);
      commitPosition();
    }
  };

  // Swallow the single click/tap that a browser fires right after a
  // real drag ends over a button (mic/image/smile/send/X) — otherwise
  // finishing a drag on top of a control would also trigger it.
  const onClickCapture = (e) => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      e.preventDefault();
      e.stopPropagation();
    }
  };

  // ================= WHEEL (CTRL) SCALE =================
  const onWheel = (e) => {
    if (!e.ctrlKey) return;
    e.preventDefault();

    const el = containerRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const centerX = e.clientX - rect.left;
    const centerY = e.clientY - rect.top;

    const oldScale = scaleRef.current;
    const newScale = clampScale(oldScale - e.deltaY * 0.001);

    const current = positionRef.current;
    const offsetX = (centerX / oldScale) * (newScale - oldScale);
    const offsetY = (centerY / oldScale) * (newScale - oldScale);

    scaleRef.current = newScale;
    setScale(newScale);

    const clamped = clampPosition({
      left: current.left - offsetX,
      top: current.top - offsetY,
    });

    applyPositionToDom(clamped);
    setPosition(clamped);
  };

  // wheel needs { passive: false } to preventDefault, which React's
  // synthetic onWheel prop can't guarantee, so it's attached manually.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  useEffect(() => {
    positionRef.current = position;
  }, [position]);

  useEffect(() => {
    scaleRef.current = scale;
  }, [scale]);

  // ================= UI =================
  return (
    <div
      ref={containerRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: 9999,
        width: `${BOX_WIDTH}px`,
        transform: `translate3d(${position.left}px, ${position.top}px, 0) scale(${scale})`,
        transformOrigin: "top left",
        touchAction: "none",
        willChange: dragging ? "transform" : "auto",
        userSelect: dragging ? "none" : "auto",
        WebkitUserSelect: dragging ? "none" : "auto",
        // NOTE: deliberately no `contain: layout paint` here — it
        // isolates the subtree for perf, but it also clips any child
        // that paints outside this box, which was cropping the sticker
        // picker popup (it renders taller than the pill itself via
        // `absolute bottom-16`). translate3d already keeps the drag on
        // the compositor without needing containment.
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endPointer}
      onPointerCancel={endPointer}
      onClickCapture={onClickCapture}
      className={dragging ? "cursor-grabbing" : "cursor-grab"}
    >
      <div className="flex flex-col w-full gap-1">

        {/* ================= REPLY ================= */}
        {replyTo && (
          <div className="bg-gray-200 px-3 py-1 rounded-lg flex justify-between items-center">
            <span className="text-sm truncate max-w-[80%]">
              Replying: {replyTo.text || "Media"}
            </span>
            <button type="button" onClick={clearReplyTo}>
              <X size={16} />
            </button>
          </div>
        )}

        {/* ================= IMAGE PREVIEW ================= */}
        {imagePreview && (
          <div className="flex items-center gap-2 mb-1">
            <img
              src={imagePreview}
              className="w-20 h-20 rounded-md object-cover"
              alt="preview"
            />
            <button
              type="button"
              onClick={() => {
                setImagePreview(null);
                setImageFile(null);
              }}
              className="text-red-500 text-sm"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* ================= FORM ================= */}
        <form
          onSubmit={handleSendMessage}
          className="flex items-center gap-2 bg-base-200 rounded-full shadow-lg px-4 py-3 w-full"
          style={{
            pointerEvents: dragging ? "none" : "auto",
            opacity: dragging ? 0.85 : 1,
            transition: "opacity 120ms ease-out",
          }}
        >
          {/* MIC */}
          <button
            type="button"
            onClick={() => {
              isRecording ? stopRecording() : startRecording();
            }}
          >
            {isRecording ? <Square size={18} /> : <Mic size={18} />}
          </button>

          {/* TEXT */}
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              sendTyping?.();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage(e);
              }
            }}
            placeholder="Type a message"
            rows={1}
            className="flex-1 bg-base-100 rounded-full px-4 py-3 resize-none focus:outline-none"
          />

          {/* IMAGE INPUT */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={handleImageChange}
          />

          <button
            type="button"
            onClick={() => {
              fileInputRef.current?.click();
            }}
          >
            <Image size={18} />
          </button>

          {/* STICKERS */}
          <button
            type="button"
            onClick={() => {
              // open immediately — don't wait on the network first,
              // that's what made this feel slow to "activate". The
              // picker shows a loading state itself while stickers
              // load in behind it.
              setShowStickerPicker((p) => !p);
              fetchStickers();
            }}
          >
            <Smile size={18} />
          </button>

          {/* SEND */}
          <button type="submit">
            <Send size={18} />
          </button>

          {/* STICKER PICKER */}
          {showStickerPicker && (
            <StickerPicker
              stickers={stickers}
              loading={stickersLoading}
              onStickerSelect={handleStickerSend}
              onClose={() => setShowStickerPicker(false)}
              refresh={() => fetchStickers(true)}
            />
          )}
        </form>
      </div>
    </div>
  );
};

export default MessageInput;
