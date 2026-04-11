import Message from "../models/message.model.js";
import sanitizeHtml from "sanitize-html";
import { io } from "../lib/socket.js";
import cloudinary from "../lib/cloudinary.js";

/**
 * GET /api/messages?cursor=<messageId>&limit=150
 */
export const getMessages = async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 150;
    const { cursor } = req.query;

    const query = cursor ? { _id: { $lt: cursor } } : {};

    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    res.status(200).json(messages.reverse());
  } catch (error) {
    console.error("getMessages error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * POST /api/messages/send
 */
export const sendMessage = async (req, res) => {
  try {
    const { text, image, audio, stickers, replyTo } = req.body;

    if (!req.user?.role) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const cleanText = sanitizeHtml(text?.trim() || "", {
      allowedTags: [],
      allowedAttributes: {},
    });

    let imageUrl = null;
    let audioUrl = null;

    // ================= IMAGE =================
    if (image && !image.startsWith("data:image/webp")) {
      if (image.startsWith("data:")) {
        const uploaded = await cloudinary.uploader.upload(image, {
          folder: "chat_images",
          resource_type: "image",
        });
        imageUrl = uploaded.secure_url;
      } else {
        imageUrl = image;
      }
    }

    // ================= AUDIO =================
    if (audio) {
      if (audio.startsWith("data:")) {
        const uploaded = await cloudinary.uploader.upload(audio, {
          folder: "chat_audio",
          resource_type: "video",
        });
        audioUrl = uploaded.secure_url;
      } else {
        audioUrl = audio;
      }
    }

    // ================= STICKERS (FINAL CLEAN VERSION) =================
    const safeStickers = Array.isArray(stickers)
      ? stickers.filter((s) => typeof s === "string" && s.trim().length > 0)
      : [];

    // ================= EMPTY CHECK =================
    if (!cleanText && !imageUrl && !audioUrl && safeStickers.length === 0) {
      return res.status(400).json({ message: "Empty message not allowed" });
    }

    // ================= CREATE MESSAGE =================
    const newMessage = new Message({
      text: cleanText,
      image: imageUrl,
      audio: audioUrl,
      stickers: safeStickers,
      logger: req.user.role,
      status: "delivered",
      replyTo: replyTo
        ? {
            _id: replyTo._id,
            text: replyTo.text || null,
            image: replyTo.image || null,
            audio: replyTo.audio || null,
          }
        : null,
    });

    await newMessage.save();

    io.emit("newMessage", newMessage);

    res.status(201).json(newMessage);
  } catch (error) {
    console.error("sendMessage error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * DELETE /api/messages/:id
 */
export const deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;

    const message = await Message.findById(id);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    await message.deleteOne();

    io.emit("deleteMessage", id);

    res.status(200).json({ message: "Message deleted", id });
  } catch (error) {
    console.error("deleteMessage error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
