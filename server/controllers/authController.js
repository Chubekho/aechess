// server/controllers/authController.js
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import passport from "passport";
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
        .json({ msg: "Please provide both email and password." });
    }

    // 2. Validate email
    if (!validateEmail(email)) {
      return res.status(400).json({ msg: "Invalid email." });
    }

    // 3. validate password length
    if (password.length < 6) {
      return res.status(400).json({ msg: "Password must be at least 6 characters long." });
    }

    // 4. validate duplicate email
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ msg: "Email is already in use." });
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
        .json({ msg: "Please enter your login ID and password." });
    }

    // 1. Check user
    const user = await User.findOne({
      $or: [{ email: loginId }, { username: loginId.toLowerCase() }],
    });

    if (!user) {
      return res.status(400).json({ msg: "Invalid credentials." });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({ 
        msg: `Your account has been disabled. Reason: ${user.banReason || 'Community standards violation'}` 
      });
    }

    // 2. Check user has password (to avoid Google users logging in with password)
    if (!user.passwordHash) {
      return res.status(400).json({
        msg: "This account was registered via Google. Please log in with Google.",
      });
    }

    // 3. Compare password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res
        .status(400)
        .json({ msg: "Invalid credentials." });
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
      return res.status(404).json({ msg: "User not found" });
    }

    if (!user.isActive) {
      return res.status(403).json({ msg: "Your account has been deactivated." });
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
      return res.status(400).json({ msg: "Please enter a username." });

    // 1. VALIDATE USERNAME
    if (!validateUsername(username)) {
      return res.status(400).json({
        msg: "Invalid username (3-20 characters, letters, numbers, '-', and '_' allowed).",
      });
    }

    // Check for duplicates
    const dup = await User.findOne({ username });
    if (dup) return res.status(400).json({ msg: "Username already exists." });

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { username, displayName: username }, // Also set initial displayName
      { new: true }
    );

    res.json({ user: updatedUser });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ msg: "Username already exists." });
    }
    res.status(500).json({ message: "Server error" });
  }
};
