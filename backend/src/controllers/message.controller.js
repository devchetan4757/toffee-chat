// src/controllers/message.controller.js
import Message from "../models/message.model.js";
import sanitizeHtml from "sanitize-html";
import { io } from "../lib/socket.js";

/**
 * GET /api/messages?cursor=<messageId>&limit=50
 *
 * ✅ Default: returns latest messages (newest 50) but sends back OLD -> NEW
 * ✅ If cursor is provided: returns older messages than that cursor
 */
export const getMessages = async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 50;
    const { cursor } = req.query;

    // If cursor exists, fetch older messages than cursor
    const query = cursor ? { _id: { $lt: cursor } } : {};

    // ✅ Always fetch newest first (DESC), then reverse for UI
    const messages = await Message.find(query)
      .sort({ createdAt: -1 }) // NEW -> OLD
      .limit(limit);

    // ✅ return OLD -> NEW (for chat UI)
    res.status(200).json(messages.reverse());
  } catch (error) {
    console.error("getMessages error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { text, image, audio, stickers } = req.body;

    const cleanText = sanitizeHtml(text?.trim() || "", {
      allowedTags: [],
      allowedAttributes: {},
    });

    const newMessage = new Message({
      text: cleanText,
      image: image || null,
      audio: audio || null,
      stickers: stickers || [],
    });

    await newMessage.save();

    // ✅ Send to all clients
    io.emit("newMessage", newMessage);

    res.status(201).json(newMessage);
  } catch (error) {
    console.error("sendMessage error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

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
