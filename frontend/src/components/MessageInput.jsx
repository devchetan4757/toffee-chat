import { useRef, useState, useEffect } from "react";
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

const isStickerImage = (img) =>
  img?.startsWith("data:image/webp");

const MessageInput = () => {
  const {
    sendMessage,
    replyTo,
    clearReplyTo,
    sendTyping,
  } = useChatStore();

  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [showStickerPicker, setShowStickerPicker] =
    useState(false);

  // ================= CLOUDINARY STICKERS =================
  const [stickers, setStickers] = useState([]);

  const fetchStickers = async () => {
    try {
      const res = await axiosInstance.get(
        "/upload/stickers"
      );

      setStickers(res.data.stickers || []);
    } catch {
      toast.error("Failed to load stickers");
    }
  };

  // ================= POSITION / SCALE =================
  const [position, setPosition] = useState({
    top: 100,
    left: 50,
  });

  const [dragging, setDragging] = useState(false);
  const [scale, setScale] = useState(1);

  const inputContainerRef = useRef(null);

  const positionRef = useRef({
    top: 100,
    left: 50,
  });

  const scaleRef = useRef(1);

  const lastTouchDistance = useRef(null);

  const dragStartRef = useRef({
    x: 0,
    y: 0,
  });

  const dragRafRef = useRef(null);

  const pendingPositionRef = useRef(null);

  // ================= OTHER REFS =================
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // ================= IMAGE =================
  const handleImageChange = (e) => {
    const file = e.target.files[0];

    if (
      !file ||
      !file.type.startsWith("image/")
    ) {
      toast.error("Select a valid image");
      return;
    }

    setImageFile(file);

    const reader = new FileReader();

    reader.onloadend = () => {
      setImagePreview(reader.result);
    };

    reader.readAsDataURL(file);
  };

  // ================= AUDIO =================
  const startRecording = async () => {
    try {
      const stream =
        await navigator.mediaDevices.getUserMedia({
          audio: true,
        });

      mediaRecorderRef.current =
        new MediaRecorder(stream);

      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (
        e
      ) => {
        if (e.data.size) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(
          audioChunksRef.current,
          {
            type: "audio/webm",
          }
        );

        setAudioBlob(blob);

        stream.getTracks().forEach((track) => {
          track.stop();
        });
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

    if (
      !text.trim() &&
      !imagePreview &&
      !audioBlob
    ) {
      return;
    }

    try {
      let imageUrl = null;
      let audioUrl = null;

      // Upload only real images.
      if (
        imagePreview &&
        !isStickerImage(imagePreview)
      ) {
        const imgRes =
          await axiosInstance.post(
            "/upload/image",
            {
              image: imagePreview,
            }
          );

        imageUrl = imgRes.data.url;
      }

      // Upload audio.
      if (audioBlob) {
        const audioBase64 =
          await blobToBase64(audioBlob);

        const audioRes =
          await axiosInstance.post(
            "/upload/audio",
            {
              audio: audioBase64,
            }
          );

        audioUrl = audioRes.data.url;
      }

      await sendMessage({
        text: text.trim(),
        image: imageUrl || null,

        // Stickers are sent only through picker.
        stickers: [],

        audio: audioUrl,

        replyTo: replyTo
          ? {
              _id: replyTo._id,
              text: replyTo.text || null,
              image: replyTo.image || null,
              audio: replyTo.audio || null,
              stickers:
                replyTo.stickers || null,
            }
          : null,
      });

      setText("");
      setImagePreview(null);
      setImageFile(null);
      setAudioBlob(null);

      clearReplyTo();

      requestAnimationFrame(() => {
        textareaRef.current?.focus();
      });
    } catch (err) {
      console.error(
        "Failed to send message:",
        err
      );

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
              stickers:
                replyTo.stickers || null,
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

    textareaRef.current.style.height =
      "auto";

    textareaRef.current.style.height =
      Math.min(
        textareaRef.current.scrollHeight,
        140
      ) + "px";
  }, [text]);

  // ================= POSITION HELPERS =================
  const clampPosition = (
    pos,
    width = 350,
    height = 140
  ) => {
    const vv = window.visualViewport;

    const viewportLeft =
      vv?.offsetLeft ?? 0;

    const viewportTop =
      vv?.offsetTop ?? 0;

    const vw =
      vv?.width ?? window.innerWidth;

    const vh =
      vv?.height ?? window.innerHeight;

    const currentScale =
      scaleRef.current;

    const maxLeft =
      viewportLeft +
      vw -
      width * currentScale;

    const maxTop =
      viewportTop +
      vh -
      height * currentScale;

    return {
      left: Math.min(
        Math.max(viewportLeft, pos.left),
        Math.max(
          viewportLeft,
          maxLeft
        )
      ),

      top: Math.min(
        Math.max(viewportTop, pos.top),
        Math.max(
          viewportTop,
          maxTop
        )
      ),
    };
  };

  const applyPositionImmediately = (
    nextPosition
  ) => {
    const clamped =
      clampPosition(nextPosition);

    positionRef.current = clamped;

    const element =
      inputContainerRef.current;

    if (!element) return;

    element.style.left =
      `${clamped.left}px`;

    element.style.top =
      `${clamped.top}px`;
  };

  /*
   * Updates the DOM directly during dragging.
   * React state is NOT updated for every movement.
   */
  const scheduleDragPosition = (
    nextPosition
  ) => {
    pendingPositionRef.current =
      clampPosition(nextPosition);

    if (dragRafRef.current !== null) {
      return;
    }

    dragRafRef.current =
      requestAnimationFrame(() => {
        dragRafRef.current = null;

        const next =
          pendingPositionRef.current;

        if (!next) return;

        positionRef.current = next;

        const element =
          inputContainerRef.current;

        if (element) {
          element.style.left =
            `${next.left}px`;

          element.style.top =
            `${next.top}px`;
        }
      });
  };

  const commitPosition = () => {
    if (dragRafRef.current !== null) {
      cancelAnimationFrame(
        dragRafRef.current
      );

      dragRafRef.current = null;
    }

    const next =
      pendingPositionRef.current ||
      positionRef.current;

    const clamped =
      clampPosition(next);

    positionRef.current = clamped;
    pendingPositionRef.current =
      clamped;

    setPosition(clamped);

    const element =
      inputContainerRef.current;

    if (element) {
      element.style.left =
        `${clamped.left}px`;

      element.style.top =
        `${clamped.top}px`;
    }
  };

  // ================= MOUSE DRAG =================
  const onMouseDown = (e) => {
    if (e.button !== 0) return;

    const current =
      positionRef.current;

    setDragging(true);

    dragStartRef.current = {
      x: e.clientX - current.left,
      y: e.clientY - current.top,
    };
  };

  const onMouseMove = (e) => {
    if (!dragging) return;

    scheduleDragPosition({
      left:
        e.clientX -
        dragStartRef.current.x,

      top:
        e.clientY -
        dragStartRef.current.y,
    });
  };

  const onMouseUp = () => {
    if (!dragging) return;

    setDragging(false);
    commitPosition();
  };

  // ================= TOUCH HELPERS =================
  const getDistance = (t1, t2) =>
    Math.hypot(
      t2.clientX - t1.clientX,
      t2.clientY - t1.clientY
    );

  // ================= TOUCH START =================
  const onTouchStart = (e) => {
    if (e.touches.length === 2) {
      lastTouchDistance.current =
        getDistance(
          e.touches[0],
          e.touches[1]
        );

      return;
    }

    if (e.touches.length !== 1) return;

    const t = e.touches[0];

    const current =
      positionRef.current;

    setDragging(true);

    dragStartRef.current = {
      x: t.clientX - current.left,
      y: t.clientY - current.top,
    };
  };

  // ================= TOUCH MOVE =================
  const onTouchMove = (e) => {
    /*
     * Pinch-to-scale.
     */
    if (
      e.touches.length === 2 &&
      lastTouchDistance.current !== null
    ) {
      const newDist =
        getDistance(
          e.touches[0],
          e.touches[1]
        );

      const diff =
        newDist -
        lastTouchDistance.current;

      const oldScale =
        scaleRef.current;

      const newScale = Math.min(
        1.6,
        Math.max(
          0.7,
          oldScale + diff * 0.002
        )
      );

      scaleRef.current =
        newScale;

      setScale(newScale);

      const element =
        inputContainerRef.current;

      if (element) {
        element.style.transform =
          `scale(${newScale})`;
      }

      const current =
        positionRef.current;

      const centerX =
        (e.touches[0].clientX +
          e.touches[1].clientX) /
        2;

      const centerY =
        (e.touches[0].clientY +
          e.touches[1].clientY) /
        2;

      const rect =
        element?.getBoundingClientRect();

      if (rect) {
        const localX =
          centerX - rect.left;

        const localY =
          centerY - rect.top;

        const offsetX =
          (localX / oldScale) *
          (newScale - oldScale);

        const offsetY =
          (localY / oldScale) *
          (newScale - oldScale);

        applyPositionImmediately({
          left:
            current.left -
            offsetX,

          top:
            current.top -
            offsetY,
        });
      }

      lastTouchDistance.current =
        newDist;

      e.preventDefault();

      return;
    }

    /*
     * Normal one-finger dragging.
     */
    if (
      !dragging ||
      e.touches.length !== 1
    ) {
      return;
    }

    const t = e.touches[0];

    scheduleDragPosition({
      left:
        t.clientX -
        dragStartRef.current.x,

      top:
        t.clientY -
        dragStartRef.current.y,
    });

    e.preventDefault();
  };

  // ================= TOUCH END =================
  const onTouchEnd = () => {
    if (dragging) {
      setDragging(false);
      commitPosition();
    }

    lastTouchDistance.current =
      null;
  };

  // ================= WHEEL SCALE =================
  const onWheel = (e) => {
    if (!e.ctrlKey) return;

    e.preventDefault();

    const rect =
      e.currentTarget.getBoundingClientRect();

    const centerX =
      e.clientX - rect.left;

    const centerY =
      e.clientY - rect.top;

    const oldScale =
      scaleRef.current;

    const newScale = Math.min(
      1.6,
      Math.max(
        0.7,
        oldScale -
          e.deltaY * 0.001
      )
    );

    scaleRef.current =
      newScale;

    setScale(newScale);

    const current =
      positionRef.current;

    const offsetX =
      (centerX / oldScale) *
      (newScale - oldScale);

    const offsetY =
      (centerY / oldScale) *
      (newScale - oldScale);

    applyPositionImmediately({
      left:
        current.left - offsetX,

      top:
        current.top - offsetY,
    });
  };

  // ================= GLOBAL POINTER EVENTS =================
  useEffect(() => {
    window.addEventListener(
      "mousemove",
      onMouseMove
    );

    window.addEventListener(
      "mouseup",
      onMouseUp
    );

    window.addEventListener(
      "touchmove",
      onTouchMove,
      { passive: false }
    );

    window.addEventListener(
      "touchend",
      onTouchEnd
    );

    window.addEventListener(
      "wheel",
      onWheel,
      { passive: false }
    );

    return () => {
      window.removeEventListener(
        "mousemove",
        onMouseMove
      );

      window.removeEventListener(
        "mouseup",
        onMouseUp
      );

      window.removeEventListener(
        "touchmove",
        onTouchMove
      );

      window.removeEventListener(
        "touchend",
        onTouchEnd
      );

      window.removeEventListener(
        "wheel",
        onWheel
      );

      if (
        dragRafRef.current !== null
      ) {
        cancelAnimationFrame(
          dragRafRef.current
        );
      }
    };
  });

  return (
    <div
      ref={inputContainerRef}
      style={{
        position: "fixed",
        top: position.top,
        left: position.left,
        zIndex: 9999,
        width: "350px",
        transform: `scale(${scale})`,
        transformOrigin: "top left",
        touchAction: "none",

        /*
         * Helps the browser keep movement on the
         * compositor instead of repeatedly laying
         * out the page.
         */
        willChange: dragging
          ? "left, top, transform"
          : "auto",

        userSelect: dragging
          ? "none"
          : "auto",

        WebkitUserSelect: dragging
          ? "none"
          : "auto",
      }}
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
      className={
        dragging
          ? "cursor-grabbing"
          : "cursor-grab"
      }
    >
      <div className="flex flex-col w-full gap-1">

        {/* ================= REPLY ================= */}
        {replyTo && (
          <div className="bg-gray-200 px-3 py-1 rounded-lg flex justify-between items-center">
            <span className="text-sm truncate max-w-[80%]">
              Replying:{" "}
              {replyTo.text || "Media"}
            </span>

            <button
              type="button"
              onClick={clearReplyTo}
            >
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

        {/* ================= MESSAGE FORM ================= */}
        <form
          onSubmit={handleSendMessage}
          className="flex items-center gap-2 bg-base-200 rounded-full shadow-lg px-4 py-3 w-full"
        >
          <button
            type="button"
            onClick={
              isRecording
                ? stopRecording
                : startRecording
            }
          >
            {isRecording ? (
              <Square size={18} />
            ) : (
              <Mic size={18} />
            )}
          </button>

          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) =>
              setText(e.target.value)
            }
            placeholder="Type a message"
            rows={1}
            className="flex-1 bg-base-100 rounded-full px-4 py-3 resize-none focus:outline-none"
          />

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={handleImageChange}
          />

          <button
            type="button"
            onClick={() =>
              fileInputRef.current?.click()
            }
          >
            <Image size={18} />
          </button>

          <button
            type="button"
            onClick={async () => {
              if (!showStickerPicker) {
                await fetchStickers();
              }

              setShowStickerPicker(
                (p) => !p
              );
            }}
          >
            <Smile size={18} />
          </button>

          <button type="submit">
            <Send size={18} />
          </button>

          {showStickerPicker && (
            <StickerPicker
              stickers={stickers}
              onStickerSelect={
                handleStickerSend
              }
              onClose={() =>
                setShowStickerPicker(false)
              }
            />
          )}
        </form>
      </div>
    </div>
  );
};

export default MessageInput;
