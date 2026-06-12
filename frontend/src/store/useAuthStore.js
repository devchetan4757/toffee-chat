import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { socket } from "../lib/socket";

export const useAuthStore = create((set, get) => ({
  isAuthenticated: false,
  isLoggingIn: false,
  isCheckingAuth: true,
  authUser: null,
  otherUser: null,
  role: null,

  // CHECK AUTH
  checkAuth: async () => {
    try {
      const res = await axiosInstance.get("/auth/check");

      const user = res.data.user;
      const otherUser = res.data.otherUser;

      set({
        isAuthenticated: true,
        role: user?.role,
        authUser: user,
        otherUser,
      });

      get().connectSocket(user?.role);

    } catch {
      set({
        isAuthenticated: false,
        role: null,
        authUser: null,
        otherUser: null,
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

      const user = res.data.user;

      set({
        isAuthenticated: true,
        role: user?.role,
        authUser: user,
      });

      toast.success("Logged in successfully");

      get().connectSocket(user?.role);

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
        role: null,
        authUser: null,
      });

      toast.success("Logged out successfully");

      get().disconnectSocket();

    } catch {
      toast.error("Logout failed");
    }
  },

  // SOCKET
  connectSocket: (role) => {
    if (!socket.connected) {
      socket.connect();
    }

    socket.off("connect").on("connect", () => {
      if (role) socket.emit("join", role);
    });

    socket.off("connect_error").on("connect_error", (err) => {
      console.error("Socket error:", err);
    });
  },

  disconnectSocket: () => {
    if (socket.connected) {
      socket.disconnect();
    }
  },
}));
