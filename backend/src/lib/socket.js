import { Server } from "socket.io";
import http from "http";
import express from "express";
import Message from "../models/message.model.js";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173"],
    credentials: true,
  },
});

// store online users
let onlineUsers = {};
let disconnectTimers = {};

io.on("connection", (socket) => {

  // =========================
  // USER JOIN
  // =========================
  socket.on("join", (role) => {
    socket.role = role;

    console.log("JOIN:", role);

    // cancel pending disconnect timer if reconnecting
    if (disconnectTimers[role]) {
      clearTimeout(disconnectTimers[role]);
      delete disconnectTimers[role];
    }

    onlineUsers[role] = socket.id;


    io.emit("onlineUsers", Object.keys(onlineUsers));
  });

  // =========================
  // TYPING
  // =========================
  socket.on("typing", (data) => {
    socket.broadcast.emit("typing", data);
  });

  socket.on("stopTyping", (data) => {
    socket.broadcast.emit("typing", { ...data, typing: false });
  });
  //messageSeen
  socket.on("messageSeen", async (id) => {

  await Message.findByIdAndUpdate(id, {
    status: "seen"
  });

  io.emit("messageStatus", {
    id,
    status: "seen"
  });

});
  //MessageDelivered
  socket.on("messageDelivered", async (id) => {

  await Message.findByIdAndUpdate(id, {
    status: "delivered"
  });

  io.emit("messageStatus", {
    id,
    status: "delivered"
  });

});
  // =========================
  // DISCONNECT
  // =========================
  socket.on("disconnect", () => {

    const role = socket.role;

    if (!role) return;

    // delay removal to prevent flicker
    disconnectTimers[role] = setTimeout(() => {
      if (onlineUsers[role] === socket.id) {
        delete onlineUsers[role];
      }


      io.emit("onlineUsers", Object.keys(onlineUsers));

      delete disconnectTimers[role];
    }, 10000); // 5 second delay
  });
});

export { io, app, server };
