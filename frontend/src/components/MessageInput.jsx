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

  // Floating position
  const [position, setPosition] = useState({ top: 100, left: 50 });
  const [dragging, setDragging] = useState(false);
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

  /* ---------------- SEND MESSAGE ---------------- */
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

  /* ---------------- DRAGGING (Mouse + Touch) ---------------- */
  const onMouseDown = (e) => {
    setDragging(true);
    dragStartRef.current = {
      x: e.clientX - position.left,
      y: e.clientY - position.top,
    };
  };

  const onMouseMove = (e) => {
    if (!dragging) return;
    setPosition({
      left: e.clientX - dragStartRef.current.x,
      top: e.clientY - dragStartRef.current.y,
    });
  };

  const onMouseUp = () => setDragging(false);

  const onTouchStart = (e) => {
    setDragging(true);
    const touch = e.touches[0];
    dragStartRef.current = {
      x: touch.clientX - position.left,
      y: touch.clientY - position.top,
    };
  };

  const onTouchMove = (e) => {
    if (!dragging) return;
    const touch = e.touches[0];
    setPosition({
      left: touch.clientX - dragStartRef.current.x,
      top: touch.clientY - dragStartRef.current.y,
    });
  };

  const onTouchEnd = () => setDragging(false);

  useEffect(() => {
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("touchmove", onTouchMove);
    window.addEventListener("touchend", onTouchEnd);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  });

  return (
    <div
      style={{
        position: "fixed",
        top: position.top,
        left: position.left,
        zIndex: 9999,
        width: "250px",
        touchAction: "none", // prevent mobile scrolling while dragging
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
          {/* MIC */}
          <button
            type="button"
            onClick={isRecording ? stopRecording : startRecording}
            className={`btn btn-circle btn-sm ${
              isRecording ? "btn-error" : "btn-ghost"
            }`}
          >
            {isRecording ? <Square size={18} /> : <Mic size={18} />}
          </button>

          {/* TEXT INPUT */}
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message"
            rows={1}
            className="flex-1 bg-base-100 rounded-full px-4 py-3 text-base resize-none focus:outline-none min-h-[48px] sm:min-h-[56px] max-h-36"
          />

          {/* IMAGE */}
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

          {/* SEND */}
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
