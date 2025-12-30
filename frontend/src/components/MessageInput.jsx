import { useRef, useState, useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import { Image, Send, X } from "lucide-react";
import toast from "react-hot-toast";

const MessageInput = () => {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [bottomOffset, setBottomOffset] = useState(24);

  const fileInputRef = useRef(null);
  const inputRef = useRef(null);

  const { sendMessage } = useChatStore();

  useEffect(() => {
    const updateOffset = () => {
      if (window.visualViewport) {
        const offset =
          window.innerHeight -
          window.visualViewport.height -
          window.visualViewport.offsetTop;
        setBottomOffset(Math.max(offset + 24, 24));
      }
    };

    updateOffset();
    window.visualViewport?.addEventListener("resize", updateOffset);
    window.visualViewport?.addEventListener("scroll", updateOffset);

    return () => {
      window.visualViewport?.removeEventListener("resize", updateOffset);
      window.visualViewport?.removeEventListener("scroll", updateOffset);
    };
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      e.target.value = "";
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be under 10MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() && !imagePreview) return;

    try {
      await sendMessage({
        text: text.trim(),
        image: imagePreview,
      });

      setText("");
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      inputRef.current?.blur();
    } catch {
      toast.error("Failed to send message");
    }
  };

  return (
    <div
      className="fixed left-0 right-0 z-50 flex justify-center overflow-x-hidden"
      style={{ bottom: `${bottomOffset}px` }}
    >
      <div className="w-full max-w-4xl mx-4 px-4 py-6 flex flex-col gap-2">
        {imagePreview && (
          <div className="relative w-fit mb-2">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-24 h-24 object-cover rounded-xl border border-base-300"
            />
            <button
              type="button"
              onClick={removeImage}
              className="btn btn-xs btn-circle btn-error absolute -top-2 -right-2"
            >
              <X size={14} />
            </button>
          </div>
        )}

        <form onSubmit={handleSendMessage} className="flex gap-3 w-full">
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a message…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="
              input input-bordered
              flex-1 min-w-0
              h-16 rounded-full
              bg-base-200
              text-lg
              placeholder-base-content/60
              focus:ring-2 focus:ring-primary
            "
          />

          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleImageChange}
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="btn btn-ghost h-16 w-16 shrink-0 rounded-full bg-base-200 hover:bg-base-300"
          >
            <Image size={24} />
          </button>

          <button
            type="submit"
            disabled={!text.trim() && !imagePreview}
            className="btn btn-primary h-16 w-16 shrink-0 rounded-full"
          >
            <Send size={24} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default MessageInput;
