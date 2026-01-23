import { create } from "zustand";
import { toast } from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { socket } from "../lib/socket";

export const useChatStore = create((set, get) => ({
  messages: [],
  isMessagesLoading: false,

  // Fetch messages from backend
  getMessages: async (cursor) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get("/messages", { params: { cursor } });
      const fetchedMessages = res.data || [];

      set((state) => {
        if (!cursor) {
          // Initial load: newest first
          return { messages: fetchedMessages.reverse() };
        }

        // Older messages: reverse before appending at bottom
        const existingIds = new Set(state.messages.map((m) => m._id));
        const newMessages = fetchedMessages
          .filter((m) => !existingIds.has(m._id))
          .reverse(); // ✅ Reverse older messages

        return { messages: [...state.messages, ...newMessages] };
      });
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to load messages");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  // Send message
  sendMessage: async (messageData) => {
    try {
      await axiosInstance.post("/messages/send", messageData);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to send message");
    }
  },

  // Delete message
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

  // Initialize socket listeners
  initSocket: () => {
    socket.off("newMessage");
    socket.off("deleteMessage");

    socket.on("newMessage", (message) => {
      set((state) => {
        if (state.messages.some((m) => m._id === message._id)) return state;
        return { messages: [message, ...state.messages] }; // newest on top
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
