import toast from "react-hot-toast";

// stickers: array of file names in public/stickers
// onStickerSelect: function to send sticker
// onClose: function to close picker after click

const StickerPicker = ({ stickers, onStickerSelect, onClose }) => {
  // Handle sticker click
  const handleStickerClick = async (stickerFile) => {
    try {
      const res = await fetch(`/stickers/${stickerFile}`);
      const blob = await res.blob();

      // Convert to base64
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      await onStickerSelect(base64);

    } catch (err) {
      console.error(err);
      toast.error("Failed to send sticker");
      onClose();
    }
  };

  return (
    <div
      className="absolute bottom-16 left-0 bg-base-200 shadow-lg p-2 rounded-lg grid grid-cols-4 gap-2 z-50 max-w-[280px] overflow-auto"
      style={{ maxHeight: "200px" }}
      onMouseDown={(e) => e.stopPropagation()}   // Prevent input drag
      onTouchStart={(e) => e.stopPropagation()}  // Prevent input drag
      onTouchMove={(e) => e.stopPropagation()}   // Prevent input drag
    >
      {stickers.map((sticker) => (
        <img
          key={sticker}
          src={`/stickers/${sticker}`}
          alt={sticker}
          className="w-5 h-5 object-contain cursor-pointer hover:scale-110 transition-transform"
          onClick={() => handleStickerClick(sticker)}
        />
      ))}
    </div>
  );
};

export default StickerPicker;
