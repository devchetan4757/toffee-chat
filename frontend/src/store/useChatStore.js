import { create } from "zustand";
import { toast } from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { socket } from "../lib/socket";

export const useChatStore = create((set, get) => ({
  messages: [],
  isMessagesLoading: false,

  getMessages: async () => {
  set({ isMessagesLoading: true });
  try {
    const res = await axiosInstance.get("/messages");
    set({ messages: res.data });
  } catch (error) {
    toast.error(
      error?.response?.data?.message || "Failed to load messages"
    );
  } finally {
    set({ isMessagesLoading: false });
  }
},

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
    // ✅ Prevent duplicate listeners
    socket.off("newMessage");
    socket.off("deleteMessage");
    
    socket.on("newMessage", (message) => {
    console.log("Socket newMessage received:", message);
      set((state) => ({
        messages: [...state.messages, message],
      }));
    });

    socket.on("deleteMessage", (id) => {
      set((state) => ({
        messages: state.messages.filter((m) => m._id !== id),
      }));
    });

    // ✅ Cleanup function
    return () => {
      socket.off("newMessage");
      socket.off("deleteMessage");
    };
  },
}));
