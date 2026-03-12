import Message from "../models/message.model.js";
import sanitizeHtml from "sanitize-html";
import { io } from "../lib/socket.js";

/**
 * GET /api/messages?cursor=<messageId>&limit=50
 *
 * Returns latest messages (newest 50) but sends back OLD -> NEW
 * Each message includes full reply snapshot if exists
 */
export const getMessages = async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 150;
    const { cursor } = req.query;

    const query = cursor ? { _id: { $lt: cursor } } : {};

    const messages = await Message.find(query)
      .sort({ createdAt: -1 }) // NEW → OLD
      .limit(limit)
      .lean();

    res.status(200).json(messages.reverse()); // OLD → NEW
  } catch (error) {
    console.error("getMessages error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * POST /api/messages/send
 *
 * Stores a new message with logger (role) from JWT
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

    const newMessage = new Message({
      text: cleanText,
      image: image || null,
      audio: audio || null,
      stickers: stickers || [],
      logger: req.user.role, // 🔹 SET LOGGER HERE FROM JWT
      status:"delivered",
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
