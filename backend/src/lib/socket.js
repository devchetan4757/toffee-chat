import { createServer } from "http";
import { Server } from "socket.io";
import express from "express";

export const app = express();
export const server = createServer(app);

export const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log("✅ Socket connected:", socket.id);

  // Online users count
  io.emit("onlineUsersCount", io.of("/").sockets.size);

  socket.on("disconnect", (reason) => {
    console.log("❌ Socket disconnected:", socket.id, reason);
    io.emit("onlineUsersCount", io.of("/").sockets.size);
  });

  socket.on("error", (err) => {
    console.error("Socket error:", err);
  });
});
