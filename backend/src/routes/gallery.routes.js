import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import {
  getGalleryImages,
  deleteImage,
} from "../controllers/gallery.controller.js";

const router = express.Router();

router.get("/", protect, getGalleryImages);

router.delete("/", protect, deleteImage);

export default router;
