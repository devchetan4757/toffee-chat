import { useRef, useState, useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import { Image, Send, Mic, Square, X } from "lucide-react";
import toast from "react-hot-toast";

// Convert audio Blob to Base64
const blobToBase64 = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

const MessageInput = () => {
  const { sendMessage } = useChatStore();

  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [isRecording, setIsRecording] = useState(false);

  // Position & dragging
  const [position, setPosition] = useState({ top: 100, left: 50 });
  const [dragging, setDragging] = useState(false);

  // Scaling
  const [scale, setScale] = useState(1);
  const lastTouchDistance = useRef(null);

  const dragStartRef = useRef({ x: 0, y: 0 });
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  /* ---------------- IMAGE ---------------- */
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith("image/")) {
      toast.error("Select a valid image");
      return;
    }
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  /* ---------------- AUDIO ---------------- */
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

  /* ---------------- SEND ---------------- */
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() && !imagePreview && !audioBlob) return;

    try {
      let audioBase64 = null;
      if (audioBlob) audioBase64 = await blobToBase64(audioBlob);

      await sendMessage({
        text: text.trim(),
        image: imagePreview,
        audio: audioBase64,
      });

      setText("");
      setImagePreview(null);
      setImageFile(null);
      setAudioBlob(null);
    } catch {
      toast.error("Failed to send message");
    }
  };

  /* ---------------- AUTOGROW ---------------- */
  useEffect(() => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = "auto";
    textareaRef.current.style.height =
      Math.min(textareaRef.current.scrollHeight, 140) + "px";
  }, [text]);

  /* ---------------- CLAMP POSITION ---------------- */
  const clampPosition = (pos, width = 350, height = 140) => {
    const vv = window.visualViewport;

    const viewportLeft = vv?.offsetLeft ?? 0;
    const viewportTop = vv?.offsetTop ?? 0;
    const vw = vv?.width ?? window.innerWidth;
    const vh = vv?.height ?? window.innerHeight;

    const maxLeft = viewportLeft + vw - width * scale;
    const maxTop = viewportTop + vh - height * scale;

    return {
      left: Math.min(Math.max(viewportLeft, pos.left), Math.max(viewportLeft, maxLeft)),
      top: Math.min(Math.max(viewportTop, pos.top), Math.max(viewportTop, maxTop)),
    };
  };

  /* ---------------- DRAGGING ---------------- */
  const onMouseDown = (e) => {
    setDragging(true);
    dragStartRef.current = {
      x: e.clientX - position.left,
      y: e.clientY - position.top,
    };
  };

  const onMouseMove = (e) => {
    if (!dragging) return;
    setPosition((pos) =>
      clampPosition({
        left: e.clientX - dragStartRef.current.x,
        top: e.clientY - dragStartRef.current.y,
      })
    );
  };

  const onMouseUp = () => setDragging(false);

  /* ---------------- TOUCH + PINCH ---------------- */
  const getDistance = (t1, t2) =>
    Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);

  const onTouchStart = (e) => {
    if (e.touches.length === 2) {
      lastTouchDistance.current = getDistance(e.touches[0], e.touches[1]);
      return;
    }
    setDragging(true);
    const t = e.touches[0];
    dragStartRef.current = {
      x: t.clientX - position.left,
      y: t.clientY - position.top,
    };
  };

  const onTouchMove = (e) => {
    if (e.touches.length === 2 && lastTouchDistance.current) {
      const newDist = getDistance(e.touches[0], e.touches[1]);
      const diff = newDist - lastTouchDistance.current;

      setScale((prev) => {
        const newScale = Math.min(1.6, Math.max(0.7, prev + diff * 0.002));
        setPosition((pos) => clampPosition(pos));
        lastTouchDistance.current = newDist;
        return newScale;
      });
      e.preventDefault();
      return;
    }

    if (!dragging) return;
    const t = e.touches[0];
    setPosition((pos) =>
      clampPosition({
        left: t.clientX - dragStartRef.current.x,
        top: t.clientY - dragStartRef.current.y,
      })
    );
  };

  const onTouchEnd = () => {
    setDragging(false);
    lastTouchDistance.current = null;
  };

  /* ---------------- DESKTOP ZOOM (CTRL + SCROLL) ---------------- */
  const onWheel = (e) => {
    if (!e.ctrlKey) return;
    e.preventDefault();

    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = e.clientX - rect.left;
    const centerY = e.clientY - rect.top;

    setScale((prev) => {
      const newScale = Math.min(1.6, Math.max(0.7, prev - e.deltaY * 0.001));

      setPosition((pos) => {
        const offsetX = (centerX / prev) * (newScale - prev);
        const offsetY = (centerY / prev) * (newScale - prev);
        return clampPosition({ left: pos.left - offsetX, top: pos.top - offsetY });
      });

      return newScale;
    });
  };

  /* ---------------- KEEP BOX INSIDE VIEWPORT ON MOBILE ZOOM / SCROLL ---------------- */
  useEffect(() => {
    const handleViewportChange = () => {
      setPosition((pos) => clampPosition(pos));
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", handleViewportChange);
      window.visualViewport.addEventListener("scroll", handleViewportChange);
    }

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", handleViewportChange);
        window.visualViewport.removeEventListener("scroll", handleViewportChange);
      }
    };
  }, [scale]);

  /* ---------------- EVENT LISTENERS ---------------- */
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
    };
  });

  return (
    <div
      style={{
        position: "fixed",
        top: position.top,
        left: position.left,
        zIndex: 9999,
        width: "350px",
        transform: `scale(${scale})`,
        transformOrigin: "top left",
        touchAction: "none",
      }}
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
      className="cursor-grab"
    >
      <div className="flex flex-col w-full gap-1">
        {/* AUDIO PREVIEW */}
        {audioBlob && (
          <div className="flex items-center gap-2 mb-1">
            <audio controls src={URL.createObjectURL(audioBlob)} className="flex-1" />
            <button
              type="button"
              onClick={() => setAudioBlob(null)}
              className="btn btn-xs btn-error btn-circle"
            >
              <X size={12} />
            </button>
          </div>
        )}

        {/* IMAGE PREVIEW */}
        {imagePreview && (
          <div className="flex items-center gap-2 mb-1">
            <img
              src={imagePreview}
              alt="Preview"
              className="max-w-[120px] rounded-lg"
            />
            <button
              type="button"
              onClick={() => {
                setImageFile(null);
                setImagePreview(null);
              }}
              className="btn btn-xs btn-error btn-circle"
            >
              <X size={12} />
            </button>
          </div>
        )}

        {/* INPUT FORM */}
        <form
          onSubmit={handleSendMessage}
          className="flex items-center gap-2 bg-base-200 rounded-full shadow-lg px-4 py-3 w-full"
        >
          <button
            type="button"
            onClick={isRecording ? stopRecording : startRecording}
            className={`btn btn-circle btn-sm ${
              isRecording ? "btn-error" : "btn-ghost"
            }`}
          >
            {isRecording ? <Square size={18} /> : <Mic size={18} />}
          </button>

          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message"
            rows={1}
            className="flex-1 bg-base-100 rounded-full px-4 py-3 resize-none focus:outline-none min-h-[48px]"
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
            onClick={() => fileInputRef.current?.click()}
            className="btn btn-circle btn-sm btn-ghost"
          >
            <Image size={18} />
          </button>

          <button
            type="submit"
            className="btn btn-circle btn-sm btn-primary"
            disabled={!text.trim() && !imageFile && !audioBlob}
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default MessageInput;
