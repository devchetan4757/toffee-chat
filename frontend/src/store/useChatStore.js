import { create } from "zustand";
import { toast } from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { socket } from "../lib/socket";

export const useChatStore = create((set, get) => ({
  messages: [],          // currently displayed messages (newest first)
  olderMessages: [],     // preloaded older messages
  isMessagesLoading: false,
  hasMore: true,         // are there older messages to load?
  replyTo: null,

  setReplyTo: (message) => set({ replyTo: message }),
  clearReplyTo: () => set({ replyTo: null }),

  // fetch messages
  getMessages: async (cursor = null, limit = 50, prepend = false) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get("/messages", {
        params: { cursor, limit },
      });
      const fetched = res.data || [];

      set((state) => {
        const newMessages = fetched.filter(
          (m) => !state.messages.some((msg) => msg._id === m._id)
        );

        if (!cursor) {
          // initial load → newest messages
          return {
            messages: newMessages,
            hasMore: fetched.length === limit,
          };
        }

        // fetch older messages (background preload)
        if (!prepend) {
          return {
            olderMessages: newMessages,
            hasMore: fetched.length === limit,
          };
        }

        // user requested to load older → prepend to messages
        return {
          messages: [...state.messages, ...state.olderMessages],
          olderMessages: [],
          hasMore: state.hasMore,
        };
      });
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to load messages");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  // load older messages when user clicks button
  loadOlderMessages: async (limit = 50) => {
    const state = get();
    if (!state.hasMore) return;

    // if preloaded messages exist, just append
    if (state.olderMessages.length > 0) {
      set((s) => ({
        messages: [...s.messages, ...s.olderMessages],
        olderMessages: [],
      }));

      // preload next batch
      const oldestId = state.messages[state.messages.length - 1]?._id;
      get().getMessages(oldestId, limit);
      return;
    }

    // otherwise fetch older from API
    const oldestId = state.messages[state.messages.length - 1]?._id;
    if (!oldestId) return;
    await get().getMessages(oldestId, limit, true);
  },

  sendMessage: async (data) => {
    try {
      await axiosInstance.post("/messages/send", data);
      set({ replyTo: null });
    } catch {
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
