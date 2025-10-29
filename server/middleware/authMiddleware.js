// server/middleware/authMiddleware.js
import jwt from "jsonwebtoken";

const checkAuth = (req, res, next) => {
  try {
    // 1. Lấy token từ header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ msg: "Không có quyền truy cập (không có token)." });
    }
    
    const token = authHeader.split(" ")[1]; // "Bearer <token>"

    // 2. Xác thực token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3. Gắn thông tin user vào request
    req.user = decoded; // { id: '...', email: '...' }
    next();

  } catch (err) {
    res.status(401).json({ msg: "Token không hợp lệ." });
  }
};

export default checkAuth;