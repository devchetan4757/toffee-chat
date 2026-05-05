import { useState, useRef } from "react";
import toast from "react-hot-toast";
import { Trash2, X } from "lucide-react";
import { axiosInstance } from "../lib/axios";

const StickerPicker = ({
  stickers,
  onStickerSelect,
  refresh,
}) => {
  // ✅ HOLD TO DELETE STATE
  const [activeSticker, setActiveSticker] =
    useState(null);

  const holdTimerRef = useRef(null);

  // ================= NORMAL CLICK =================
  const handleStickerClick = (url) => {
    // if delete mode open, prevent sending
    if (activeSticker === url) return;

    onStickerSelect(url);
  };

  // ================= HOLD START =================
  const handleHoldStart = (url) => {
    clearTimeout(holdTimerRef.current);

    holdTimerRef.current = setTimeout(() => {
      setActiveSticker(url);
    }, 500); // hold for 0.5 sec
  };

  // ================= HOLD END =================
  const handleHoldEnd = () => {
    clearTimeout(holdTimerRef.current);
  };

  // ================= DELETE =================
  const handleDeleteSticker = async (
    url
  ) => {
    try {
      await axiosInstance.delete(
        "/upload/sticker",
        {
          data: { url },
        }
      );

      toast.success("Sticker deleted");

      setActiveSticker(null);

      // refresh from backend
      await refresh?.();
    } catch (err) {
      console.log(err);
      toast.error("Delete failed");
    }
  };

  // ================= UPLOAD =================
  const handleUpload = async (e) => {
    const file = e.target.files[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onloadend = async () => {
      try {
        await axiosInstance.post(
          "/upload/sticker",
          {
            sticker:
              reader.result,
          }
        );

        toast.success(
          "Sticker added"
        );

        // refresh from backend
        await refresh?.();
      } catch (err) {
        console.log(err);
        toast.error(
          "Upload failed"
        );
      }
    };

    reader.readAsDataURL(file);
  };

  return (
    <div
      className="absolute bottom-16 left-0 bg-base-200 p-2 rounded-lg grid grid-cols-4 gap-2 z-50 max-w-[280px] overflow-auto shadow-xl"
      style={{
        maxHeight: "200px",
      }}
      onMouseDown={(e) =>
        e.stopPropagation()
      }
      onTouchStart={(e) =>
        e.stopPropagation()
      }
    >

      {/* UPLOAD BTN */}
      <label className="w-12 h-12 flex items-center justify-center bg-gray-300 rounded cursor-pointer text-xl hover:scale-105 transition">
        +
        <input
          type="file"
          hidden
          accept="image/*"
          onChange={handleUpload}
        />
      </label>

      {/* STICKERS */}
      {stickers.map((url) => {
        const isActive =
          activeSticker === url;

        return (
          <div
            key={url}
            className="relative"
            onMouseDown={() =>
              handleHoldStart(
                url
              )
            }
            onMouseUp={
              handleHoldEnd
            }
            onMouseLeave={
              handleHoldEnd
            }
            onTouchStart={() =>
              handleHoldStart(
                url
              )
            }
            onTouchEnd={
              handleHoldEnd
            }
          >
            {/* STICKER IMAGE */}
            <img
              src={url}
              alt="sticker"
              className={`w-12 h-12 object-contain cursor-pointer transition-all ${
                isActive
                  ? "scale-110 opacity-70 animate-pulse"
                  : "hover:scale-110"
              }`}
              onClick={() =>
                handleStickerClick(
                  url
                )
              }
            />

            {/* DELETE BTN */}
            {isActive && (
              <button
                onClick={() =>
                  handleDeleteSticker(
                    url
                  )
                }
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg"
              >
                <Trash2
                  size={12}
                />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default StickerPicker;
