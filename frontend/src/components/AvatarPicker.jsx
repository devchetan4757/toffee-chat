import { useEffect, useState } from "react";
import { X, RotateCcw, Image as ImageIcon, Upload, Loader2 } from "lucide-react";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "../store/useAuthStore";
import ImageCropper from "./ImageCropper";
import toast from "react-hot-toast";

const TABS = [
  { id: "default", label: "Default", icon: RotateCcw },
  { id: "media", label: "App Media", icon: ImageIcon },
  { id: "upload", label: "Upload", icon: Upload },
];

const MAX_FILE_BYTES = 8 * 1024 * 1024; // 8MB

const AvatarPicker = ({ isOpen, onClose }) => {
  const { updatePfp, isUpdatingPfp } = useAuthStore();

  const [activeTab, setActiveTab] = useState("default");
  const [mediaImages, setMediaImages] = useState([]);
  const [loadingMedia, setLoadingMedia] = useState(false);

  // Cropping state — shared by both the "media" and "upload" flows.
  // cropFallbackUrl is only set for the media flow, so that if the
  // browser can't export a crop of a cross-origin image we can still
  // save the original URL as-is instead of failing outright.
  const [cropSource, setCropSource] = useState(null);
  const [cropCrossOrigin, setCropCrossOrigin] = useState(false);
  const [cropFallbackUrl, setCropFallbackUrl] = useState(null);
  const [savingCrop, setSavingCrop] = useState(false);

  // Reset all transient state every time the modal is opened
  useEffect(() => {
    if (isOpen) {
      setActiveTab("default");
      closeCrop();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && activeTab === "media" && mediaImages.length === 0) {
      fetchMedia();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, activeTab]);

  const fetchMedia = async () => {
    setLoadingMedia(true);
    try {
      const res = await axiosInstance.get("/gallery");
      setMediaImages(res.data);
    } catch {
      toast.error("Couldn't load app media");
    } finally {
      setLoadingMedia(false);
    }
  };

  const closeCrop = () => {
    setCropSource(null);
    setCropCrossOrigin(false);
    setCropFallbackUrl(null);
  };

  // --- DEFAULT ---
  const handleUseDefault = async () => {
    const ok = await updatePfp({ image: null });
    if (ok) onClose();
  };

  // --- APP MEDIA: tapping a thumbnail opens the cropper on it ---
  const openCropForMedia = (url) => {
    setCropSource(url);
    setCropCrossOrigin(true); // remote Cloudinary URL — needs CORS to export
    setCropFallbackUrl(url);
  };

  // --- UPLOAD: reading a device file opens the cropper on it ---
  const handleFileChange = (e) => {
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
    reader.onload = () => {
      setCropSource(reader.result); // data URL — never cross-origin tainted
      setCropCrossOrigin(false);
      setCropFallbackUrl(null);
    };
    reader.onerror = () => toast.error("Couldn't read that file");
    reader.readAsDataURL(file);
  };

  // --- Shared: cropper confirmed -> save the cropped bytes directly, no external storage ---
  const handleCropConfirm = async (croppedDataUrl) => {
    setSavingCrop(true);
    try {
      const ok = await updatePfp({ image: croppedDataUrl });
      if (ok) {
        closeCrop();
        onClose();
      }
    } finally {
      setSavingCrop(false);
    }
  };

  // --- Shared: browser refused to export the crop (cross-origin image) ---
  // Still ends up stored as binary — the server fetches the bytes itself,
  // which sidesteps the browser's CORS restriction entirely.
  const handleCropUnavailable = async () => {
    toast("Couldn't crop that image here — using it as-is");
    if (cropFallbackUrl) {
      const ok = await updatePfp({ imageUrl: cropFallbackUrl });
      if (ok) onClose();
    }
    closeCrop();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-base-100 rounded-2xl w-full max-w-md shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-base-300">
          <h3 className="font-semibold">
            {cropSource ? "Crop your photo" : "Change profile photo"}
          </h3>
          <button onClick={onClose} className="btn btn-ghost btn-sm btn-circle" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs (hidden while cropping) */}
        {!cropSource && (
          <div className="flex border-b border-base-300">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? "border-b-2 border-primary text-primary"
                      : "text-base-content/60 hover:text-base-content"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        )}

        {/* Body */}
        <div className="p-4 min-h-[240px] max-h-[70vh] overflow-y-auto">
          {cropSource ? (
            <ImageCropper
              imageSrc={cropSource}
              crossOrigin={cropCrossOrigin}
              busy={savingCrop || isUpdatingPfp}
              onCancel={closeCrop}
              onConfirm={handleCropConfirm}
              onCropUnavailable={handleCropUnavailable}
            />
          ) : (
            <>
              {/* DEFAULT */}
              {activeTab === "default" && (
                <div className="flex flex-col items-center justify-center gap-4 py-8 text-center">
                  <RotateCcw className="w-8 h-8 text-base-content/40" />
                  <p className="text-sm text-base-content/70">
                    Reset your profile photo back to the app's default picture.
                  </p>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={handleUseDefault}
                    disabled={isUpdatingPfp}
                  >
                    {isUpdatingPfp ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RotateCcw className="w-4 h-4" />
                    )}
                    Use default photo
                  </button>
                </div>
              )}

              {/* APP MEDIA */}
              {activeTab === "media" && (
                <>
                  {loadingMedia ? (
                    <div className="flex justify-center py-10">
                      <Loader2 className="w-6 h-6 animate-spin" />
                    </div>
                  ) : mediaImages.length === 0 ? (
                    <p className="text-center text-sm text-base-content/60 py-10">
                      No shared images yet — send or receive a photo in chat first.
                    </p>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      {mediaImages.map((img) => (
                        <button
                          key={img.public_id}
                          onClick={() => openCropForMedia(img.url)}
                          className="relative aspect-square rounded-lg overflow-hidden border-2 border-transparent hover:border-primary transition-colors"
                        >
                          <img src={img.url} alt="" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* UPLOAD FROM DEVICE */}
              {activeTab === "upload" && (
                <div className="flex flex-col items-center gap-4 py-8">
                  <label className="w-32 h-32 rounded-full border-2 border-dashed border-base-300 flex items-center justify-center cursor-pointer hover:border-primary transition-colors">
                    <Upload className="w-6 h-6 text-base-content/50" />
                    <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                  </label>

                  <label className="btn btn-sm btn-ghost">
                    Choose from device storage
                    <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                  </label>

                  <p className="text-xs text-base-content/50 text-center">
                    JPG, PNG or GIF — up to 8MB. You'll be able to crop it next.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AvatarPicker;
