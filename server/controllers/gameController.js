import Game from "../models/Game.js";
import { Chess } from "chess.js"; // Cần để đếm nước đi

// @desc: Lấy các ván đấu của user
// @route: GET /api/games/my-history?limit=5
export const getMyGameHistory = async (req, res) => {
  try {
    const userId = req.user.id; // Lấy từ 'checkAuth' middleware
    const limit = parseInt(req.query.limit) || 5; // Lấy limit từ query, mặc định là 5

    const games = await Game.find({
      $or: [{ whitePlayer: userId }, { blackPlayer: userId }],
    })
    .populate("whitePlayer", "displayName rating")
    .populate("blackPlayer", "displayName rating")
    .sort({ createdAt: -1 }) // Sắp xếp ván mới nhất lên đầu
    .limit(limit);

    // Xử lý game để thêm "moveCount" (số nước đi)
    const gamesWithMoveCount = games.map(game => {
      const chess = new Chess();
      chess.loadPgn(game.pgn);
      return {
        _id: game._id,
        whitePlayer: game.whitePlayer,
        blackPlayer: game.blackPlayer,
        result: game.result,
        timeControl: game.timeControl, // Gửi timeControl
        createdAt: game.createdAt,
        moveCount: chess.history().length, // Đếm số nước đi
        // Không gửi PGN để giữ payload nhỏ
      };
    });

    res.status(200).json(gamesWithMoveCount);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// (Thêm getGameById (để lấy PGN) ở đây cho trang Analysis sau)
export const getGameById = async (req, res) => { /* ... */ };
