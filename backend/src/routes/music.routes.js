
import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import {
  addMusic,
  getMusic,
  deleteMusic,
} from "../controllers/music.controller.js";

const router = express.Router();

router.post("/add",protect, addMusic);
router.get("/",protect, getMusic);
router.delete("/:id",protect, deleteMusic);

export default router;
