// server/controllers/adminController.js
import User from "../models/User.js";
import Game from "../models/Game.js";

// =============================================
// USER MANAGEMENT
// =============================================

export const getUsers = async (req, res) => {
  try {
    const users = await User.find({})
      .select("_id username email role isActive ratings createdAt")
      .sort({ createdAt: -1 });
    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error fetching users." });
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
      message: `User ${user.username} has been ${user.isActive ? 'unbanned' : 'banned'}.`,
      user: {
        _id: user._id,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error updating user status." });
  }
};

// =============================================
// DASHBOARD & GAME MONITOR
// =============================================

export const getDashboardStats = async (req, res) => {
  try {
    const [totalUsers, activeGames, completedGames] = await Promise.all([
      User.countDocuments(),
      Game.countDocuments({ status: 'active' }),
      Game.countDocuments({ status: 'completed' })
    ]);

    res.json({
      success: true,
      stats: {
        totalUsers,
        activeGames,
        completedGames,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error fetching dashboard stats." });
  }
};

export const getActiveGames = async (req, res) => {
  try {
    const games = await Game.find({ status: 'active' })
      .sort({ createdAt: -1 })
      .populate('whitePlayer', 'username email ratings')
      .populate('blackPlayer', 'username email ratings');
      
    res.json({ success: true, games });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error fetching active games." });
  }
};

export const abortGame = async (req, res) => {
  try {
    const { gameId } = req.params;
    const game = await Game.findById(gameId);

    if (!game) {
      return res.status(404).json({ success: false, message: "Game not found." });
    }

    if (game.status !== 'active') {
      return res.status(400).json({ success: false, message: `Game is already ${game.status}.` });
    }

    // Note: 'endReason' is not in the schema, so it's omitted.
    game.status = 'aborted';
    game.result = '*'; 
    await game.save();

    // Ideal: Emit a socket event to inform players
    // io.to(game.gameId).emit('gameOver', { result: '*', reason: 'admin_intervention' });
    
    res.json({ success: true, message: "Game has been aborted successfully." });

  } catch (error) {
    res.status(500).json({ success: false, message: "Server error while aborting game." });
  }
};