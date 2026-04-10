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

const isStickerImage = (img) => img?.startsWith("data:image/webp");

const MessageInput = () => {
  const { sendMessage, replyTo, clearReplyTo, sendTyping } = useChatStore();

  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [showStickerPicker, setShowStickerPicker] = useState(false);

  const [position, setPosition] = useState({ top: 100, left: 50 });
  const [dragging, setDragging] = useState(false);
  const [scale, setScale] = useState(1);

  const lastTouchDistance = useRef(null);
  const dragStartRef = useRef({ x: 0, y: 0 });

  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // IMAGE PREVIEW
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

  // AUDIO RECORDING
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

  // SEND MESSAGE
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() && !imagePreview && !audioBlob) return;

    try {
      let imageUrl = null;
      let audioUrl = null;

      // upload only normal images (NOT stickers)
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

      await sendMessage({
        text: text.trim(),
        image: imageUrl || null, // ✅ FIXED
        stickers: isStickerImage(imagePreview) ? [imagePreview] : [], // ✅ FIXED
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

      setText("");
      setImagePreview(null);
      setImageFile(null);
      setAudioBlob(null);
      clearReplyTo();
    } catch (err) {
      console.error("Failed to send message:", err);
      toast.error("Failed to send message");
    }
  };

  // SEND STICKER
  const handleStickerSend = async (base64) => {
    try {
      await sendMessage({
        text: "",
        stickers: [base64], // ✅ FIXED
        audio: null,
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
    } catch {
      toast.error("Failed to send sticker");
    }
  };

  // AUTOGROW TEXTAREA
  useEffect(() => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = "auto";
    textareaRef.current.style.height =
      Math.min(textareaRef.current.scrollHeight, 140) + "px";
  }, [text]);

  // DRAG + SCALE LOGIC (UNCHANGED)
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

  const onMouseDown = (e) => {
    setDragging(true);
    dragStartRef.current = {
      x: e.clientX - position.left,
      y: e.clientY - position.top,
    };
  };

  const onMouseMove = (e) => {
    if (!dragging) return;
    setPosition(
      clampPosition({
        left: e.clientX - dragStartRef.current.x,
        top: e.clientY - dragStartRef.current.y,
      })
    );
  };

  const onMouseUp = () => setDragging(false);

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
        setPosition(clampPosition(position));
        lastTouchDistance.current = newDist;
        return newScale;
      });

      e.preventDefault();
      return;
    }

    if (!dragging) return;

    const t = e.touches[0];
    setPosition(
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

        return clampPosition({
          left: pos.left - offsetX,
          top: pos.top - offsetY,
        });
      });

      return newScale;
    });
  };

  useEffect(() => {
    const handleViewportChange = () => setPosition(clampPosition(position));

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

  const stickersArray = [
    ...Array.from({ length: 51 }, (_, i) => `${i + 1}.webp`),
  ];

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

        {replyTo && (
          <div className="bg-gray-200 px-3 py-1 rounded-lg flex justify-between items-center">
            <span className="text-sm truncate max-w-[80%]">
              Replying: {replyTo.text || "Media"}
            </span>
            <button onClick={clearReplyTo}>
              <X size={16} />
            </button>
          </div>
        )}

        {imagePreview && (
          <div className="flex items-center mb-1">
            <img src={imagePreview} className="w-20 h-20 rounded-md object-cover" />
            <button
              onClick={() => {
                setImagePreview(null);
                setImageFile(null);
              }}
              className="ml-2 text-red-500"
            >
              X
            </button>
          </div>
        )}

        <form
          onSubmit={handleSendMessage}
          className="flex items-center gap-2 bg-base-200 rounded-full shadow-lg px-4 py-3 w-full"
        >
          <button type="button" onClick={isRecording ? stopRecording : startRecording}>
            {isRecording ? <Square size={18} /> : <Mic size={18} />}
          </button>

          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
            }}
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

          <button type="button" onClick={() => fileInputRef.current?.click()}>
            <Image size={18} />
          </button>

          <button type="button" onClick={() => setShowStickerPicker((p) => !p)}>
            <Smile size={18} />
          </button>

          <button type="submit">
            <Send size={18} />
          </button>

          {showStickerPicker && (
            <StickerPicker
              stickers={stickersArray}
              onStickerSelect={handleStickerSend}
              onClose={() => setShowStickerPicker(false)}
            />
          )}
        </form>
      </div>
    </div>
  );
};

export default MessageInput;
