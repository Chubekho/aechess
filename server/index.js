// server/index.js
import express from "express";
import mongoose from "mongoose";
import { createServer } from "http";
import { Server } from "socket.io";
import initializeSocket from "./socket/socketHandler.js";
import dotenv from "dotenv";
// Chạy config cho dotenv (để load file .env)
dotenv.config();

import passport from "passport";
import cors from "cors";

// Import file config Passport
import "./config/passport.js";

// Import routes
import authRoutes from "./routes/authRoutes.js";
import gameRoutes from "./routes/gameRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import puzzleRoutes from "./routes/puzzleRoutes.js";
import friendRoutes from "./routes/friendRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";

// Import middleware
import logger from "./middleware/logger.js";

const app = express();
const PORT = process.env.PORT || 8080;

// === Khởi tạo Socket.IO Server ===
const httpServer = createServer(app); // Gói app Express
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL, // Cho phép client kết nối
    methods: ["GET", "POST"],
  },
});

// === Middlewares ===
// 1. CORS
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);

// 2. Body Parser
app.use(express.json());
// 3. Khởi tạo Passport
app.use(passport.initialize());

//logger middleware
app.use(logger);

// === Kết nối MongoDB ===
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Kết nối MongoDB thành công!"))
  .catch((err) => console.error("Lỗi kết nối MongoDB:", err));

// === Routes ===
app.use("/api/auth", authRoutes);
app.use("/api/games", gameRoutes);
app.use("/api/users", userRoutes);
app.use("/api/puzzle", puzzleRoutes);
app.use("/api/friends", friendRoutes);
app.use("/api/admin", adminRoutes);

// === Socket.IO ===

initializeSocket(io);

httpServer.listen(PORT, () => {
  console.log(`Server đang chạy (HTTP & Sockets) tại http://localhost:${PORT}`);
});
