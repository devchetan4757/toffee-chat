import Message from "../models/message.model.js";
import sanitizeHtml from "sanitize-html";
import { io } from "../lib/socket.js";
import cloudinary from "../lib/cloudinary.js";
import { messageCache } from "../lib/messageCache.js";

/**
 * GET /api/messages?cursor=<messageId>&limit=20
 * - No cursor (first load): returns the most recent `limit` messages
 * - With cursor: returns the next `limit` messages older than cursor
 *
 * Served from an in-process in-memory cache (see lib/messageCache.js) that
 * keeps the most recent messages warm — no network hop, no separate
 * process/port, no timeout risk. Falls back to a direct MongoDB query only
 * when the cursor points further back than what's cached.
 */
export const getMessages = async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 80); // cap to avoid abuse — raised from 50 so a fast scroll-down burst can pull a bigger chunk in one round trip
    const { cursor } = req.query;

    const cached = await messageCache.getPage({ cursor, limit });
    if (cached) {
      // messageCache returns newest-first internally, but the wire
      // contract for this endpoint is oldest-first (the frontend
      // reverses it back to newest-first on receipt) — same contract
      // the DB fallback below follows. Keep both paths consistent.
      return res.status(200).json({
        messages: [...cached.messages].reverse(),
        hasMore: cached.hasMore,
      });
    }

    // cursor is older than anything cached — go straight to the DB
    const query = cursor ? { _id: { $lt: cursor } } : {};

    const raw = await Message.find(query)
      .sort({ _id: -1 })
      .limit(limit + 1) // fetch one extra to know if there's more, no separate count query
      .select("-__v")
      .lean();

    const hasMore = raw.length > limit;
    const messages = raw.slice(0, limit);

    res.status(200).json({
      messages: messages.reverse(),
      hasMore,
    });
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
            stickers: replyTo.stickers || null,
          }
        : null,
    });

    await newMessage.save();

    messageCache.onMessageCreated(newMessage.toObject());
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

    messageCache.onMessageDeleted(id);
    io.emit("deleteMessage", id);

    res.status(200).json({ message: "Message deleted", id });
  } catch (error) {
    console.error("deleteMessage error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
