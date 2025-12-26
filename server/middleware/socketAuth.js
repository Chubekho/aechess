// server/middleware/socketAuth.js
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const socketAuth = async (socket, next) => {
  try {
    const token = socket.handshake.query.token;
    if (!token) {
      return next(new Error("Authentication failed: No token provided."));
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await User.findById(decoded.id).select("-passwordHash");
    if (!user) {
      return next(new Error("Authentication failed: User not found."));
    }

    if (!user.isActive) {
      return next(new Error("Account is banned"));
    }
    
    socket.user = user;
    next();

  } catch (err) {
    next(new Error("Authentication failed: Invalid token."));
  }
};

export default socketAuth;