import crypto from "crypto";
import bcrypt from "bcryptjs";
import sendEmail from "../utils/sendEmail.js";
import passport from "passport";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { validateEmail, validateUsername } from "../utils/validators.js";

// === HELPER FUNCTION: Create JWT ===
const createToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email, username: user.username, role: user.role, isActive: user.isActive, avatar: user.avatar},
    process.env.JWT_SECRET,
    { expiresIn: "1d" } // Token expires in 1 day
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
        .json({ msg: "Vui lòng cung cấp cả email và mật khẩu." });
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
    // Example: user_1701234567890 (user_ + timestamp)
    const tempUsername = "user_" + Date.now();

    const newUser = new User({
      username: tempUsername,
      email,
      passwordHash,
      displayName: email.split("@")[0],
    });

    const savedUser = await newUser.save();

    // 5. Create and return JWT
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
      return res.status(400).json({ msg: "Thông tin đăng nhập không chính xác." });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({ 
        msg: `Tài khoản của bạn đã bị vô hiệu hóa. Lý do: ${user.banReason || 'Vi phạm tiêu chuẩn cộng đồng'}` 
      });
    }

    // 2. Check user has password (to avoid Google users logging in with password)
    if (!user.passwordHash) {
      return res.status(400).json({
        msg: "Tài khoản này được đăng ký qua Google. Vui lòng đăng nhập bằng Google.",
      });
    }

    // 3. Compare password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res
        .status(400)
        .json({ msg: "Thông tin đăng nhập không chính xác." });
    }

    // 4. Create and return JWT
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
    const user = await User.findById(req.user.id); 
    if (!user) {
      return res.status(404).json({ msg: "Không tìm thấy người dùng." });
    }

    if (!user.isActive) {
      return res.status(403).json({ msg: "Tài khoản của bạn đã bị vô hiệu hóa." });
    }

    // Convert to object to add a new field
    const userData = user.toObject();

    // Add hasPassword field
    userData.hasPassword = !!user.passwordHash;

    // Remove passwordHash from the returned object
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
  scope: ["profile", "email"], // Request profile and email
  session: false,
});

// --- Logic for Google Callback ---

// 1. Passport authentication middleware
const passportAuth = passport.authenticate("google", {
  failureRedirect: `${process.env.CLIENT_URL}/login?error=true`,
  session: false,
});

// 2. Final handler (after Passport runs successfully)
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

// @desc: Set/update username (For new Google users)
// @route: POST /api/auth/set-username
export const setUsername = async (req, res) => {
  try {
    const { username } = req.body;
    const userId = req.user.id; // From auth middleware (token)
    

    if (!username)
      return res.status(400).json({ msg: "Vui lòng nhập username." });

    // 1. VALIDATE USERNAME
    if (!validateUsername(username)) {
      return res.status(400).json({
        msg: "Username không hợp lệ (3-20 ký tự, chỉ gồm chữ, số, - và _).",
      });
    }

    // Check for duplicates
    const dup = await User.findOne({ username });
    if (dup) return res.status(400).json({ msg: "Username đã tồn tại." });

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { username, displayName: username }, // Also set initial displayName
      { new: true }
    );

    res.json({ user: updatedUser });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ msg: "Username đã tồn tại." });
    }
    res.status(500).json({ message: "Lỗi máy chủ." });
  }
};


// @desc: Forgot password
// @route: POST /api/auth/forgot-password
export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ msg: "Vui lòng nhập email." });
  }

  let user;
  try {
    user = await User.findOne({ email });
    if (!user) {
      // Don't reveal that the user doesn't exist
      return res.status(200).json({ msg: "Nếu email tồn tại, bạn sẽ nhận được một liên kết đặt lại mật khẩu." });
    }

    // Restriction for Google users
    if (!user.passwordHash) {
      return res.status(400).json({ msg: "Tài khoản này đăng nhập bằng Google, không thể đặt lại mật khẩu." });
    }

    // 1. Generate token
    const resetToken = crypto.randomBytes(20).toString('hex');

    // 2. Hash token and set to resetPasswordToken field
    user.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // 3. Set expire time (10 minutes)
    user.resetPasswordExpires = Date.now() + 10 * 60 * 1000;
    
    await user.save({ validateBeforeSave: false });

    // 4. Create reset URL
    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
    const message = `Bạn nhận được email này vì bạn (hoặc ai đó) đã yêu cầu đặt lại mật khẩu cho tài khoản của bạn.\n\nVui lòng nhấn vào liên kết sau hoặc dán vào trình duyệt để hoàn tất quá trình:\n\n${resetUrl}\n\nNếu bạn không yêu cầu điều này, vui lòng bỏ qua email này và mật khẩu của bạn sẽ không thay đổi. Liên kết sẽ hết hạn sau 10 phút.`;

    // 5. Send email
    try {
      await sendEmail({
        email: user.email,
        subject: 'Yêu cầu đặt lại mật khẩu AE-Chess',
        message,
        html: `<p>Bạn nhận được email này vì bạn (hoặc ai đó) đã yêu cầu đặt lại mật khẩu cho tài khoản của bạn.</p><p>Vui lòng nhấn vào liên kết sau hoặc dán vào trình duyệt để hoàn tất quá trình:</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>Nếu bạn không yêu cầu điều này, vui lòng bỏ qua email này và mật khẩu của bạn sẽ không thay đổi. Liên kết sẽ hết hạn sau 10 phút.</p>`
      });
      res.status(200).json({ msg: "Email đặt lại mật khẩu đã được gửi." });
    } catch (emailError) {
      console.error("Failed to send password reset email:", emailError);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save({ validateBeforeSave: false });
      res.status(500).json({ msg: "Lỗi khi gửi email. Vui lòng thử lại sau." });
    }

  } catch (error) {
    console.error("Forgot Password Error:", error);
    res.status(500).json({ msg: "Đã có lỗi xảy ra phía máy chủ." });
  }
};

// @desc: Reset password
// @route: PUT /api/auth/reset-password/:token
export const resetPassword = async (req, res) => {
    // 1. Get user based on the hashed token
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    try {
        const user = await User.findOne({
            resetPasswordToken,
            resetPasswordExpires: { $gt: Date.now() },
        });

        if (!user) {
            return res.status(400).json({ msg: "Token không hợp lệ hoặc đã hết hạn." });
        }

        const { password } = req.body;
        if (!password || password.length < 6) {
            return res.status(400).json({ msg: "Mật khẩu phải có ít nhất 6 ký tự." });
        }

        // 2. Set new password
        const salt = await bcrypt.genSalt(10);
        user.passwordHash = await bcrypt.hash(password, salt);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        await user.save();

        // Optional: Log the user in automatically
        const token = createToken(user);
        res.status(200).json({
            token,
            user,
            msg: "Mật khẩu đã được đặt lại thành công."
        });

    } catch (error) {
        console.error("Reset Password Error:", error);
        res.status(500).json({ msg: "Đã có lỗi xảy ra phía máy chủ." });
    }
};
