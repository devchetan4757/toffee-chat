import { useEffect, useRef, useState } from "react";
import { Ban, Check, Image as ImageIcon, Images, Loader2, Upload, X } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";

const MAX_FILE_BYTES = 8 * 1024 * 1024; // 8MB, checked before we even try to resize
const MAX_DIMENSION = 1600; // downscale before sending — a wallpaper never needs full-res

// Shrinks + re-encodes an image client-side so wallpaper uploads stay
// small. Backgrounds are shown with background-size: cover, so there's
// no benefit to sending a huge original — this keeps requests small
// and well under the backend's size limit.
const resizeImage = (dataUrl) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);

      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = reject;
    img.src = dataUrl;
  });

/**
 * Wallpaper control, meant to live in a `position: relative` wrapper
 * right next to the trigger button that sits at the right edge of its
 * strip:
 *
 *   <div className="relative">
 *     <ChatWallpaperPicker isOpen={open} onClose={...} />
 *     <button onClick={() => setOpen(true)}>...</button>
 *   </div>
 *
 * Two pieces, both anchored off that same wrapper (so both stay
 * pinned to the right edge, where there's guaranteed room, instead of
 * drifting left with the icon row and risking going off-screen):
 *
 *   1. A row of small round icons fanned out to the LEFT of the
 *      button — no wallpaper (default), saved wallpaper, upload new.
 *   2. A proper (but still compact) picker WINDOW that drops down
 *      below-right of the button when "from app media" is tapped —
 *      this one needs real room for a thumbnail grid, so it isn't
 *      forced into a tiny circle.
 */
const ChatWallpaperPicker = ({ isOpen, onClose }) => {
  const { wallpaper, updateWallpaper, isUpdatingWallpaper } = useAuthStore();
  const [uploading, setUploading] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryImages, setGalleryImages] = useState([]);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [applyingUrl, setApplyingUrl] = useState(null);
  const iconsRef = useRef(null);
  const galleryRef = useRef(null);

  const isActive = !!wallpaper?.active;
  const hasSaved = !!wallpaper?.hasSaved;
  const savedUrl = wallpaper?.savedUrl || null;

  useEffect(() => {
    if (!isOpen) {
      setGalleryOpen(false);
      return;
    }

    const handleClickOutside = (e) => {
      const insideIcons = iconsRef.current?.contains(e.target);
      const insideGallery = galleryRef.current?.contains(e.target);
      if (!insideIcons && !insideGallery) {
        setGalleryOpen(false);
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isOpen, onClose]);

  const openGallery = async () => {
    setGalleryOpen((prev) => !prev);
    if (galleryImages.length || galleryLoading) return;

    setGalleryLoading(true);
    try {
      const res = await axiosInstance.get("/gallery");
      setGalleryImages(res.data || []);
    } catch {
      toast.error("Couldn't load your media");
    } finally {
      setGalleryLoading(false);
    }
  };

  const handlePickFromGallery = async (img) => {
    setApplyingUrl(img.url);
    // Backend fetches the bytes itself from this URL and stores them as
    // the wallpaper, same as a fresh upload. updateWallpaper toasts on
    // failure itself and resolves to false rather than throwing.
    const ok = await updateWallpaper({ imageUrl: img.url });
    setApplyingUrl(null);
    if (ok) setGalleryOpen(false);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      toast.error("Image must be under 8MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      setUploading(true);
      try {
        const resized = await resizeImage(reader.result);
        await updateWallpaper({ image: resized });
      } catch {
        toast.error("Couldn't process that image");
      } finally {
        setUploading(false);
      }
    };
    reader.onerror = () => toast.error("Couldn't read that file");
    reader.readAsDataURL(file);
  };

  const handleUseNone = () => {
    if (!isActive) return; // already off
    updateWallpaper({ active: false });
  };

  const handleUseSaved = () => {
    if (isActive || !hasSaved) return; // already on, or nothing to switch to
    updateWallpaper({ active: true });
  };

  if (!isOpen) return null;

  const busy = isUpdatingWallpaper || uploading;

  const iconBtnClass = (active, disabled) =>
    `relative w-9 h-9 rounded-full border-2 flex items-center justify-center shadow-md bg-base-100 transition-colors shrink-0 ${
      disabled
        ? "border-base-300 opacity-40 cursor-not-allowed"
        : active
        ? "border-primary"
        : "border-base-300 hover:border-primary/50"
    }`;

  return (
    <>
      {/* Small round icons, fanned out to the left of the trigger button */}
      <div
        ref={iconsRef}
        className="absolute top-1/2 right-full -translate-y-1/2 mr-2 z-30 flex items-center gap-2"
      >
        {/* NO WALLPAPER (default) */}
        <button
          onClick={handleUseNone}
          disabled={busy || !isActive}
          className={iconBtnClass(!isActive, busy || !isActive)}
          aria-label="Use default (no wallpaper)"
          title="Default"
        >
          <Ban className="w-4 h-4 opacity-70" />
          {!isActive && (
            <span className="absolute -top-1 -right-1 bg-primary text-primary-content rounded-full p-0.5">
              <Check className="w-2.5 h-2.5" />
            </span>
          )}
        </button>

        {/* SAVED WALLPAPER */}
        <button
          onClick={handleUseSaved}
          disabled={busy || isActive || !hasSaved}
          className={`relative w-9 h-9 rounded-full border-2 shadow-md overflow-hidden shrink-0 bg-cover bg-center flex items-center justify-center transition-colors ${
            isActive
              ? "border-primary"
              : hasSaved
              ? "border-base-300 hover:border-primary/50"
              : "border-dashed border-base-300 opacity-40 cursor-not-allowed"
          }`}
          style={hasSaved ? { backgroundImage: `url(${savedUrl})` } : undefined}
          aria-label="Use saved wallpaper"
          title="Saved photo"
        >
          {!hasSaved && <ImageIcon className="w-4 h-4 opacity-60" />}
          {isActive && (
            <span className="absolute -top-1 -right-1 bg-primary text-primary-content rounded-full p-0.5">
              <Check className="w-2.5 h-2.5" />
            </span>
          )}
        </button>

        {/* UPLOAD NEW (from device) */}
        <label
          className={iconBtnClass(false, busy) + " cursor-pointer"}
          aria-label="Upload a new photo"
          title="Upload new"
        >
          {uploading ? (
            <Loader2 className="w-4 h-4 animate-spin opacity-70" />
          ) : (
            <Upload className="w-4 h-4 opacity-70" />
          )}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
            disabled={busy}
          />
        </label>

        {/* FROM APP MEDIA — opens the picker window below-right */}
        <button
          onClick={openGallery}
          disabled={busy}
          className={iconBtnClass(galleryOpen, false)}
          aria-label="Choose from app media"
          title="From app media"
        >
          <Images className="w-4 h-4 opacity-70" />
        </button>
      </div>

      {/* Picker WINDOW for "from app media" — anchored to the right
          edge of the same wrapper the trigger button sits in (not to
          the icon row), so it always opens on-screen toward the right
          instead of drifting off the left edge. */}
      {galleryOpen && (
        <div
          ref={galleryRef}
          className="absolute top-full right-0 mt-2 w-72 max-w-[85vw] bg-base-100 rounded-xl shadow-xl border border-base-300 z-40 overflow-hidden"
        >
          <div className="flex items-center justify-between p-3 border-b border-base-300">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Images className="w-4 h-4" />
              Choose from app media
            </h3>
            <button
              onClick={() => setGalleryOpen(false)}
              className="btn btn-ghost btn-xs btn-circle"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-3">
            {galleryLoading && (
              <div className="flex justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin opacity-60" />
              </div>
            )}

            {!galleryLoading && galleryImages.length === 0 && (
              <p className="text-xs text-center opacity-50 py-8">No shared images yet</p>
            )}

            {!galleryLoading && galleryImages.length > 0 && (
              <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                {galleryImages.map((img) => (
                  <button
                    key={img.public_id}
                    onClick={() => handlePickFromGallery(img)}
                    disabled={busy || applyingUrl === img.url}
                    className="relative aspect-square rounded-lg overflow-hidden border-2 border-base-300 hover:border-primary/60 transition-colors"
                  >
                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                    {applyingUrl === img.url && (
                      <span className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <Loader2 className="w-4 h-4 text-white animate-spin" />
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default ChatWallpaperPicker;
