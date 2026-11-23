import Message, {
  MESSAGE_EFFECTS,
} from "../models/message.model.js";
import mongoose from "mongoose";
import sanitizeHtml from "sanitize-html";
import { io } from "../lib/socket.js";
import cloudinary from "../lib/cloudinary.js";

const escapeRegExp = (value) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * GET /api/messages?cursor=<messageId>&limit=150
 */
export const getMessages = async (req, res) => {
  try {
    const requestedLimit = Number(req.query.limit) || 150;
    const limit = Math.min(Math.max(requestedLimit, 1), 150);
    const { cursor } = req.query;
    const direction = req.query.direction === "newer" ? "newer" : "older";

    const query = cursor
      ? { _id: direction === "newer" ? { $gt: cursor } : { $lt: cursor } }
      : {};

    const messages = await Message.find(query)
      .sort(direction === "newer" ? { _id: 1 } : { _id: -1 })
      .hint({ _id: 1 })
      .limit(limit + 1)
      .lean();

    const hasMore = messages.length > limit;
    res.status(200).json({
      messages: messages.slice(0, limit),
      hasMore,
    });
  } catch (error) {
    console.error("getMessages error:", error);

    res.status(500).json({
      error: "Internal server error",
    });
  }
};

/**
 * GET /api/messages/search?q=<text>&cursor=<messageId>&limit=40
 */
export const searchMessages = async (req, res) => {
  try {
    const queryText =
      typeof req.query.q === "string" ? req.query.q.trim() : "";

    if (!queryText) {
      return res.status(400).json({ message: "Search text is required" });
    }

    if (queryText.length > 100) {
      return res.status(400).json({ message: "Search text is too long" });
    }

    const { cursor } = req.query;
    if (cursor && !mongoose.isValidObjectId(cursor)) {
      return res.status(400).json({ message: "Invalid search cursor" });
    }

    const requestedLimit = Number(req.query.limit) || 40;
    const limit = Math.min(Math.max(requestedLimit, 1), 100);
    const query = {
      text: {
        $regex: escapeRegExp(queryText),
        $options: "i",
      },
    };

    if (cursor) query._id = { $lt: cursor };

    const matches = await Message.find(query)
      .sort({ _id: -1 })
      .hint({ _id: 1 })
      .select("_id text createdAt")
      .limit(limit + 1)
      .lean();

    res.status(200).json({
      messages: matches.slice(0, limit),
      hasMore: matches.length > limit,
    });
  } catch (error) {
    console.error("searchMessages error:", error);
    res.status(500).json({ message: "Failed to search messages" });
  }
};

/**
 * GET /api/messages/around/:id?limit=30
 */
export const getMessagesAround = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid message id" });
    }

    const target = await Message.findById(id).lean();
    if (!target) {
      return res.status(404).json({ message: "Message not found" });
    }

    const requestedLimit = Number(req.query.limit) || 30;
    const limit = Math.min(Math.max(requestedLimit, 1), 50);

    const [newer, older] = await Promise.all([
      Message.find({ _id: { $gt: target._id } })
        .sort({ _id: 1 })
        .hint({ _id: 1 })
        .limit(limit + 1)
        .lean(),
      Message.find({ _id: { $lt: target._id } })
        .sort({ _id: -1 })
        .hint({ _id: 1 })
        .limit(limit + 1)
        .lean(),
    ]);

    res.status(200).json({
      messages: [
        ...newer.slice(0, limit).reverse(),
        target,
        ...older.slice(0, limit),
      ],
      hasMoreNewer: newer.length > limit,
      hasMoreOlder: older.length > limit,
    });
  } catch (error) {
    console.error("getMessagesAround error:", error);
    res.status(500).json({ message: "Failed to load messages around search result" });
  }
};

/**
 * POST /api/messages/send
 *
 * Supports:
 * {
 *   text,
 *   image,
 *   audio,
 *   video,
 *   stickers,
 *   replyTo,
 *   effect
 * }
 *
 * `effect_type` is also accepted for compatibility.
 *
 * Current allowed effects:
 *   fire, love, celebration, gift
 */
export const sendMessage = async (req, res) => {
  try {
    const {
      text,
      image,
      audio,
      video,
      stickers,
      replyTo,
      effect,
      effect_type,
    } = req.body;

    // ================= AUTHENTICATION =================

    if (!req.user?.role) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    // ================= EFFECT VALIDATION =================

    /*
     * Frontend sends `effect`.
     *
     * `effect_type` is accepted as a fallback so older
     * frontend requests remain compatible.
     */
    const requestedEffect =
      effect !== undefined
        ? effect
        : effect_type;

    let safeEffect = null;

    if (
      requestedEffect !== undefined &&
      requestedEffect !== null &&
      requestedEffect !== ""
    ) {
      if (
        typeof requestedEffect !== "string" ||
        !MESSAGE_EFFECTS.includes(requestedEffect)
      ) {
        return res.status(400).json({
          message: "Invalid message effect",
          allowedEffects: MESSAGE_EFFECTS,
        });
      }

      safeEffect = requestedEffect;
    }

    // ================= TEXT =================

    const cleanText = sanitizeHtml(
      text?.trim() || "",
      {
        allowedTags: [],
        allowedAttributes: {},
      }
    );

    let imageUrl = null;
    let audioUrl = null;
    let videoUrl = null;

    // ================= IMAGE =================

    /*
     * Sticker WebP data is intentionally excluded from
     * the normal image upload pipeline.
     */
    if (
      image &&
      !image.startsWith("data:image/webp")
    ) {
      if (image.startsWith("data:")) {
        const uploaded =
          await cloudinary.uploader.upload(
            image,
            {
              folder: "chat_images",
              resource_type: "image",
            }
          );

        imageUrl = uploaded.secure_url;
      } else {
        imageUrl = image;
      }
    }

    // ================= AUDIO =================

    if (audio) {
      if (audio.startsWith("data:")) {
        const uploaded =
          await cloudinary.uploader.upload(
            audio,
            {
              folder: "chat_audio",
              resource_type: "video",
            }
          );

        audioUrl = uploaded.secure_url;
      } else {
        audioUrl = audio;
      }
    }

    // ================= VIDEO =================

    if (video) {
      if (video.startsWith("data:")) {
        const uploaded =
          await cloudinary.uploader.upload(
            video,
            {
              folder: "chat_videos",
              resource_type: "video",
            }
          );

        videoUrl = uploaded.secure_url;
      } else {
        videoUrl = video;
      }
    }

    // ================= STICKERS =================

    const safeStickers = Array.isArray(stickers)
      ? stickers.filter(
          (sticker) =>
            typeof sticker === "string" &&
            sticker.trim().length > 0
        )
      : [];

    // ================= EMPTY MESSAGE CHECK =================

    /*
     * An effect by itself is not message content.
     *
     * The message must contain text, image, audio,
     * video, or at least one sticker.
     */
    if (
      !cleanText &&
      !imageUrl &&
      !audioUrl &&
      !videoUrl &&
      safeStickers.length === 0
    ) {
      return res.status(400).json({
        message: "Empty message not allowed",
      });
    }

    // ================= REPLY =================

    const safeReplyTo = replyTo
      ? {
          _id: replyTo._id,
          text: replyTo.text || null,
          image: replyTo.image || null,
          audio: replyTo.audio || null,
          video: replyTo.video || null,
          stickers: Array.isArray(
            replyTo.stickers
          )
            ? replyTo.stickers
            : [],
        }
      : null;

    // ================= CREATE MESSAGE =================

    const newMessage = new Message({
      text: cleanText,

      image: imageUrl,

      audio: audioUrl,

      video: videoUrl,

      stickers: safeStickers,

      logger: req.user.role,

      status: "delivered",

      /*
       * Persist the validated effect.
       *
       * Currently:
       *   "fire"
       *
       * or:
       *   null
       */
      effect: safeEffect,

      replyTo: safeReplyTo,
    });

    // ================= SAVE =================

    await newMessage.save();

    // ================= REAL-TIME EVENT =================

    /*
     * Send the complete saved message, including
     * its effect, to every connected client.
     */
    io.emit(
      "newMessage",
      newMessage
    );

    // ================= RESPONSE =================

    res.status(201).json(
      newMessage
    );
  } catch (error) {
    console.error(
      "sendMessage error:",
      error
    );

    res.status(500).json({
      error: "Internal server error",
    });
  }
};

/**
 * DELETE /api/messages/:id
 */
export const deleteMessage = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const message =
      await Message.findById(id);

    if (!message) {
      return res.status(404).json({
        message: "Message not found",
      });
    }

    await message.deleteOne();

    // Notify all connected clients.
    io.emit(
      "deleteMessage",
      id
    );

    res.status(200).json({
      message: "Message deleted",
      id,
    });
  } catch (error) {
    console.error(
      "deleteMessage error:",
      error
    );

    res.status(500).json({
      message: "Internal server error",
    });
  }
};
