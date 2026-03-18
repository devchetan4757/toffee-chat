import cloudinary from "../lib/cloudinary.js";

// ✅ GET IMAGES
export const getGalleryImages = async (req, res) => {
  try {
    const result = await cloudinary.search
      .expression("folder:chat_images")
      .sort_by("created_at", "desc")
      .max_results(200)
      .execute();

    const images = result.resources.map((img) => ({
      url: img.secure_url,
      public_id: img.public_id,
    }));

    res.status(200).json(images);
  } catch (err) {
    console.error("Gallery fetch error:", err);
    res.status(500).json({ error: "Failed to fetch images" });
  }
};

// ✅ DELETE IMAGE
export const deleteImage = async (req, res) => {
  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ error: "Image id required" });
    }

    await cloudinary.uploader.destroy(id);

    res.status(200).json({ message: "Deleted successfully" });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ error: "Delete failed" });
  }
};
