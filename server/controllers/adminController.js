// server/controllers/adminController.js
import User from "../models/User.js";
import Game from "../models/Game.js";
import { activeGames } from "../utils/gameState.js";
import { endGame } from "../socket/gameEndHandler.js";

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

    if (user.role === 'admin') {
      return res
        .status(403)
        .json({ success: false, message: "Cannot ban an administrator" });
    }

    user.isActive = !user.isActive;
    await user.save();

    // If the user is being banned, disconnect their sockets
    if (!user.isActive) {
      const io = req.app.get('io');
      io.in(user._id.toString()).disconnectSockets(true);
    }

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
    const { result, reason } = req.body;

    // Validate result and set default values
    const allowedResults = ['*', '1-0', '0-1', '1/2-1/2'];
    const finalResult = allowedResults.includes(result) ? result : '*';
    const finalReason = reason || "Admin Intervention";

    let shortIdToAbort = null;

    // 1. Search for the game in the in-memory `activeGames` map
    for (const [shortId, gameData] of activeGames.entries()) {
      if (gameData.dbGameId.toString() === gameId) {
        shortIdToAbort = shortId;
        break;
      }
    }

    const io = req.app.get("io");

    // 2. If found, end the game using the real-time handler
    if (shortIdToAbort) {
      await endGame(io, activeGames, shortIdToAbort, finalResult, finalReason);
      return res.json({
        success: true,
        message: "Real-time game has been aborted successfully.",
      });
    }

    // 3. If not found in memory (e.g., server restarted), fall back to DB update
    const game = await Game.findById(gameId);

    if (!game) {
      return res
        .status(404)
        .json({ success: false, message: "Game not found in DB." });
    }

    if (game.status !== "active") {
      return res
        .status(400)
        .json({ success: false, message: `Game is already ${game.status}.` });
    }

    game.status = "aborted";
    game.result = finalResult;
    game.endReason = finalReason;
    await game.save();

    res.json({
      success: true,
      message: "Game record in DB has been marked as aborted.",
    });
  } catch (error) {
    console.error("Error aborting game:", error);
    res.status(500).json({ success: false, message: "An unexpected error occurred." });
  }
};