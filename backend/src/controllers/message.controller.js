import Message from "../models/message.model.js";
import sanitizeHtml from "sanitize-html";
import { io } from "../lib/socket.js";

/**
 * GET /api/messages?cursor=<messageId>&limit=50
 *
 * ✅ Returns latest messages (newest 50) but sends back OLD -> NEW
 * ✅ If cursor is provided: returns older messages than that cursor
 * ✅ Each message includes full reply snapshot if exists
 */
export const getMessages = async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 50;
    const { cursor } = req.query;

    const query = cursor ? { _id: { $lt: cursor } } : {};

    const messages = await Message.find(query)
      .sort({ createdAt: -1 }) // NEW → OLD
      .limit(limit)
      .lean(); // convert to plain JS objects for safety

    res.status(200).json(messages.reverse()); // OLD → NEW
  } catch (error) {
    console.error("getMessages error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * POST /api/messages/send
 *
 * ✅ Stores full reply snapshot if replying to a message
 */
export const sendMessage = async (req, res) => {
  try {
    const { text, image, audio, stickers, replyTo } = req.body;

    const cleanText = sanitizeHtml(text?.trim() || "", {
      allowedTags: [],
      allowedAttributes: {},
    });

    const newMessage = new Message({
      text: cleanText,
      image: image || null,
      audio: audio || null,
      stickers: stickers || [],

      // 🔹 Store full reply snapshot
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

    // ✅ Emit full message to all clients
    io.emit("newMessage", newMessage);

    res.status(201).json(newMessage);
  } catch (error) {
    console.error("sendMessage error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * DELETE /api/messages/:id
 *
 * ✅ Deletes a message and notifies all clients
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
