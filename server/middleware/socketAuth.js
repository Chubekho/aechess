// server/middleware/socketAuth.js
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const socketAuth = async (socket, next) => {
  try {
    // 1. Lấy token từ query
    const token = socket.handshake.query.token;
    if (!token) {
      return next(new Error("Xác thực thất bại: Không có token."));
    }
    
    // 2. Giải mã token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 3. Tìm user trong DB (lấy cả rating)
    const user = await User.findById(decoded.id).select("-passwordHash");
    if (!user) {
      return next(new Error("Xác thực thất bại: User không tồn tại."));
    }
    
    // 4. Gắn user vào socket để dùng ở mọi nơi
    socket.user = user;
    next();

  } catch (err) {
    next(new Error("Xác thực thất bại: Token không hợp lệ."));
  }
};

export default socketAuth;