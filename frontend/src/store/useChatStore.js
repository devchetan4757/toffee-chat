import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { socket } from "../lib/socket";

export const useChatStore = create((set, get) => ({
  messages: [],
  isMessagesLoading: false,
  hasMoreMessages: true,
  page: 1,
  limit: 50,

  // =====================
  // Fetch messages (pagination)
  // =====================
  getMessages: async (page = 1) => {
    set({ isMessagesLoading: true });

    try {
      const res = await axiosInstance.get(
        `/messages?page=${page}&limit=${get().limit}`
      );

      set((state) => ({
        messages:
          page === 1
            ? res.data
            : [...res.data, ...state.messages],
        page,
        hasMoreMessages: res.data.length === state.limit,
      }));
    } catch {
      toast.error("Failed to load messages");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  // =====================
  // Send message
  // =====================
  sendMessage: async (data) => {
    try {
      await axiosInstance.post("/messages", data);
      // message will arrive via socket
    } catch {
      toast.error("Failed to send message");
    }
  },

  // =====================
  // Delete message
  // =====================
  deleteMessage: async (id) => {
    try {
      await axiosInstance.delete(`/messages/${id}`);
      // update via socket
    } catch {
      toast.error("Failed to delete message");
    }
  },

  // =====================
  // Socket listeners (NO connect here)
  // =====================
  initSocket: () => {
    socket.off("newMessage");
    socket.off("deleteMessage");

    socket.on("newMessage", (message) => {
      set((state) => {
        // prevent duplicates
        if (state.messages.some((m) => m._id === message._id)) {
          return state;
        }
        return { messages: [...state.messages, message] };
      });
    });

    socket.on("deleteMessage", (id) => {
      set((state) => ({
        messages: state.messages.filter((m) => m._id !== id),
      }));
    });
  },

  // =====================
  // Reset on logout
  // =====================
  resetChat: () => {
    set({
      messages: [],
      page: 1,
      hasMoreMessages: true,
      isMessagesLoading: false,
    });
  },
}));
