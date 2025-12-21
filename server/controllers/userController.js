import User from "../models/User.js";
import bcrypt from "bcryptjs";

// @desc: Lấy thông tin công khai của user bằng ID
// @route: GET /api/users/:id
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select(
      "-passwordHash -email -googleId -__v" // Exclude sensitive fields
    );

    if (!user) {
      return res.status(404).json({ msg: "Người chơi không tồn tại." });
    }

    // Return the user object directly. Any new fields will be included automatically.
    res.status(200).json(user);

  } catch (err) {
    if (err.name === "CastError") {
      return res.status(404).json({ msg: "Người chơi không tồn tại." });
    }
    res.status(500).json({ error: err.message });
  }
};

// @desc: Lấy thông tin công khai của user bằng USERNAME
// @route: GET /api/users/profile/:username
export const getUserProfile = async (req, res) => {
  try {
    const { username } = req.params;
    
    const user = await User.findOne({
      username: username.toLowerCase(),
    }).select("-passwordHash -email -googleId -__v"); // Exclude sensitive fields

    if (!user) {
      return res.status(404).json({ msg: "Người chơi không tồn tại." });
    }
    
    // Return the user object directly.
    res.status(200).json(user);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// @desc: Update user preferences
// @route: PATCH /api/users/preferences
export const updatePreferences = async (req, res) => {
    try {
        const { boardTheme, pieceTheme } = req.body;
        const userId = req.user.id;

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ msg: "User not found" });
        }

        if (boardTheme) {
            user.preferences.boardTheme = boardTheme;
        }
        if (pieceTheme) {
            user.preferences.pieceTheme = pieceTheme;
        }

        await user.save();
        
        // Return updated user data, excluding all sensitive info
        const updatedUser = user.toObject();
        delete updatedUser.passwordHash;
        delete updatedUser.email;
        delete updatedUser.googleId;
        delete updatedUser.__v;


        res.status(200).json(updatedUser);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// @desc: Change user password
// @route: POST /api/users/change-password
export const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user.id;

        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ msg: "New password must be at least 6 characters long." });
        }

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ msg: "User not found" });
        }

        if (!user.passwordHash) {
            return res.status(400).json({ msg: "User does not have a password set. Use set-password instead." });
        }

        const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!isMatch) {
            return res.status(401).json({ msg: "Incorrect current password." });
        }

        const salt = await bcrypt.genSalt(10);
        user.passwordHash = await bcrypt.hash(newPassword, salt);

        await user.save();

        res.status(200).json({ msg: "Password changed successfully." });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// @desc: Set a password for a user who doesn't have one
// @route: POST /api/users/set-password
export const setPassword = async (req, res) => {
    try {
        const { password } = req.body;
        const userId = req.user.id;

        if (!password || password.length < 6) {
            return res.status(400).json({ msg: "Password must be at least 6 characters long." });
        }

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ msg: "User not found" });
        }

        if (user.passwordHash) {
            return res.status(400).json({ msg: "User already has a password. Use change-password instead." });
        }

        const salt = await bcrypt.genSalt(10);
        user.passwordHash = await bcrypt.hash(password, salt);
        
        if(user.authProvider === 'google') {
            user.authProvider = 'hybrid';
        }

        await user.save();

        res.status(200).json({ msg: "Password set successfully." });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// @desc: Update user profile (bio, avatar)
// @route: PATCH /api/users/profile
export const updateProfile = async (req, res) => {
  try {
    const { bio, avatar } = req.body;
    const userId = req.user.id;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    if (bio !== undefined) {
      user.bio = bio;
    }
    if (avatar) {
      user.avatar = avatar;
    }

    await user.save();

    // Return updated user data, excluding all sensitive info
    const updatedUser = user.toObject();
    delete updatedUser.passwordHash;
    delete updatedUser.email;
    delete updatedUser.googleId;
    delete updatedUser.__v;

    res.status(200).json(updatedUser);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};