// src/lib/mediaDownloader.js
import axios from "axios";
import cloudinary from "./cloudinary.js";

// Example: simplified downloader. For Instagram/YT, you can use APIs or scraper libs.
// Returns a secure hosted URL for frontend.
export const downloadMedia = async (url, type) => {
  try {
    // Here you’d implement actual media fetching logic.
    // For demo purposes, we just upload URL to cloudinary via fetch.
    const response = await cloudinary.uploader.upload(url, {
      folder: "chat_media",
      resource_type: "auto",
      secure: true,
    });
    return response.secure_url;
  } catch (err) {
    console.error("Media download error:", err);
    return null;
  }
};
