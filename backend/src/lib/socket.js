import { Server } from "socket.io";
import http from "http";
import express from "express";
import Message from "../models/message.model.js";

const app = express();
const server = http.createServer(app);

// Was hardcoded to exactly "http://localhost:5173" — any other origin
// (a LAN IP, a deployed domain, a different dev port) would fail
// socket.io's CORS check. Mirrors the same allow-list as the REST CORS
// setup in index.js so a real deploy doesn't need two places updated.
const socketOrigin =
  process.env.NODE_ENV === "development"
    ? ["http://localhost:5173", "http://127.0.0.1:5173"]
    : true;

const io = new Server(server, {
  cors: {
    origin: socketOrigin,
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
