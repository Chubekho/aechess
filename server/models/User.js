// server/models/User.js
import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      lowercase: true, // Lưu thường để không phân biệt hoa thường khi login
    },
    passwordHash: {
      type: String,
      required: false,
    },
    displayName: {
      type: String,
      default: "New Player",
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true, // Cho phép nhiều 'null'
    },
    authProvider: {
      type: String,
      enum: ["local", "google", "hybrid"],
      default: "local",
    },
    preferences: {
      boardTheme: { type: String, default: "brown" },
      pieceTheme: { type: String, default: "neo" },
    },
    ratings: {
      bullet: { type: Number, default: 1200 },
      blitz: { type: Number, default: 1200 },
      rapid: { type: Number, default: 1200 },
      classical: { type: Number, default: 1200 },
    },
    puzzleStats: {
      rating: { type: Number, default: 1500 }, // Điểm hiển thị
      rd: { type: Number, default: 350 }, // Độ lệch chuẩn (Rating Deviation)
      vol: { type: Number, default: 0.06 }, // Độ biến động (Volatility)
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
); // Tự động thêm createdAt, updatedAt

const User = mongoose.model("User", UserSchema);
export default User;