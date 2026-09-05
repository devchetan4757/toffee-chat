import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { socket } from "../lib/socket";

const DEFAULT_WALLPAPER = { savedUrl: null, active: false, hasSaved: false };

export const useAuthStore = create((set, get) => ({
  isAuthenticated: false,
  isLoggingIn: false,
  isCheckingAuth: true,
  isUpdatingPfp: false,
  isUpdatingWallpaper: false,
  authUser: null,
  otherUser: null,
  role: null,
  wallpaper: DEFAULT_WALLPAPER,

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
        wallpaper: user?.wallpaper || DEFAULT_WALLPAPER,
      });

      get().connectSocket(user?.role);

    } catch {
      set({
        isAuthenticated: false,
        role: null,
        authUser: null,
        otherUser: null,
        wallpaper: DEFAULT_WALLPAPER,
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
        wallpaper: user?.wallpaper || DEFAULT_WALLPAPER,
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
        wallpaper: DEFAULT_WALLPAPER,
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

  // UPDATE CHAT WALLPAPER
  // Pass { image: "data:...;base64,..." } to upload a new wallpaper from
  // a file, { imageUrl: "https://..." } to reuse an image already in the
  // app's media (the backend fetches those bytes itself), or
  // { active: true/false } to toggle between the already-saved
  // wallpaper and the plain default chat background without touching
  // the saved bytes at all.
  updateWallpaper: async ({ image, imageUrl, active } = {}) => {
    set({ isUpdatingWallpaper: true });

    try {
      const res = await axiosInstance.patch("/auth/wallpaper", { image, imageUrl, active });

      set({ wallpaper: res.data.wallpaper });

      toast.success(
        image || imageUrl
          ? "Wallpaper updated"
          : active
          ? "Wallpaper turned on"
          : "Wallpaper turned off"
      );

      return true;

    } catch (err) {
      toast.error(err?.response?.data?.message || "Couldn't update wallpaper");
      return false;

    } finally {
      set({ isUpdatingWallpaper: false });
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

    // Wallpaper is personal — only ever applied when it's this same
    // account's own role (e.g. another tab/device), never the other
    // person's, since it's not shared conversation data.
    socket.off("wallpaperUpdated").on("wallpaperUpdated", ({ role: changedRole, wallpaper }) => {
      const { authUser } = get();

      if (authUser && changedRole === authUser.role) {
        set({ wallpaper: wallpaper || DEFAULT_WALLPAPER });
      }
    });
  },

  disconnectSocket: () => {
    if (socket.connected) {
      socket.disconnect();
    }
  },
}));
