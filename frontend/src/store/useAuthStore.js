import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { socket } from "../lib/socket";

export const useAuthStore = create((set, get) => ({
  isAuthenticated: false,
  isLoggingIn: false,
  isCheckingAuth: true,
  isUpdatingPfp: false,
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

  // UPDATE PROFILE PHOTO
  // Pass { image: "data:...;base64,..." } to store a cropped photo's
  // raw bytes, { imageUrl: "https://..." } as a fallback so the server
  // fetches an already-hosted image itself, or { image: null } to
  // reset back to the app's default photo.
  updatePfp: async ({ image, imageUrl } = {}) => {
    set({ isUpdatingPfp: true });

    try {
      const res = await axiosInstance.patch("/auth/pfp", { image, imageUrl });

      set((state) => ({
        authUser: state.authUser
          ? { ...state.authUser, pfp: res.data.pfp }
          : state.authUser,
      }));

      toast.success(
        image || imageUrl ? "Profile photo updated" : "Profile photo reset to default"
      );

      return true;

    } catch {
      toast.error("Couldn't update profile photo");
      return false;

    } finally {
      set({ isUpdatingPfp: false });
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

    // Live avatar updates — either the other person changed their
    // photo, or this same account is open in another tab/device.
    socket.off("pfpUpdated").on("pfpUpdated", ({ role: changedRole, pfp }) => {
      const { authUser, otherUser } = get();

      if (authUser && changedRole === authUser.role) {
        set({ authUser: { ...authUser, pfp } });
      }

      if (otherUser && changedRole === otherUser.role) {
        set({ otherUser: { ...otherUser, pfp } });
      }
    });
  },

  disconnectSocket: () => {
    if (socket.connected) {
      socket.disconnect();
    }
  },
}));
