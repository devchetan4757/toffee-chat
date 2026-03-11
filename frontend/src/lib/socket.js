// src/lib/socket.js
import { io } from "socket.io-client";
import { useAuthStore } from "../store/useAuthStore";

const BASE_URL =
  import.meta.env.MODE === "development"
    ? "http://localhost:5001"
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
