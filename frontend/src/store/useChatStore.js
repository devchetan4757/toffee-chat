import { create } from "zustand";
import { toast } from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { socket } from "../lib/socket";

export const useChatStore = create((set, get) => ({
  messages: [],
  isMessagesLoading: false,

  // Fetch messages from backend
  getMessages: async () => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get("/messages");
      set({ messages: res.data });
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to load messages");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  // Send message to backend
  sendMessage: async (messageData) => {
    try {
      const res = await axiosInstance.post("/messages/send", messageData);
      set((state) => ({
        messages: [...state.messages, res.data],
      }));
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
    // Remove old listeners to prevent duplicates
    socket.off("newMessage");
    socket.off("deleteMessage");

    // Listen for new messages
    socket.on("newMessage", (message) =>{

      // Ensure message.image is a string before adding
      const cleanMessage = {
        _id: message._id,
        text: message.text,
        image: typeof message.image === "string" ? message.image : "", // fallback
        createdAt: message.createdAt,
        updatedAt: message.updatedAt,
      };

      set((state) => ({
        messages: [...state.messages, cleanMessage],
      }));
    });

    // Listen for deleted messages
    socket.on("deleteMessage", (id) => {
      set((state) => ({
        messages: state.messages.filter((m) => m._id !== id),
      }));
    });

    // Optional cleanup function
    return () => {
      socket.off("newMessage");
      socket.off("deleteMessage");
    };
  },
}));
