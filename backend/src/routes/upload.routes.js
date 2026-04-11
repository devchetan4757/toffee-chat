import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { uploadImage, uploadAudio } from "../controllers/upload.controller.js";
import { uploadSticker, getStickers } from "../controllers/sticker.controller.js";

const router = express.Router();

// normal media
router.post("/image", uploadImage);
router.post("/audio", uploadAudio);

// stickers
router.get("/stickers", getStickers);        // ✅ PUBLIC (important)
router.post("/sticker", protect, uploadSticker);

export default router;
