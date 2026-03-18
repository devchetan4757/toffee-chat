import ImageGallery from "../components/ImageGallery";

const GalleryPage = () => {
  return (
    <div className="min-h-screen bg-base-100 pt-20 px-4">

      {/* HEADER */}
      <div className="max-w-7xl mx-auto mb-6">
        <h1 className="text-2xl font-bold">Media Gallery</h1>
        <p className="text-sm opacity-70">
          All images shared in chat
        </p>
      </div>

      {/* GALLERY */}
      <div className="max-w-7xl mx-auto">
        <ImageGallery />
      </div>

    </div>
  );
};

export default GalleryPage;
