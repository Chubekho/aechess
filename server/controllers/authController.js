// server/controllers/authController.js
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import passport from "passport";

// === HÀM HỖ TRỢ: Tạo JWT ===
const createToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "1d" } // Token hết hạn sau 1 ngày
  );
};

// @desc: user registration
// @route: POST /api/auth/register
export const register = async (req, res) => {
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
};

// @desc: User login
// @route: POST /api/auth/login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Check user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: "Email hoặc mật khẩu không đúng." });
    }
    // 2. Check user có password (tránh user Google login)
    if (!user.passwordHash) {
      return res.status(400).json({
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
};

// @desc: Get current authenticated user
// @route: GET /api/auth/me
export const getMe = async (req, res) => {
  const user = await User.findById(req.user.id).select("-passwordHash");
  if (!user) {
    return res.status(404).json({ msg: "User not found" });
  }

  // SỬA LỖI: Chuyển đổi sang object thường và map _id thành id
  const userData = {
    id: user._id, // Map _id -> id
    email: user.email,
    displayName: user.displayName,
    ratings: user.ratings,
    puzzleStats: user.puzzleStats,
    createdAt: user.createdAt,
  };

  res.json(userData);
};

// === 3. GOOGLE AUTH ===

// @desc: Authenticate user using Google (starts the process)
// @route: GET /api/auth/google
export const googleAuth = passport.authenticate("google", {
  scope: ["profile", "email"], // Yêu cầu lấy profile và email
  session: false,
});

// --- Logic cho Google Callback ---

// 1. Middleware xác thực của Passport
const passportAuth = passport.authenticate("google", {
  failureRedirect: `${process.env.CLIENT_URL}/login?error=true`,
  session: false,
});

// 2. Handler cuối cùng (sau khi Passport chạy thành công)
const finalHandler = (req, res) => {
  // Đăng nhập thành công, req.user chứa thông tin user từ Passport
  const token = createToken(req.user);

  // Redirect về CLIENT với token
  res.redirect(`${process.env.CLIENT_URL}/auth-callback?token=${token}`);
};

// 3. Export cả hai dưới dạng một mảng
// @desc: Google OAuth callback URL (handles redirect)
// @route: GET /api/auth/google/callback
export const googleCallback = [passportAuth, finalHandler];
