import { Server } from "socket.io";
import http from "http";
import express from "express";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173"],
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  io.emit("onlineUsersCount", io.engine.clientsCount);

  // =====================
  // Typing indicator
  // =====================
  socket.on("typing", (role) => {
    socket.broadcast.emit("typing", role);
  });

  socket.on("stopTyping", (role) => {
    socket.broadcast.emit("stopTyping", role);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);

    io.emit("onlineUsersCount", io.engine.clientsCount);
  });
});

export { io, app, server };
