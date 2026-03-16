import cloudinary from "../lib/cloudinary.js";

// Upload normal image (not stickers)
export const uploadImage = async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) return res.status(400).json({ error: "No image provided" });

    const uploadResponse = await cloudinary.uploader.upload(image, {
      folder: "chat_images",
      resource_type: "image",
      secure: true,
    });

    res.status(200).json({ url: uploadResponse.secure_url });
  } catch (err) {
    console.error("Image upload failed:", err);
    res.status(500).json({ error: "Failed to upload image" });
  }
};

// Upload audio
export const uploadAudio = async (req, res) => {
  try {
    const { audio } = req.body;
    if (!audio) return res.status(400).json({ error: "No audio provided" });

    const uploadResponse = await cloudinary.uploader.upload(audio, {
      folder: "chat_audio",
      resource_type: "video", // webm/mp3
      secure: true,
    });

    res.status(200).json({ url: uploadResponse.secure_url });
  } catch (err) {
    console.error("Audio upload failed:", err);
    res.status(500).json({ error: "Failed to upload audio" });
  }
};
