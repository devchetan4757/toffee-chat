// src/lib/socket.js
import { io } from "socket.io-client";
import { useAuthStore } from "../store/useAuthStore";

// Must match the same host/port as axios.js — keep both in sync with
// VITE_API_URL (or the backend's actual PORT) to avoid the socket
// silently failing to connect against a dead port.
const BASE_URL =
  import.meta.env.MODE === "development"
    ? (import.meta.env.VITE_SOCKET_URL || "http://localhost:5000")
    : "/";

export const socket = io(BASE_URL, {
  withCredentials: true,
  autoConnect: false,
});

// call this after login/auth check
export const connectSocket = () => {
  const { role } = useAuthStore.getState();
  if (!role) return;
  if (!socket.connected) {
    socket.connect();
  }

  if (role) {
    socket.emit("join", role);
  }
};

// optional helper
export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
  }
};
