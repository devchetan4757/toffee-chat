import cloudinary from "../lib/cloudinary.js";

export const uploadAudio = async (req, res) => {
  try {
    const { audio } = req.body;
    if (!audio) return res.status(400).json({ error: "No audio provided" });

    const uploadResponse = await cloudinary.uploader.upload(audio, {
      folder: "chat_audio",
      resource_type: "video",  // webm/mp3
      secure: true,
    });

    res.status(200).json({ url: uploadResponse.secure_url });
  } catch (err) {
    console.log("Audio upload failed:", err);
    res.status(500).json({ error: "Failed to upload audio" });
  }
};
