import Music from "../models/music.model.js";
import { getYouTubeId } from "../lib/youtube.js";

export const addMusic = async (req, res) => {
  try {
    const { url, title, showVideo } = req.body;

    const videoId = getYouTubeId(url);

    if (!videoId) {
      return res.status(400).json({ message: "Invalid YouTube URL" });
    }

    const music = await Music.create({
      userId: req.user._id,
      url,
      videoId,
      title,
      showVideo,
    });

    res.status(201).json(music);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getMusic = async (req, res) => {
  const music = await Music.find().sort({
    createdAt: -1,
  });

  res.json(music);
};

export const deleteMusic = async (req, res) => {
  await Music.findByIdAndDelete(req.params.id);
  res.json({ success: true });
};
