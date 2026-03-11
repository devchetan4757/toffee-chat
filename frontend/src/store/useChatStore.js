import { create } from "zustand";
import { toast } from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { socket } from "../lib/socket";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  messages: [],
  isMessagesLoading: false,

  // 🔹 typing state
  isTyping: false,
  onlineUsers: [],
  replyTo: null,
  setReplyTo: (message) => set({ replyTo: message }),
  clearReplyTo: () => set({ replyTo: null }),

  // ---------------- GET MESSAGES ----------------
  getMessages: async (cursor) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get("/messages", {
        params: cursor ? { cursor } : {},
      });

      const fetched = res.data || [];

      set((state) => {
        if (!cursor) {
          return { messages: fetched.reverse() };
        }

        const existingIds = new Set(state.messages.map((m) => m._id));

        const older = fetched
          .filter((m) => !existingIds.has(m._id))
          .reverse();

        return { messages: [...state.messages, ...older] };
      });

    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to load messages");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  // ---------------- SEND MESSAGE ----------------
  sendMessage: async (data) => {
    try {
      const { user } = useAuthStore.getState();

      const messageWithLogger = {
        ...data,
        logger: user?.role || null,
      };

      await axiosInstance.post("/messages/send", messageWithLogger);

      set({ replyTo: null });

      // 🔹 stop typing when message sent
      get().sendTyping(false);

    } catch {
      toast.error("Failed to send message");
    }
  },

  // ---------------- DELETE MESSAGE ----------------
  deleteMessage: async (id) => {
    try {
      await axiosInstance.delete(`/messages/${id}`);

      set((state) => ({
        messages: state.messages.filter((m) => m._id !== id),
      }));

    } catch {
      toast.error("Failed to delete message");
    }
  },

  // ---------------- SEND TYPING ----------------
  sendTyping: (typing = true) => {
    const { user } = useAuthStore.getState();

    socket.emit("typing", {
      role: user?.role,
      typing,
    });
  },

  // ---------------- SOCKET ----------------
  initSocket: () => {

  socket.off("newMessage");
  socket.off("deleteMessage");
  socket.off("typing");
  socket.off("onlineUsers");

  const { user } = useAuthStore.getState();

  // 🔹 tell server who connected
  socket.emit("join", user?.role);

  socket.on("newMessage", (message) => {
    set((state) => {
      if (state.messages.some((m) => m._id === message._id)) return state;
      return { messages: [message, ...state.messages] };
    });
  });

  socket.on("deleteMessage", (id) => {
    set((state) => ({
      messages: state.messages.filter((m) => m._id !== id),
    }));
  });

  // 🔹 typing indicator
  socket.on("typing", (data) => {
    const { user } = useAuthStore.getState();

    if (data.role !== user?.role) {
      set({ isTyping: data.typing });
    }
  });

  // 🔹 online users
  socket.on("onlineUsers", (users) => {
    set({ onlineUsers: users });
  });

  return () => {
    socket.off("newMessage");
    socket.off("deleteMessage");
    socket.off("typing");
    socket.off("onlineUsers");
  };
},
}));
