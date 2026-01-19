// src/controllers/message.controller.js
import Message from "../models/message.model.js";
import sanitizeHtml from "sanitize-html";
import { io } from "../lib/socket.js";
import { downloadMedia } from "../lib/mediaDownloader.js";

export const getMessages = async (req, res) => {
  try {
    const limit = 50;
    const { cursor } = req.query;
    const query = cursor ? { _id: { $lt: cursor } } : {};

    const messages = await Message.find(query)
      .sort({ createdAt: 1 })
      .limit(limit);

    res.status(200).json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { text, image, audio, stickers, mediaType } = req.body;

    const cleanText = sanitizeHtml(text?.trim() || "", {
      allowedTags: [],
      allowedAttributes: {},
    });

    const newMessage = new Message({
      text: cleanText,
      image: image || null,
      audio: audio || null,
      stickers: stickers || [],
      mediaType: mediaType || null,
      mediaStatus: mediaType ? "pending" : null,
    });

    await newMessage.save();

    io.emit("newMessage", newMessage);
    res.status(201).json(newMessage);

    // Background download
    if (mediaType && cleanText) {
      try {
        const mediaUrl = await downloadMedia(cleanText, mediaType);
        newMessage.mediaUrl = mediaUrl;
        newMessage.mediaStatus = mediaUrl ? "ready" : "failed";
        await newMessage.save();
        io.emit("updateMessage", newMessage);
      } catch (err) {
        console.error("Media download failed:", err);
        newMessage.mediaStatus = "failed";
        await newMessage.save();
        io.emit("updateMessage", newMessage);
      }
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const message = await Message.findById(id);
    if (!message) return res.status(404).json({ message: "Message not found" });

    await message.deleteOne();
    io.emit("deleteMessage", id);
    res.status(200).json({ message: "Message deleted", id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
