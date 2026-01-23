import { create } from "zustand";
import { toast } from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { socket } from "../lib/socket";

export const useChatStore = create((set, get) => ({
  messages: [],
  isMessagesLoading: false,

  // Fetch messages from backend
  getMessages: async (cursor = null) => {
  set({ isMessagesLoading: true });

  try {
    const url = cursor ? `/messages?cursor=${cursor}` : "/messages";
    const res = await axiosInstance.get(url);

    set((state) => {
      // first load = replace
      if (!cursor) {
        return { messages: res.data };
      }

      // cursor load = prepend older messages
      const existingIds = new Set(state.messages.map((m) => m._id));
      const olderUnique = res.data.filter((m) => !existingIds.has(m._id));

      return { messages: [...olderUnique, ...state.messages] };
    });
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
    socket.on("newMessage", (message) => {
  set((state) => {
    if (state.messages.some((m) => m._id === message._id)) {
      return state;
    }
    return { messages: [...state.messages, message] };
  });
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
