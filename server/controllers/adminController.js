// server/controllers/adminController.js
import User from "../models/User.js";
import Game from "../models/Game.js";

export const getUsers = async (req, res) => {
  try {
    const users = await User.find({}).select(
      "_id username email role isActive ratings createdAt"
    );
    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const banUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.json({
      success: true,
      message: "User status updated",
      user: {
        id: user.id,
        username: user.username,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalGames = await Game.countDocuments(); 
    res.json({ success: true, stats: { totalUsers, totalGames } });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};
