// server/routes/authRoutes.js
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import passport from "passport";

//import các midđleware khác...
import checkAuth from "../middleware/authMiddleware.js";

const router = express.Router();

// === HÀM HỖ TRỢ: Tạo JWT ===
const createToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "1d" } // Token hết hạn sau 1 ngày
  );
};

// === 1. ĐĂNG KÝ (REGISTER) ===
// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Check input
    if (!email || !password) {
      return res
        .status(400)
        .json({ msg: "Vui lòng nhập đủ email và password." });
    }

    // 2. Check user tồn tại
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ msg: "Email này đã được sử dụng." });
    }

    // 3. Băm mật khẩu
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 4. Tạo user mới
    const newUser = new User({
      email,
      passwordHash,
      displayName: email.split("@")[0], // Tên mặc định là phần trước @
    });
    
    const savedUser = await newUser.save();

    // 5. Tạo JWT và trả về
    const token = createToken(savedUser);
    res.status(201).json({
      token,
      user: {
        id: savedUser._id,
        email: savedUser.email,
        displayName: savedUser.displayName,
        rating: savedUser.rating,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// === 2. ĐĂNG NHẬP (LOGIN) ===
// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Check user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: "Email hoặc mật khẩu không đúng." });
    }
    // 2. Check user có password (tránh user Google login)
    if (!user.passwordHash) {
      return res
        .status(400)
        .json({
          msg: "Tài khoản này đăng ký qua Google. Vui lòng đăng nhập bằng Google.",
        });
    }

    // 3. So sánh password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ msg: "Email hoặc mật khẩu không đúng." });
    }

    // 4. Tạo JWT và trả về
    const token = createToken(user);
    res.status(200).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        displayName: user.displayName,
        rating: user.rating,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// === 3. GOOGLE AUTH ===

// Route này bắt đầu quá trình xác thực Google
// GET /api/auth/google
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"], // Yêu cầu lấy profile và email
    session: false,
  })
);

// Route callback Google sẽ redirect về
// GET /api/auth/google/callback
router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: `${process.env.CLIENT_URL}/login?error=true`, // Redirect về client nếu lỗi
    session: false,
  }),
  (req, res) => {
    // Đăng nhập thành công, req.user chứa thông tin user từ Passport
    // Tạo JWT
    const token = createToken(req.user);

    // Redirect về CLIENT với token (ví dụ: http://localhost:5173/auth/google/success?token=...)
    // Client sẽ nhận token này từ URL và lưu vào localStorage
    res.redirect(`${process.env.CLIENT_URL}/auth-callback?token=${token}`);
  }
);

// GET /api/auth/me (Tuyến đường ví dụ để check token)
router.get("/me", checkAuth, async (req, res) => {
  // Nhờ 'checkAuth', chúng ta có req.user
  const user = await User.findById(req.user.id).select("-passwordHash");
  res.json(user);
});

export default router;
