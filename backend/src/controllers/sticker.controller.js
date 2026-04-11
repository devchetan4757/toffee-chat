import cloudinary from "../lib/cloudinary.js";

/**
 * POST /api/upload/sticker
 * Upload sticker to Cloudinary
 */
export const uploadSticker = async (req, res) => {
  try {
    const { sticker } = req.body;

    if (!sticker) {
      return res.status(400).json({ message: "No sticker provided" });
    }

    const uploaded = await cloudinary.uploader.upload(sticker, {
      folder: "chat_stickers",
      resource_type: "image",
    });

    return res.status(201).json({
      url: uploaded.secure_url,
    });
  } catch (error) {
    console.error("uploadSticker error:", error);
    res.status(500).json({ message: "Sticker upload failed" });
  }
};

/**
 * GET /api/upload/stickers
 * For now returns Cloudinary folder listing (manual simple version)
 */
export const getStickers = async (req, res) => {
  try {
    const result = await cloudinary.search
      .expression("folder:chat_stickers")
      .sort_by("created_at", "desc")
      .max_results(100)
      .execute();

    const stickers = result.resources.map((file) => file.secure_url);

    return res.status(200).json({ stickers });
  } catch (error) {
    console.error("getStickers error:", error);
    res.status(500).json({ message: "Failed to fetch stickers" });
  }
};
