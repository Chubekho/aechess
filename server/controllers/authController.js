// server/controllers/authController.js
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import passport from "passport";
import { validateEmail, validateUsername } from "../utils/validators.js";

// === HÀM HỖ TRỢ: Tạo JWT ===
const createToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email, username: user.username, role: user.role, isActive: user.isActive},
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

    // 2. Validate email
    if (!validateEmail(email)) {
      return res.status(400).json({ msg: "Email không hợp lệ." });
    }

    // 3. validate password length
    if (password.length < 6) {
      return res.status(400).json({ msg: "Mật khẩu phải có ít nhất 6 ký tự." });
    }

    // 4. validate duplicate email
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ msg: "Email đã được sử dụng." });
    }

    // 5. password hashing
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 4. create temp username
    // Ví dụ: user_1701234567890 (user_ + timestamp)
    const tempUsername = "user_" + Date.now();

    const newUser = new User({
      username: tempUsername,
      email,
      passwordHash,
      displayName: email.split("@")[0],
    });

    const savedUser = await newUser.save();

    // 5. Tạo JWT và trả về
    const token = createToken(savedUser);
    res.status(201).json({
      token,
      user: savedUser,
      isNew: true,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// @desc: User login
// @route: POST /api/auth/login
export const login = async (req, res) => {
  try {
    const { loginId, password } = req.body;

    // Check input login
    if (!loginId || !password) {
      return res
        .status(400)
        .json({ msg: "Vui lòng nhập tài khoản và mật khẩu." });
    }

    // 1. Check user
    const user = await User.findOne({
      $or: [{ email: loginId }, { username: loginId.toLowerCase() }],
    });

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
      return res
        .status(400)
        .json({ msg: "Email, username hoặc mật khẩu không đúng." });
    }

    // 4. Tạo JWT và trả về
    const token = createToken(user);
    res.status(200).json({
      token,
      user: user,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// @desc: Get current authenticated user
// @route: GET /api/auth/me
export const getMe = async (req, res) => {
  try {
    // Lấy cả passwordHash để kiểm tra
    const user = await User.findById(req.user.id); 
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    // Chuyển sang object để có thể thêm trường mới
    const userData = user.toObject();

    // Thêm trường hasPassword
    userData.hasPassword = !!user.passwordHash;

    // Xóa passwordHash khỏi object trả về
    delete userData.passwordHash;

    res.json(userData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
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
  const { user, isNew } = req.user;
  const token = createToken(user);

  if (isNew) {
    res.redirect(`${process.env.CLIENT_URL}/set-username?token=${token}`);
  } else {
    res.redirect(`${process.env.CLIENT_URL}/auth-callback?token=${token}`);
  }
};

// @desc: Google OAuth callback URL (handles redirect)
// @route: GET /api/auth/google/callback
export const googleCallback = [passportAuth, finalHandler];

// @desc: Cập nhật username (Dành cho user Google mới)
// @route: POST /api/auth/set-username
export const setUsername = async (req, res) => {
  try {
    const { username } = req.body;
    const userId = req.user.id; // Lấy từ middleware auth (token gửi lên)
    

    if (!username)
      return res.status(400).json({ msg: "Vui lòng nhập username" });

    // 1. VALIDATE USERNAME (Mới thêm)
    if (!validateUsername(username)) {
      return res.status(400).json({
        msg: "Username không hợp lệ (3-20 ký tự, không dấu, không khoảng trắng, chỉ gồm chữ, số, - và _).",
      });
    }

    // Check trùng
    const dup = await User.findOne({ username });
    if (dup) return res.status(400).json({ msg: "Username đã tồn tại" });

    // Update
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { username, displayName: username }, // Set luôn displayName ban đầu
      { new: true }
    );

    res.json({ user: updatedUser });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ msg: "Username đã tồn tại." });
    }
    res.status(500).json({ message: "Server error" });
  }
};
