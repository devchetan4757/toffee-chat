import { create } from "zustand";
import { toast } from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { socket } from "../lib/socket";

export const useChatStore = create((set, get) => ({
  messages: [],
  isMessagesLoading: false,

  // Fetch messages. If cursor is passed, fetch older messages and append at bottom
  getMessages: async (cursor) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get("/messages", {
        params: cursor ? { cursor } : {},
      });

      const newMessages = res.data || [];

      set((state) => {
        const existingIds = new Set(state.messages.map((m) => m._id));
        const filtered = newMessages.filter((m) => !existingIds.has(m._id));

        if (cursor) {
          // Old messages: append at bottom
          return { messages: [...state.messages, ...filtered] };
        } else {
          // Initial load or new messages: newest at top
          return { messages: [...filtered, ...state.messages] };
        }
      });
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to load messages");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (messageData) => {
    try {
      await axiosInstance.post("/messages/send", messageData);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to send message");
    }
  },

  deleteMessage: async (messageId) => {
    try {
      await axiosInstance.delete(`/messages/${messageId}`);
      set((state) => ({
        messages: state.messages.filter((m) => m._id !== messageId),
      }));
    } catch {
      toast.error("Failed to delete message");
    }
  },

  initSocket: () => {
    socket.off("newMessage");
    socket.off("deleteMessage");

    socket.on("newMessage", (message) => {
      set((state) => {
        if (state.messages.some((m) => m._id === message._id)) return state;
        return { messages: [message, ...state.messages] }; // Newest at top
      });
    });

    socket.on("deleteMessage", (id) => {
      set((state) => ({
        messages: state.messages.filter((m) => m._id !== id),
      }));
    });

    return () => {
      socket.off("newMessage");
      socket.off("deleteMessage");
    };
  },
}));
