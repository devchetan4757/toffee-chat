import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import {
  getMessages,
  sendMessage,
  deleteMessage,
} from "../controllers/message.controller.js";

const router = express.Router();

router.get("/", protect, getMessages);
router.post("/send", protect, sendMessage);
router.delete("/:id", protect, deleteMessage);

export default router;
