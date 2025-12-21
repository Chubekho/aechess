import Game from "../models/Game.js";
import { Chess } from "chess.js";
import mongoose from "mongoose";

export const getGameHistory = async (req, res) => {
  try {
    const { userId, limit: limitQuery } = req.query;

    if (!userId) {
      return res.status(400).json({ msg: "Missing userId query parameter." });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ msg: "Invalid User ID format." });
    }

    const limit = parseInt(limitQuery) || 10;

    const games = await Game.find({
      $or: [{ whitePlayer: userId }, { blackPlayer: userId }],
    })
      .populate("whitePlayer", "username avatar ratings")
      .populate("blackPlayer", "username avatar ratings")
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean(); // Use .lean() for better performance on read-only queries

    // The entire games array is returned, further processing happens on the client
    res.json(games);

  } catch (err) {
    console.error("Server error in getGameHistory:", err);
    res.status(500).json({ error: "Internal Server Error." });
  }
};

// @desc: Lấy chi tiết 1 ván đấu (cho trang Analysis)
// @route: GET /api/games/:id
export const getGameById = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Validate ID (Tránh lỗi CastError làm sập server)
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ msg: "Ván đấu không tồn tại (Invalid ID)." });
    }

    // 2. Tìm game và populate thông tin người chơi
    const game = await Game.findById(id)
      .populate("whitePlayer", "displayName ratings")
      .populate("blackPlayer", "displayName ratings");

    // 3. Check nếu game không tồn tại
    if (!game) {
      return res.status(404).json({ msg: "Không tìm thấy ván đấu." });
    }

    // 4. Xử lý User bị xóa (Safe Mapping) - Giống getGameHistory
    const unknownUser = { displayName: "Người chơi ẩn", ratings: {}, id: "deleted" };
    
    // Nếu user bị xóa khỏi DB, populate trả về null -> thay bằng unknownUser
    const whitePlayer = game.whitePlayer || unknownUser;
    const blackPlayer = game.blackPlayer || unknownUser;

    // 5. Trả về dữ liệu
    res.status(200).json({
      _id: game._id,
      whitePlayer: whitePlayer,
      blackPlayer: blackPlayer,
      result: game.result,
      timeControl: game.timeControl,
      createdAt: game.createdAt,
      pgn: game.pgn, // <-- QUAN TRỌNG: AnalysisPage cần cái này
      isRated: game.isRated,
      whiteRating: game.whiteRating, // Rating tại thời điểm đánh
      blackRating: game.blackRating,
    });

  } catch (err) {
    console.error("Lỗi server (getGameById):", err);
    res.status(500).json({ error: "Lỗi máy chủ nội bộ." });
  }
};