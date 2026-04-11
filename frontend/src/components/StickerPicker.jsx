import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";

const StickerPicker = ({ stickers, onStickerSelect, onClose, refresh }) => {

  const handleStickerClick = (url) => {
    onStickerSelect(url);
  };

  // ✅ UPLOAD FIXED (instant + backend sync)
  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onloadend = async () => {
      try {
        const res = await axiosInstance.post("/upload/sticker", {
          sticker: reader.result,
        });

        const newSticker = res.data.url;

        toast.success("Sticker added");

        // ✅ refresh from backend
        await refresh?.();

        // optional instant UI update (no delay feel)
        stickers.unshift(newSticker);
      } catch (err) {
        console.log(err);
        toast.error("Upload failed");
      }
    };

    reader.readAsDataURL(file);
  };

  return (
    <div
      className="absolute bottom-16 left-0 bg-base-200 p-2 rounded-lg grid grid-cols-4 gap-2 z-50 max-w-[280px] overflow-auto"
      style={{ maxHeight: "200px" }}
      onMouseDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
    >
      {/* UPLOAD BUTTON */}
      <label className="w-12 h-12 flex items-center justify-center bg-gray-300 rounded cursor-pointer text-xl">
        +
        <input
          type="file"
          hidden
          accept="image/*"
          onChange={handleUpload}
        />
      </label>

      {/* STICKERS */}
      {stickers.map((url) => (
        <img
          key={url}
          src={url}
          className="w-12 h-12 object-contain cursor-pointer hover:scale-110"
          onClick={() => handleStickerClick(url)}
        />
      ))}
    </div>
  );
};

export default StickerPicker;
