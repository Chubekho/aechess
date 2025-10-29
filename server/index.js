// server/index.js
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
// Chạy config cho dotenv (để load file .env)
dotenv.config();

import passport from "passport";
import cors from "cors";

// Import file config Passport (chúng ta sẽ tạo ở Bước 6)
import "./config/passport.js";
// Import routes (chúng ta sẽ tạo ở Bước 3)
import authRoutes from "./routes/authRoutes.js";
import logger from "./middleware/logger.js"

const app = express();
const PORT = process.env.PORT || 8080;

// === Middlewares ===
// 1. CORS: Cho phép client gọi API
app.use(
  cors({
    origin: process.env.CLIENT_URL, // Chỉ cho phép client này
    credentials: true,
  })
);
// 2. Body Parser: Đọc req.body (dạng JSON)
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
app.use("/api/auth", authRoutes); // Gắn các route xác thực

app.listen(PORT, () => {
  console.log(`Server đang chạy tại http://localhost:${PORT}`); 
});
