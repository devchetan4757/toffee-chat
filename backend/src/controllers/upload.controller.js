import cloudinary from "../lib/cloudinary.js";

/**
 * IMAGE UPLOAD
 */
export const uploadImage = async (req, res) => {
  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({ message: "No image provided" });
    }

    const uploaded = await cloudinary.uploader.upload(image, {
      folder: "chat_images",
      resource_type: "image",
    });

    return res.status(200).json({ url: uploaded.secure_url });
  } catch (error) {
    console.error("uploadImage error:", error);
    res.status(500).json({ message: "Image upload failed" });
  }
};

/**
 * AUDIO UPLOAD
 */
export const uploadAudio = async (req, res) => {
  try {
    const { audio } = req.body;

    if (!audio) {
      return res.status(400).json({ message: "No audio provided" });
    }

    const uploaded = await cloudinary.uploader.upload(audio, {
      folder: "chat_audio",
      resource_type: "video",
    });

    return res.status(200).json({ url: uploaded.secure_url });
  } catch (error) {
    console.error("uploadAudio error:", error);
    res.status(500).json({ message: "Audio upload failed" });
  }
};

/**
 * VIDEO UPLOAD
 */
export const uploadVideo = async (req, res) => {
  try {
    const { video } = req.body;

    if (!video) {
      return res.status(400).json({ message: "No video provided" });
    }

    const uploaded = await cloudinary.uploader.upload(video, {
      folder: "chat_videos",
      resource_type: "video",
    });

    return res.status(200).json({ url: uploaded.secure_url });
  } catch (error) {
    console.error("uploadVideo error:", error);
    res.status(500).json({ message: "Video upload failed" });
  }
};
