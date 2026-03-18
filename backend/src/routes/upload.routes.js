import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { uploadImage, uploadAudio } from "../controllers/upload.controller.js";

const router = express.Router();

router.post("/image", uploadImage);
router.post("/audio", uploadAudio);

export default router;
