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
    // Không 'required' vì user có thể login bằng Google
    passwordHash: {
      type: String,
    },
    // Tên hiển thị (lấy từ Google hoặc cho user tự đặt sau)
    displayName: {
      type: String,
      default: "New Player",
    },
    // Dùng để liên kết tài khoản Google
    googleId: {
      type: String,
      unique: true,
      sparse: true, // Cho phép nhiều 'null'
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
  },
  { timestamps: true }
); // Tự động thêm createdAt, updatedAt

const User = mongoose.model("User", UserSchema);
export default User;
