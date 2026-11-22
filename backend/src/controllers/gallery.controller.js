import cloudinary from "../lib/cloudinary.js";

// ✅ GET IMAGES AND VIDEOS
export const getGalleryImages = async (req, res) => {
  try {
    const [imageResult, videoResult] = await Promise.all([
      cloudinary.search
        .expression("folder:chat_images")
        .sort_by("created_at", "desc")
        .max_results(200)
        .execute(),
      cloudinary.search
        .expression("folder:chat_videos")
        .sort_by("created_at", "desc")
        .max_results(200)
        .execute(),
    ]);

    const images = imageResult.resources.map((item) => ({
      url: item.secure_url,
      public_id: item.public_id,
      type: "image",
      created_at: item.created_at,
    }));
    const videos = videoResult.resources.map((item) => ({
      url: item.secure_url,
      public_id: item.public_id,
      type: "video",
      created_at: item.created_at,
    }));

    res.status(200).json(
      [...videos, ...images].sort(
        (a, b) =>
          (b.created_at ? new Date(b.created_at).getTime() : 0) -
          (a.created_at ? new Date(a.created_at).getTime() : 0)
      )
    );
  } catch (err) {
    console.error("Gallery fetch error:", err);
    res.status(500).json({ error: "Failed to fetch images" });
  }
};

// ✅ DELETE IMAGE
export const deleteImage = async (req, res) => {
  try {
    const { id } = req.query;
    const type = req.query.type === "video" ? "video" : "image";

    if (!id) {
      return res.status(400).json({ error: "Image id required" });
    }

    await cloudinary.uploader.destroy(id, {
      resource_type: type,
    });

    res.status(200).json({ message: "Deleted successfully" });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ error: "Delete failed" });
  }
};
