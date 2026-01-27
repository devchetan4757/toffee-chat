import { create } from "zustand";
import { toast } from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { socket } from "../lib/socket";

export const useChatStore = create((set, get) => ({
  messages: [],
  preloadedMessages: [], // buffer for older messages
  isMessagesLoading: false,
  isPreloading: false,

  // 🔹 REPLY STATE
  replyTo: null,
  setReplyTo: (message) => set({ replyTo: message }),
  clearReplyTo: () => set({ replyTo: null }),

  // Fetch messages
  getMessages: async (cursor, preload = false) => {
    if (!preload) set({ isMessagesLoading: true });
    else set({ isPreloading: true });

    try {
      const res = await axiosInstance.get("/messages", {
        params: cursor ? { cursor, limit: 50 } : { limit: 50 },
      });

      const fetched = res.data || [];

      if (!cursor) {
        // Initial load (newest → oldest)
        set({ messages: fetched.reverse() });

        // Start background preload of next chunk
        if (fetched.length > 0) {
          get().getMessages(fetched[fetched.length - 1]._id, true);
        }
      } else if (preload) {
        // Store older messages in preloaded buffer
        set((state) => ({
          preloadedMessages: fetched.reverse(),
        }));
      } else {
        // User requested older messages
        const existingIds = new Set(get().messages.map((m) => m._id));
        const older = fetched
          .filter((m) => !existingIds.has(m._id))
          .reverse();

        set((state) => ({
          messages: [...state.messages, ...older],
          preloadedMessages: [],
        }));

        // Preload next chunk in background
        if (fetched.length > 0) {
          get().getMessages(fetched[fetched.length - 1]._id, true);
        }
      }
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Failed to load messages"
      );
    } finally {
      if (!preload) set({ isMessagesLoading: false });
      else set({ isPreloading: false });
    }
  },

  sendMessage: async (data) => {
    try {
      await axiosInstance.post("/messages/send", data);
      set({ replyTo: null });
    } catch (error) {
      toast.error("Failed to send message");
    }
  },

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

  initSocket: () => {
    socket.off("newMessage");
    socket.off("deleteMessage");

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

    return () => {
      socket.off("newMessage");
      socket.off("deleteMessage");
    };
  },
}));
