import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { socket } from "../lib/socket";

export const useAuthStore = create((set) => ({
  isAuthenticated: false,
  isLoggingIn: false,
  isCheckingAuth: true,
  onlineUsersCount: 0,

  // --- Check auth on app load ---
  checkAuth: async () => {
    try {
      await axiosInstance.get("/auth/check");
      set({ isAuthenticated: true });
      socket.connect(); // socket connects ONLY here
    } catch {
      set({ isAuthenticated: false });
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  // --- Login ---
  login: async (data) => {
    set({ isLoggingIn: true });
    try {
      await axiosInstance.post("/auth/login", data);
      set({ isAuthenticated: true });
      socket.connect();
      toast.success("Logged in successfully");
      return true;
    } catch {
      toast.error("Login failed");
      return false;
    } finally {
      set({ isLoggingIn: false });
    }
  },

  // --- Logout ---
  logout: async () => {
    try {
      await axiosInstance.post("/auth/logout");
      socket.disconnect();
      set({ isAuthenticated: false, onlineUsersCount: 0 });
      toast.success("Logged out successfully");
    } catch {
      toast.error("Logout failed");
    }
  },

  // --- Socket listeners ---
  initSocketListeners: () => {
    socket.off("onlineUsersCount").on("onlineUsersCount", (count) => {
      set({ onlineUsersCount: count });
    });

    socket.off("connect_error").on("connect_error", (err) => {
      console.error("Socket error:", err.message);
    });

    socket.off("disconnect").on("disconnect", () => {
      set({ onlineUsersCount: 0 });
    });
  },
}));
