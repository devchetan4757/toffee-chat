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

let onlineUsers = {};

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // when user joins
  socket.on("join", (role) => {
    onlineUsers[role] = socket.id;

    io.emit("onlineUsers", Object.keys(onlineUsers));
  });

  // typing
  socket.on("typing", (role) => {
    socket.broadcast.emit("typing", role);
  });

  socket.on("stopTyping", (role) => {
    socket.broadcast.emit("stopTyping", role);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);

    for (const role in onlineUsers) {
      if (onlineUsers[role] === socket.id) {
        delete onlineUsers[role];
      }
    }

    io.emit("onlineUsers", Object.keys(onlineUsers));
  });
});

export { io, app, server };
