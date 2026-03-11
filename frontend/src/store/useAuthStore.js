import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { socket } from "../lib/socket";

export const useAuthStore = create((set, get) => ({
  isAuthenticated: false,
  isLoggingIn: false,
  isCheckingAuth: true,
  role: null,

  // CHECK AUTH
  checkAuth: async () => {
    try {
      const res = await axiosInstance.get("/auth/check");

      const role = res.data.user?.role;

      set({
        isAuthenticated: true,
        role,
      });

      get().connectSocket(role);

    } catch {
      set({
        isAuthenticated: false,
      });
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  // LOGIN
  login: async (data) => {
    set({ isLoggingIn: true });

    try {
      const res = await axiosInstance.post("/auth/login", data);

      const role = res.data.role;

      set({
        isAuthenticated: true,
        isCheckingAuth: false,
        role,
      });

      toast.success("Logged in successfully");

      get().connectSocket(role);

      return true;

    } catch {
      toast.error("Login failed");
      return false;

    } finally {
      set({ isLoggingIn: false });
    }
  },

  // LOGOUT
  logout: async () => {
    try {
      await axiosInstance.post("/auth/logout");

      set({
        isAuthenticated: false,
      });

      toast.success("Logged out successfully");

      get().disconnectSocket();

    } catch {
      toast.error("Logout failed");
    }
  },

  // CONNECT SOCKET
  connectSocket: (role) => {
    if (!socket.connected) {
      socket.connect();
    }

    // always send join when connected/reconnected
    socket.off("connect").on("connect", () => {
      if (!role) return;
      if (role) {
        socket.emit("join", role);
      }
    });

    socket.off("connect_error").on("connect_error", (err) => {
      console.error("Socket connection error:", err);
    });
  },

  // DISCONNECT SOCKET
  disconnectSocket: () => {
    if (socket.connected) {
      socket.disconnect();
    }
  },
}));
