import { create } from "zustand";
import { toast } from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { socket } from "../lib/socket";

export const useChatStore = create((set, get) => ({
  messages: [],
  isMessagesLoading: false,
  loadingOlder: false,

  // 🔹 REPLY STATE
  replyTo: null,
  setReplyTo: (message) => set({ replyTo: message }),
  clearReplyTo: () => set({ replyTo: null }),

  // ================================
  // FETCH MESSAGES (INITIAL + OLDER)
  // ================================
  getMessages: async (cursor = null, limit = 150) => {
    const isInitialLoad = !cursor;

    set(
      isInitialLoad
        ? { isMessagesLoading: true }
        : { loadingOlder: true }
    );

    try {
      const res = await axiosInstance.get("/messages", {
        params: {
          cursor,
          limit,
        },
      });

      const fetched = res.data || [];

      set((state) => {
        if (isInitialLoad) {
          // ✅ Backend already sends OLD → NEW
          return { messages: fetched };
        }

        // ✅ Append older messages at bottom
        const existingIds = new Set(state.messages.map((m) => m._id));

        const uniqueOlder = fetched.filter(
          (m) => !existingIds.has(m._id)
        );

        return {
          messages: [...state.messages, ...uniqueOlder],
        };
      });
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Failed to load messages"
      );
    } finally {
      set({
        isMessagesLoading: false,
        loadingOlder: false,
      });
    }
  },

  // ================================
  // SEND MESSAGE
  // ================================
  sendMessage: async (data) => {
    try {
      await axiosInstance.post("/messages/send", data);
      set({ replyTo: null });
    } catch (error) {
      toast.error("Failed to send message");
    }
  },

  // ================================
  // DELETE MESSAGE
  // ================================
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

  // ================================
  // SOCKET HANDLERS
  // ================================
  initSocket: () => {
    socket.off("newMessage");
    socket.off("deleteMessage");

    socket.on("newMessage", (message) => {
      set((state) => {
        if (state.messages.some((m) => m._id === message._id)) {
          return state;
        }

        // ✅ New messages come at TOP
        return {
          messages: [message, ...state.messages],
        };
      });
    });

    socket.on("deleteMessage", (id) => {
      set((state) => ({
        messages: state.messages.filter((m) => m._id !== id),
      }));
    });
  },
}));
