import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import {
  getGalleryImages,
  deleteImage,
} from "../controllers/gallery.controller.js";

const router = express.Router();

// ✅ GET all images
router.get("/", protect, getGalleryImages);

// ✅ DELETE using query param (IMPORTANT FIX)
router.delete("/", protect, deleteImage);

export default router;
