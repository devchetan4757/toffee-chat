import Message from "../models/message.model.js";
import sanitizeHtml from "sanitize-html";
import { io } from "../lib/socket.js";
import cloudinary from "../lib/cloudinary.js";

// ---------------- GET MESSAGES ----------------
export const getMessages = async (req, res) => {
  try {
    const limit = 50;
    const { cursor } = req.query;

    const query = cursor ? { _id: { $lt: cursor } } : {};

    const messages = await Message.find(query)
      .sort({ createdAt: 1 }) // oldest → newest
      .limit(limit);

    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getMessages:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ---------------- SEND MESSAGE ----------------
export const sendMessage = async (req, res) => {
  try {
    const { text } = req.body;

    const cleanText = sanitizeHtml(text?.trim() || "", {
      allowedTags: [],
      allowedAttributes: {},
    });

    let imageUrl = null;
    if (req.body.image) {
      const uploadResponse = await cloudinary.uploader.upload(req.body.image, {
        folder: "chat_images",
        secure: true,
      });
      imageUrl = uploadResponse.secure_url;
    }

    let audioUrl = null;
    if (req.body.audio) {
      const uploadResponse = await cloudinary.uploader.upload(req.body.audio, {
        folder: "chat_audio",
        resource_type: "video", // webm/mp3
        secure: true,
      });
      audioUrl = uploadResponse.secure_url;
    }

    if (!cleanText && !imageUrl && !audioUrl) {
      return res.status(400).json({ error: "Message cannot be empty" });
    }

    const newMessage = new Message({
      text: cleanText,
      image: imageUrl,
      audio: audioUrl,
    });

    await newMessage.save();

    io.emit("newMessage", {
      _id: newMessage._id,
      text: newMessage.text,
      image: newMessage.image,
      audio: newMessage.audio,
      createdAt: newMessage.createdAt,
      updatedAt: newMessage.updatedAt,
    });

    res.status(201).json(newMessage);
  } catch (error) {
    console.log("Error in sendMessage:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ---------------- DELETE MESSAGE ----------------
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

    console.log("Message deleted:", id);
  } catch (error) {
    console.log("Error deleting message:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};
