// server/routes/authRoutes.js
import express from "express";

//import các midđleware khác...
import checkAuth from "../middleware/authMiddleware.js";
import {
  forgotPassword,
  getMe,
  googleAuth,
  googleCallback,
  login,
  register,
  resetPassword,
  setUsername,
} from "../controllers/authController.js";

const router = express.Router();

// === 1. ĐĂNG KÝ (REGISTER) ===
router.post("/register", register);

// === 2. ĐĂNG NHẬP (LOGIN) ===
router.post("/login", login);

// Tuyến đường ví dụ để check token
router.get("/me", checkAuth, getMe);

// === 3. GOOGLE AUTH ===
router.get("/google", googleAuth);

// Route callback Google sẽ redirect về
router.get("/google/callback", googleCallback);

// set username khi người dùng mới đăng ký hoặc đăng nhập lần đầu tiên với google
router.post("/set-username", checkAuth, setUsername);


// === 4. FORGOT/RESET PASSWORD ===
router.post("/forgot-password", forgotPassword);
router.put("/reset-password/:token", resetPassword);


export default router;
