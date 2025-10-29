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
    rating: {
      type: Number,
      default: 1200,
    },
  },
  { timestamps: true }
); // Tự động thêm createdAt, updatedAt

const User = mongoose.model("User", UserSchema);
export default User;
