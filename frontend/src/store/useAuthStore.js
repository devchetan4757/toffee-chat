import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { socket } from "../lib/socket";

export const useAuthStore = create((set, get) => ({
  isAuthenticated: false,
  isLoggingIn: false,
  isCheckingAuth: true,
  onlineUsersCount: 0,

  // Check auth on app load
  checkAuth: async () => {
    try {
      await axiosInstance.get("/auth/check");
      set({ isAuthenticated: true });
      get().connectSocket();
    } catch {
      set({ isAuthenticated: false });
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  // Login
  login: async (data) => {
    set({ isLoggingIn: true });
    try {
      await axiosInstance.post("/auth/login", data);
      set({ isAuthenticated: true, isCheckingAuth: false });
      toast.success("Logged in successfully");
      get().connectSocket();
      return true;
    } catch (error) {
      toast.error("Login failed");
      return false;
    } finally {
      set({ isLoggingIn: false });
    }
  },

  // Logout
  logout: async () => {
    try {
      await axiosInstance.post("/auth/logout");
      set({ isAuthenticated: false });
      toast.success("Logged out successfully");
      get().disconnectSocket();
    } catch {
      toast.error("Logout failed");
    }
  },

  // Connect socket to track online users
  connectSocket: () => {
    if (socket.connected) return;

    socket.connect();

    // Remove previous listeners and attach fresh one
    socket.off("onlineUsersCount").on("onlineUsersCount", (count) => {
      set({ onlineUsersCount: count });
    });

    socket.off("connect_error").on("connect_error", (err) => {
      console.error("Socket connection error:", err);
    });
  },

  // Disconnect socket
  disconnectSocket: () => {
    if (socket.connected) {
      socket.disconnect();
      set({ onlineUsersCount: 0 });
    }
  },
}));
