// src/lib/axios.js
import axios from "axios";

export const axiosInstance = axios.create({
  // Use localhost in development, production will use relative "/api"
  baseURL: import.meta.env.MODE === "development" 
    ? "http://localhost:5001/api" 
    : "/api",
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
