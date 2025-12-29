import Message from "../models/message.model.js";
import sanitizeHtml from "sanitize-html";
import { io } from "../lib/socket.js";
import cloudinary from "../lib/cloudinary.js";

export const getMessages = async (req, res) => {
  try {
    const limit = 50;
    const { cursor } = req.query;

    const query = cursor
      ? { _id: { $lt: cursor } } // fetch older messages
      : {};

    const messages = await Message.find(query)
      .sort({ createdAt: -1 }) // newest first
      .limit(limit);

    // send messages oldest → newest
    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getMessages controller:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { text, image } = req.body;
    const cleanText = sanitizeHtml(text?.trim() || "", {
      allowedTags: [],
      allowedAttributes: {},
    });
    let imageUrl;
    if (image) {
      // Upload base64 image to cloudinary
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    const newMessage = new Message({
      text: cleanText,
      image: imageUrl,
    });
    if (!cleanText && !imageUrl) {
  return res.status(400).json({ error: "Message cannot be empty" });
}

    await newMessage.save();
    io.emit("newMessage", newMessage);

    res.status(201).json(newMessage);
  } catch (error) {
    console.log("Error in sendMessage controller: ", error.message);
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
    io.emit("deleteMessage", req.params.id);
    res.status(200).json({ message: "Message deleted", id });
    console.log("deleted")
  } catch (error) {
    console.log("Error deleting message:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};
