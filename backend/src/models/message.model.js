import mongoose from "mongoose";

export const MESSAGE_EFFECTS = ["fire", "love", "celebration", "gift"];

const replySchema = new mongoose.Schema(
  {
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },

    text: {
      type: String,
      default: null,
    },

    image: {
      type: String,
      default: null,
    },

    audio: {
      type: String,
      default: null,
    },

    video: {
      type: String,
      default: null,
    },

    stickers: [
      {
        type: String,
      },
    ],
  },
  {
    _id: false,
  }
);

const messageSchema = new mongoose.Schema(
  {
    logger: {
      type: String,
      default: null,
    },

    text: {
      type: String,
    },

    image: {
      type: String,
    },

    audio: {
      type: String,
    },

    video: {
      type: String,
    },

    stickers: [
      {
        type: String,
      },
    ],

    status: {
      type: String,
      enum: ["sent", "delivered", "seen"],
      default: "sent",
    },

    mediaType: {
      type: String,
      enum: ["instagram", "youtube"],
      default: null,
    },

    mediaStatus: {
      type: String,
      enum: ["pending", "ready", "failed"],
      default: null,
    },

    mediaUrl: {
      type: String,
      default: null,
    },

    // Fire, Love, Celebration, and Gift are enabled for the current effect system.
    effect: {
      type: String,
      enum: [...MESSAGE_EFFECTS, null],
      default: null,
    },

    replyTo: {
      type: replySchema,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

messageSchema.index({
  createdAt: -1,
});

const Message = mongoose.model(
  "Message",
  messageSchema
);

export default Message;
