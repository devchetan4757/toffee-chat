import { create } from "zustand";
import { toast } from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { socket } from "../lib/socket";

export const useChatStore = create((set, get) => ({
  messages: [],          // newest first
  isMessagesLoading: false,

  // Fetch messages; cursor is the _id of the **oldest** message you have
  getMessages: async (cursor) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get("/messages", {
        params: { cursor },
      });

      const fetchedMessages = res.data;

      set((state) => {
        if (!cursor) {
          // initial load, newest first
          return { messages: fetchedMessages };
        } else {
          // append older messages at the **end**
          return { messages: [...state.messages, ...fetchedMessages] };
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
        // **prepend** new message at top
        return { messages: [message, ...state.messages] };
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
