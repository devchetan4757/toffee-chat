import { useRef, useState, useEffect, useCallback } from "react";
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

  const fetchStickers = async () => {
    try {
      const res = await axiosInstance.get("/upload/stickers");
      setStickers(res.data.stickers || []);
    } catch {
      toast.error("Failed to load stickers");
    }
  };

  // ================= POSITION / SCALE (SMOOTH DRAG) =================
  const [position, setPosition] = useState({ top: 100, left: 50 });
  const [dragging, setDragging] = useState(false);
  const [scale, setScale] = useState(1);

  // Refs mirror the current values so drag handlers never read stale
  // closures and never need to be re-attached on every render.
  const positionRef = useRef(position);
  const scaleRef = useRef(scale);
  const draggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const lastTouchDistance = useRef(null);
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

      // Only upload real images (stickers are already Cloudinary URLs).
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

      // Clear the composer immediately so the UI feels instant — the
      // message itself is appended to the chat as soon as the store
      // resolves (real-time echo happens in useChatStore/socket layer).
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

  // ================= INTERACTIVE ELEMENT GUARD =================
  /*
   * This is the fix for "buttons don't work / drag feels broken":
   * previously ANY mousedown/touchstart inside the pill — including on
   * Send, Mic, Image, Smile, and the textarea itself — started a drag.
   * On mobile a normal tap always has a tiny bit of finger movement, so
   * taps kept getting swallowed as drags instead of clicks.
   *
   * Now dragging can start from anywhere on the component (the pill
   * background, the gaps around it, etc.) — just never from a control
   * the user is trying to actually use (buttons, textarea, inputs, etc,
   * marked via the selector below or a `data-no-drag` attribute).
   */
  const isInteractiveElement = (target) => {
    if (!target) return false;
    return Boolean(
      target.closest(
        "button, textarea, input, select, option, a, [role='button'], [data-no-drag]"
      )
    );
  };

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

  // Applies position straight to the DOM (no re-render) for a
  // perfectly smooth drag, then schedules a single React state
  // commit per animation frame so the rest of the UI stays in sync.
  //
  // Movement goes through `transform: translate3d(...) scale(...)`
  // rather than `top`/`left`. Changing top/left on a fixed element
  // forces the browser to recompute layout every single frame; a
  // transform change can be handled entirely on the compositor
  // thread (no layout, no paint), which is what actually makes the
  // drag feel smooth — including after this ships to production.
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

  // ================= MOUSE DRAG =================
  const onMouseDown = (e) => {
    if (isInteractiveElement(e.target)) return;

    draggingRef.current = true;
    setDragging(true);
    dragStartRef.current = {
      x: e.clientX - positionRef.current.left,
      y: e.clientY - positionRef.current.top,
    };
  };

  const onMouseMove = (e) => {
    if (!draggingRef.current) return;
    scheduleDragPosition({
      left: e.clientX - dragStartRef.current.x,
      top: e.clientY - dragStartRef.current.y,
    });
  };

  const onMouseUp = () => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    setDragging(false);
    commitPosition();
  };

  // ================= TOUCH DRAG / PINCH =================
  const getDistance = (t1, t2) =>
    Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);

  const onTouchStart = (e) => {
    if (isInteractiveElement(e.target)) return;

    if (e.touches.length === 2) {
      lastTouchDistance.current = getDistance(e.touches[0], e.touches[1]);
      return;
    }

    draggingRef.current = true;
    setDragging(true);
    const t = e.touches[0];
    dragStartRef.current = {
      x: t.clientX - positionRef.current.left,
      y: t.clientY - positionRef.current.top,
    };
  };

  const onTouchMove = (e) => {
    if (e.touches.length === 2 && lastTouchDistance.current) {
      const newDist = getDistance(e.touches[0], e.touches[1]);
      const diff = newDist - lastTouchDistance.current;
      const oldScale = scaleRef.current;
      const newScale = Math.min(1.6, Math.max(0.7, oldScale + diff * 0.002));

      scaleRef.current = newScale;
      setScale(newScale);
      applyTransform(positionRef.current, newScale);

      lastTouchDistance.current = newDist;
      e.preventDefault();
      return;
    }

    if (!draggingRef.current || e.touches.length !== 1) return;

    const t = e.touches[0];
    scheduleDragPosition({
      left: t.clientX - dragStartRef.current.x,
      top: t.clientY - dragStartRef.current.y,
    });

    e.preventDefault();
  };

  const onTouchEnd = () => {
    if (draggingRef.current) {
      draggingRef.current = false;
      setDragging(false);
      commitPosition();
    }
    lastTouchDistance.current = null;
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
    const newScale = Math.min(1.6, Math.max(0.7, oldScale - e.deltaY * 0.001));

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

  // ================= EVENTS (attached once) =================
  useEffect(() => {
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd);
    window.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("wheel", onWheel);

      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep refs in sync if position/scale ever change from outside a drag
  // (e.g. programmatically), so drag math never uses a stale value.
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
        // All movement and scaling happens through this single
        // transform (translate3d + scale) instead of top/left, so the
        // browser can composite it on the GPU without recalculating
        // layout on every frame — see applyTransform().
        transform: `translate3d(${position.left}px, ${position.top}px, 0) scale(${scale})`,
        transformOrigin: "top left",
        touchAction: "none",
        willChange: dragging ? "transform" : "auto",
        userSelect: dragging ? "none" : "auto",
        WebkitUserSelect: dragging ? "none" : "auto",
        // Isolates this subtree from the rest of the page's layout/paint
        // so the browser never has to consider outside elements while
        // the transform is being updated every frame during a drag.
        contain: "layout paint",
      }}
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
      className={dragging ? "cursor-grabbing" : "cursor-grab"}
    >
      <div className="flex flex-col w-full gap-1">

        {/* ================= REPLY ================= */}
        {replyTo && (
          <div
            data-no-drag
            className="bg-gray-200 px-3 py-1 rounded-lg flex justify-between items-center"
          >
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
          <div data-no-drag className="flex items-center gap-2 mb-1">
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

        {/* ================= FORM =================
            While actively dragging, the form's controls are switched
            to pointer-events: none. This isn't just cosmetic — it
            means the browser skips hit-testing, hover/active style
            recalculation, and focus handling for every button and the
            textarea on every pointermove during the drag, so the only
            work left per frame is the transform write in
            applyTransform(). The moment the drag ends (onMouseUp /
            onTouchEnd -> setDragging(false)), controls go straight
            back to being fully interactive. */}
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
            onClick={(e) => {
              e.stopPropagation();
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
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
          >
            <Image size={18} />
          </button>

          {/* STICKERS */}
          <button
            type="button"
            onClick={async (e) => {
              e.stopPropagation();
              if (!showStickerPicker) await fetchStickers();
              setShowStickerPicker((p) => !p);
            }}
          >
            <Smile size={18} />
          </button>

          {/* SEND */}
          <button
            type="submit"
            onClick={(e) => {
              // Prevent the click from bubbling into the draggable container.
              e.stopPropagation();
            }}
          >
            <Send size={18} />
          </button>

          {/* STICKER PICKER */}
          {showStickerPicker && (
            <StickerPicker
              stickers={stickers}
              onStickerSelect={handleStickerSend}
              onClose={() => setShowStickerPicker(false)}
              refresh={fetchStickers}
            />
          )}
        </form>
      </div>
    </div>
  );
};

export default MessageInput;
