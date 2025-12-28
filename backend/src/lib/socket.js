import { createServer } from "http";
import { Server } from "socket.io";
import express from "express";

export const app = express();
export const server = createServer(app);

export const io = new Server(server, {
  cors: {
    origin:
      process.env.NODE_ENV === "production"
        ? "https://your-production-domain.com"
        : "http://localhost:5173",
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);
  io.emit("onlineUsersCount", io.of("/").sockets.size);

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
    io.emit("onlineUsersCount", io.of("/").sockets.size);
  });
});
