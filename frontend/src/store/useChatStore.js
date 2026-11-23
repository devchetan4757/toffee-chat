import { create } from "zustand";
import { toast } from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { socket } from "../lib/socket";
import { useAuthStore } from "./useAuthStore";

const MESSAGE_EFFECTS = [
  "fire",
  "love",
  "celebration",
  "gift",
];

const normalizeEffect = (effect) => {
  if (
    effect === null ||
    effect === undefined ||
    effect === ""
  ) {
    return null;
  }

  if (
    typeof effect !== "string" ||
    !MESSAGE_EFFECTS.includes(effect)
  ) {
    return null;
  }

  return effect;
};

export const useChatStore = create((set, get) => ({
  messages: [],
  isMessagesLoading: false,
  isFetchingMore: false,
  isFetchingNewer: false,
  hasMore: true,
  hasMoreNewer: false,
  scrollToMessageId: null,

  // ---------------- REPLY FEATURE ----------------

  replyTo: null,

  setReplyTo: (message) =>
    set({
      replyTo: message,
    }),

  clearReplyTo: () =>
    set({
      replyTo: null,
    }),

  // ---------------- GET MESSAGES ----------------

  getMessages: async (cursor, { burst = false } = {}) => {
    set(
      cursor
        ? { isFetchingMore: true }
        : { isMessagesLoading: true }
    );

    try {
      const res = await axiosInstance.get(
        "/messages",
        {
          params: {
            ...(cursor ? { cursor } : {}),
            limit: cursor ? (burst ? 150 : 50) : 150,
          },
        }
      );

      const { messages: fetched = [], hasMore = false } =
        res.data || {};

      set((state) => {
        const existingIds = new Set(
          state.messages.map(
            (message) => message._id
          )
        );

        const newMessages = fetched.filter(
          (message) => !existingIds.has(message._id)
        );

        return {
          // Both the server and store use newest-first order. Older
          // pages extend the list at the bottom without moving the view.
          messages: cursor
            ? [...state.messages, ...newMessages]
            : [...newMessages, ...state.messages],
          hasMore,
          ...(cursor ? {} : { hasMoreNewer: false }),
        };
      });
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          "Failed to load messages"
      );
    } finally {
      set(
        cursor
          ? { isFetchingMore: false }
          : { isMessagesLoading: false }
      );
    }
  },

  getNewerMessages: async (cursor) => {
    set({ isFetchingNewer: true });

    try {
      const res = await axiosInstance.get("/messages", {
        params: { cursor, direction: "newer", limit: 50 },
      });
      const { messages: fetched = [], hasMore = false } = res.data || {};

      set((state) => {
        const existingIds = new Set(
          state.messages.map((message) => message._id)
        );
        const newer = fetched
          .filter((message) => !existingIds.has(message._id))
          .reverse();

        return {
          messages: [...newer, ...state.messages],
          hasMoreNewer: hasMore,
        };
      });

      return true;
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          "Failed to load newer messages"
      );
      return false;
    } finally {
      set({ isFetchingNewer: false });
    }
  },

  searchMessages: async (query, cursor) => {
    try {
      const res = await axiosInstance.get("/messages/search", {
        params: {
          q: query,
          ...(cursor ? { cursor } : {}),
          limit: 40,
        },
      });

      return res.data;
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          "Failed to search messages"
      );
      return null;
    }
  },

  loadMessagesAround: async (id) => {
    if (get().messages.some((message) => message._id === id)) {
      set({ scrollToMessageId: id });
      return true;
    }

    set({ isMessagesLoading: true });

    try {
      const res = await axiosInstance.get(`/messages/around/${id}`, {
        params: { limit: 30 },
      });
      const {
        messages = [],
        hasMoreNewer = false,
        hasMoreOlder = false,
      } = res.data || {};

      set({
        messages,
        hasMoreNewer,
        hasMore: hasMoreOlder,
        scrollToMessageId: id,
      });

      return true;
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          "Failed to open search result"
      );
      return false;
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  clearScrollToMessage: () => set({ scrollToMessageId: null }),

  // ---------------- SEND MESSAGE ----------------

  sendMessage: async (data) => {
    try {
      const { role } =
        useAuthStore.getState();

      /*
       * Keep the existing logger behaviour.
       */
      const messageWithLogger = {
        ...data,
        logger: role || null,
      };

      /*
       * ---------------- EFFECT SUPPORT ----------------
       *
       * MessageInput currently sends:
       *
       *   effect: "fire"
       *
       * We also accept:
       *
       *   effect_type: "fire"
       *
       * for compatibility with the backend/schema.
       *
       * The normalised value is sent as `effect`.
       */
      const requestedEffect =
        data?.effect !== undefined
          ? data.effect
          : data?.effect_type;

      const normalizedEffect =
        normalizeEffect(
          requestedEffect
        );

      /*
       * Never send an invalid effect to the backend.
       */
      const finalMessage = {
        ...messageWithLogger,
        effect: normalizedEffect,
      };

      /*
       * Remove effect_type from the outgoing
       * payload if the caller supplied it.
       *
       * The backend still accepts effect_type,
       * but keeping one canonical field avoids
       * duplicate/conflicting values.
       */
      delete finalMessage.effect_type;

      await axiosInstance.post(
        "/messages/send",
        finalMessage
      );

      /*
       * Existing reply behaviour.
       */
      set({
        replyTo: null,
      });
    } catch (error) {
      console.error(
        "Failed to send message:",
        error
      );

      toast.error(
        error?.response?.data?.message ||
          "Failed to send message"
      );
    }
  },

  // ---------------- DELETE MESSAGE ----------------

  deleteMessage: async (id) => {
    try {
      await axiosInstance.delete(
        `/messages/${id}`
      );

      /*
       * Keep the existing immediate UI update.
       * The socket event will also arrive, but the
       * socket handler below safely handles an already
       * removed message.
       */
      set((state) => ({
        messages:
          state.messages.filter(
            (message) =>
              message._id !== id
          ),
      }));
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
          "Failed to delete message"
      );
    }
  },

  // ---------------- INIT SOCKET ----------------

  initSocket: () => {
    /*
     * Prevent duplicate listeners when the chat
     * component initializes more than once.
     */
    socket.off("newMessage");
    socket.off("deleteMessage");
    socket.off("messageStatus");
    socket.off("onlineUsers");

    const { role } =
      useAuthStore.getState();

    /*
     * Existing room/join behaviour.
     */
    if (role) {
      socket.emit("join", role);
    }

    // ---------------- NEW MESSAGE ----------------

    socket.on(
      "newMessage",
      (message) => {
        /*
         * The effect is persisted by MongoDB and
         * broadcast through Socket.IO as part of
         * the normal message object.
         *
         * Example:
         *
         * {
         *   _id: "...",
         *   text: "Hello",
         *   effect: "hearts",
         *   ...
         * }
         */
        const normalizedMessage = {
          ...message,

          /*
           * Support older messages that may have
           * effect_type instead of effect.
           */
          effect:
            message?.effect !== undefined
              ? normalizeEffect(
                  message.effect
                )
              : normalizeEffect(
                  message?.effect_type
                ),
        };

        set((state) => {
          /*
           * Existing delivery acknowledgement.
           */
          socket.emit(
            "messageDelivered",
            message._id
          );

          /*
           * Prevent duplicate messages.
           */
          if (
            state.messages.some(
              (existingMessage) =>
                existingMessage._id ===
                message._id
            )
          ) {
            return state;
          }

          /*
           * Keep existing newest-first socket
           * insertion behaviour.
           */
          return {
            messages: [
              normalizedMessage,
              ...state.messages,
            ],
          };
        });
      }
    );

    // ---------------- MESSAGE STATUS ----------------

    socket.on(
      "messageStatus",
      ({ id, status }) => {
        set((state) => ({
          messages:
            state.messages.map(
              (message) =>
                message._id === id
                  ? {
                      ...message,
                      status,
                    }
                  : message
            ),
        }));
      }
    );

    // ---------------- DELETE MESSAGE ----------------

    socket.on(
      "deleteMessage",
      (id) => {
        set((state) => ({
          messages:
            state.messages.filter(
              (message) =>
                message._id !== id
            ),
        }));
      }
    );

    // ---------------- ONLINE USERS ----------------

    socket.on(
      "onlineUsers",
      (users) => {
        set({
          onlineUsers: users,
        });
      }
    );

    // ---------------- CLEANUP ----------------

    return () => {
      socket.off("newMessage");
      socket.off("deleteMessage");
      socket.off("messageStatus");
      socket.off("onlineUsers");
    };
  },
}));
