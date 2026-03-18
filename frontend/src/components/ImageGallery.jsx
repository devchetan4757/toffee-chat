import { useEffect, useState } from "react";
import { axiosInstance } from "../lib/axios";
import { toast } from "react-hot-toast";

const ImageGallery = () => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);

  const [currentIndex, setCurrentIndex] = useState(null);
  const [activeIndex, setActiveIndex] = useState(null); // 👈 for tap actions

  // 🔄 FETCH
  const fetchImages = async () => {
    try {
      const res = await axiosInstance.get("/gallery");
      setImages(res.data);
    } catch (err) {
      toast.error("Failed to load gallery");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
  }, []);

  // 🗑️ DELETE
  const handleDelete = async (public_id) => {
    if (!confirm("Delete this image?")) return;

    try {
      await axiosInstance.delete(`/gallery?id=${public_id}`);

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
      prev === images.length - 1 ? 0 : prev + 1
    );
  };

  const prevImage = () => {
    setCurrentIndex((prev) =>
      prev === 0 ? images.length - 1 : prev - 1
    );
  };

  // ⏳ LOADING
  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  // 📭 EMPTY
  if (!images.length) {
    return <div className="text-center mt-10 opacity-70">No images yet</div>;
  }

  return (
    <>
      {/* GRID */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">

        {images.map((img, i) => (
          <div
            key={i}
            className="relative rounded-xl overflow-hidden"
            onClick={() => setActiveIndex(i)} // 👈 tap to show options
          >
            <img
              src={img.url}
              alt=""
              className="w-full h-40 object-cover"
            />

            {/* ACTION BUTTONS (mobile style) */}
            {activeIndex === i && (
              <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2">

                {/* VIEW */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentIndex(i);
                    setActiveIndex(null);
                  }}
                  className="bg-white text-black px-4 py-1 rounded-lg text-sm"
                >
                  View
                </button>

                {/* DELETE */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(img.public_id);
                  }}
                  className="bg-red-500 text-white px-4 py-1 rounded-lg text-sm"
                >
                  Delete
                </button>

                {/* CLOSE */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveIndex(null);
                  }}
                  className="text-white text-xs opacity-70"
                >
                  Cancel
                </button>

              </div>
            )}
          </div>
        ))}

      </div>

      {/* FULLSCREEN */}
      {currentIndex !== null && (
        <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-50">

          {/* CLOSE */}
          <button
            className="absolute top-4 right-4 text-white text-2xl"
            onClick={() => setCurrentIndex(null)}
          >
            ✕
          </button>

          {/* PREV */}
          <button
            className="absolute left-4 text-white text-3xl"
            onClick={prevImage}
          >
            ‹
          </button>

          {/* IMAGE */}
          <img
            src={images[currentIndex].url}
            alt=""
            className="max-h-[90%] max-w-[90%] rounded-lg"
          />

          {/* NEXT */}
          <button
            className="absolute right-4 text-white text-3xl"
            onClick={nextImage}
          >
            ›
          </button>

        </div>
      )}
    </>
  );
};

export default ImageGallery;
