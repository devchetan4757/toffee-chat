// src/lib/axios.js
import axios from "axios";

// Backend default is PORT=5000 (see backend/src/index.js). Override with
// VITE_API_URL in frontend/.env if your backend runs on a different port.
const DEV_API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const axiosInstance = axios.create({
  baseURL: import.meta.env.MODE === "development" ? DEV_API_URL : "/api",
  withCredentials: true, // send cookies/session
  headers: {
    "Content-Type": "application/json", // default JSON
  },
});

// Optional: add interceptors for logging or error handling
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("Axios error:", error.response || error);
    return Promise.reject(error);
  }
);
