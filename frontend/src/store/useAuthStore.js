import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { socket } from "../lib/socket";

export const useAuthStore = create((set, get) => ({
  isAuthenticated: false,
  isLoggingIn: false,
  isCheckingAuth: true,
  role: null, // new addition
  onlineUsersCount: 0,

  // Check auth on app load
  checkAuth: async () => {
    try {
      const res = await axiosInstance.get("/auth/check");
      set({ isAuthenticated: true, role: res.data.user?.role || null });
      get().connectSocket();
    } catch {
      set({ isAuthenticated: false, role: null });
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  // Login
  login: async (data) => {
    set({ isLoggingIn: true });
    try {
      const res = await axiosInstance.post("/auth/login", data);
      set({
        isAuthenticated: true,
        isCheckingAuth: false,
        role: res.data.role || null,
      });
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
      set({ isAuthenticated: false, role: null });
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
