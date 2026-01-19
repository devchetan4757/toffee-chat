// src/models/message.model.js
import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    text: { type: String },
    image: { type: String },
    audio: { type: String },
    stickers: [{ type: String }], // optional: base64 stickers
    mediaType: { type: String, enum: ["instagram", "youtube"], default: null },
    mediaStatus: { type: String, enum: ["pending", "ready", "failed"], default: null },
    mediaUrl: { type: String, default: null }, // hosted media after download
  },
  { timestamps: true }
);

messageSchema.index({ createdAt: -1 });

const Message = mongoose.model("Message", messageSchema);

export default Message;
