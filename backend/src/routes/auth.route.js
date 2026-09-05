import express from "express";
import {
  login,
  logout,
  checkAuth,
  updatePfp,
  updateWallpaper,
} from "../controllers/auth.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { loginRateLimiter } from "../middleware/loginRateLimit.js";

const router = express.Router();

router.post("/login", loginRateLimiter, login);
router.post("/logout", logout);
router.get("/check", protect, checkAuth);
router.patch("/pfp", protect, updatePfp);
router.patch("/wallpaper", protect, updateWallpaper);

export default router;
