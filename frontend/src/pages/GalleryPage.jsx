import { useLocation } from "react-router-dom";
import ImageGallery from "../components/ImageGallery";

const GalleryPage = () => {
  const location = useLocation();
  const sectionParam = new URLSearchParams(location.search).get("section");
  const section =
    sectionParam === "photo" || sectionParam === "video"
      ? sectionParam === "photo"
        ? "image"
        : "video"
      : "all";

  return (
    <div className="min-h-screen bg-base-100 pt-20 px-4">

      {/* HEADER */}
      <div className="max-w-7xl mx-auto mb-6">
        <h1 className="text-2xl font-bold">Media Gallery</h1>
        <p className="text-sm opacity-70">
          {section === "image"
            ? "Photos shared in chat"
            : section === "video"
              ? "Videos shared in chat"
              : "All images and videos shared in chat"}
        </p>
      </div>

      {/* GALLERY */}
      <div className="max-w-7xl mx-auto">
        <ImageGallery section={section} />
      </div>

    </div>
  );
};

export default GalleryPage;
