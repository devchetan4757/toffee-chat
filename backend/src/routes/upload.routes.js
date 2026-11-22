import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { uploadImage, uploadAudio, uploadVideo } from "../controllers/upload.controller.js";
import { uploadSticker, getStickers, deleteSticker, } from "../controllers/sticker.controller.js";

const router = express.Router();

// normal media
router.post("/image", uploadImage);
router.post("/audio", uploadAudio);
router.post("/video", uploadVideo);

// stickers
router.get("/stickers", getStickers);    
router.post("/sticker", protect, uploadSticker);
router.delete("/sticker", deleteSticker);

export default router;
