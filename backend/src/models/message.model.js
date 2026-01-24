import mongoose from "mongoose";

const replySchema = new mongoose.Schema({
  _id: { type: mongoose.Schema.Types.ObjectId, required: true },
  text: { type: String, default: null },
  image: { type: String, default: null },
  audio: { type: String, default: null },
}, { _id: false });

const messageSchema = new mongoose.Schema(
  {
    text: { type: String },
    image: { type: String },
    audio: { type: String },
    stickers: [{ type: String }],
    mediaType: { type: String, enum: ["instagram", "youtube"], default: null },
    mediaStatus: { type: String, enum: ["pending", "ready", "failed"], default: null },
    mediaUrl: { type: String, default: null },
    replyTo: { type: replySchema, default: null }, // ✅ store full reply snapshot
  },
  { timestamps: true }
);

messageSchema.index({ createdAt: -1 });

const Message = mongoose.model("Message", messageSchema);

export default Message;
