import { Server } from "socket.io";
import http from "http";
import express from "express";

const app = express();
const server = http.createServer(app);

// =====================
// Socket.io setup
// =====================
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173"],
  },
});

// =====================
// In-memory messages store
// Replace with DB if needed
// =====================
let messages = []; // Each message: { _id, text, createdAt }
let nextId = 1;

io.on("connection", (socket) => {
  console.log("A user connected", socket.id);

  // Send current online users count
  io.emit("onlineCount", io.engine.clientsCount);

  // =====================
  // Listen for new messages from frontend
  // =====================
  socket.on("sendMessage", (messageData) => {
    const newMessage = {
      _id: String(nextId++),
      text: messageData.text,
      createdAt: new Date(),
    };
    messages.push(newMessage);

    // Broadcast to all clients
    io.emit("newMessage", newMessage);
  });

  // =====================
  // Listen for delete requests
  // =====================
  socket.on("deleteMessage", (id) => {
    messages = messages.filter((m) => m._id !== id);
    io.emit("deleteMessage", id);
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected", socket.id);
    io.emit("onlineCount", io.engine.clientsCount);
  });
});

export { io, app, server };
