import { useEffect, useState } from "react";
import { axiosInstance } from "../lib/axios";
import { toast } from "react-hot-toast";
import VideoPlayer from "./VideoPlayer";
import {
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Eye,
  Film,
  Image,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";

const ImageGallery = ({ section = "all" }) => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const [currentIndex, setCurrentIndex] = useState(null);
  const [activeIndex, setActiveIndex] = useState(null); // 👈 for tap actions

  // 🔄 FETCH
  const fetchImages = async () => {
    setLoading(true);
    setLoadError(false);

    try {
      const res = await axiosInstance.get("/gallery");
      setImages(res.data);
    } catch {
      setLoadError(true);
      toast.error("Failed to load gallery");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
  }, []);

  useEffect(() => {
    setCurrentIndex(null);
    setActiveIndex(null);
  }, [section]);

  // 🗑️ DELETE
  const handleDelete = async (public_id, type) => {
    if (!confirm(`Delete this ${type}?`)) return;

    try {
      await axiosInstance.delete(`/gallery?id=${public_id}&type=${type}`);

      setImages((prev) =>
        prev.filter((img) => img.public_id !== public_id)
      );

      setActiveIndex(null);
      toast.success("Deleted");
    } catch {
      toast.error("Delete failed");
    }
  };

  // NAVIGATION
  const nextImage = () => {
    setCurrentIndex((prev) =>
      prev === visibleMedia.length - 1 ? 0 : prev + 1
    );
  };

  const prevImage = () => {
    setCurrentIndex((prev) =>
      prev === 0 ? visibleMedia.length - 1 : prev - 1
    );
  };

  // ⏳ LOADING
  if (loading) {
    return (
      <div className="flex h-[40vh] items-center justify-center">
        <span className="loading loading-spinner loading-md text-primary" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex min-h-[35vh] flex-col items-center justify-center px-4 text-center">
        <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-error/10 text-error">
          <CircleAlert className="h-6 w-6" />
        </div>
        <p className="font-semibold">Couldn&apos;t load the gallery</p>
        <p className="mt-1 max-w-sm text-sm text-base-content/60">
          Check your connection and try again.
        </p>
        <button
          type="button"
          onClick={fetchImages}
          className="btn btn-sm btn-outline mt-4"
        >
          <RefreshCw className="h-4 w-4" />
          Try again
        </button>
      </div>
    );
  }

  const visibleMedia =
    section === "all"
      ? images
      : images.filter((item) => item.type === section);

  // 📭 EMPTY
  if (!visibleMedia.length) {
    return (
      <div className="flex min-h-[35vh] flex-col items-center justify-center px-4 text-center">
        <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-base-200 text-base-content/50">
          {section === "video" ? <Film className="h-6 w-6" /> : <Image className="h-6 w-6" />}
        </div>
        <p className="font-semibold">
          {section === "image"
            ? "No photos yet"
            : section === "video"
              ? "No videos yet"
              : "No media yet"}
        </p>
        <p className="mt-1 text-sm text-base-content/60">
          Shared photos and videos will appear here.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* GRID */}
      <div className="grid grid-cols-2 items-start gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5">

        {visibleMedia.map((img, i) => (
          <div
            key={img.public_id}
            className="group relative overflow-hidden rounded-2xl border border-base-300 bg-base-200 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md"
            onClick={() => setActiveIndex(i)} // 👈 tap to show options
          >
            {img.type === "video" ? (
              <VideoPlayer
                src={img.url}
                fit="cover"
                compact
                naturalRatio
                className="aspect-[4/3] w-full"
              />
            ) : (
              <img
                src={img.url}
                alt=""
                className="aspect-[4/3] w-full object-cover"
              />
            )}

            {/* ACTION BUTTONS (mobile style) */}
            {activeIndex === i && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/65 p-3 backdrop-blur-[2px]">

                {/* VIEW */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentIndex(i);
                    setActiveIndex(null);
                  }}
                  className="btn btn-sm min-w-28 border-0 bg-white text-gray-900 shadow-sm hover:bg-gray-100"
                >
                  <Eye className="h-4 w-4" />
                  View
                </button>

                {/* DELETE */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(img.public_id, img.type);
                  }}
                  className="btn btn-sm min-w-28 border-0 bg-error text-error-content hover:bg-error/90"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>

                {/* CLOSE */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveIndex(null);
                  }}
                  className="btn btn-ghost btn-xs mt-1 text-white/80 hover:bg-white/10 hover:text-white"
                >
                  <X className="h-3.5 w-3.5" />
                  Cancel
                </button>

              </div>
            )}
          </div>
        ))}

      </div>

      {/* FULLSCREEN */}
      {currentIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4">

          {/* CLOSE */}
          <button
            className="btn btn-circle btn-sm absolute right-4 top-4 border-white/20 bg-white/10 text-white hover:bg-white/20"
            onClick={() => setCurrentIndex(null)}
            aria-label="Close media viewer"
          >
            <X className="h-5 w-5" />
          </button>

          {/* PREV */}
          <button
            className="btn btn-circle absolute left-3 top-1/2 -translate-y-1/2 border-white/20 bg-white/10 text-white hover:bg-white/20 sm:left-6"
            onClick={prevImage}
            aria-label="Previous media"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>

          {/* MEDIA */}
          {visibleMedia[currentIndex].type === "video" ? (
            <VideoPlayer
              src={visibleMedia[currentIndex].url}
              className="h-[75vh] w-[calc(100vw-6rem)] max-w-5xl rounded-xl sm:h-[85vh]"
            />
          ) : (
            <img
              src={visibleMedia[currentIndex].url}
              alt=""
              className="max-h-[85vh] max-w-[calc(100vw-6rem)] rounded-xl object-contain shadow-2xl"
            />
          )}

          {/* NEXT */}
          <button
            className="btn btn-circle absolute right-3 top-1/2 -translate-y-1/2 border-white/20 bg-white/10 text-white hover:bg-white/20 sm:right-6"
            onClick={nextImage}
            aria-label="Next media"
          >
            <ChevronRight className="h-6 w-6" />
          </button>

        </div>
      )}
    </>
  );
};

export default ImageGallery;
