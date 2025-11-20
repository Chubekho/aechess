import Game from "../models/Game.js";
import { Chess } from "chess.js"; // Cần để đếm nước đi
import mongoose from "mongoose";

// @desc: Lấy các ván đấu của user
// @route: GET /api/games/history?userId=...&limit=50
export const getGameHistory = async (req, res) => {
  try {
    let targetUserId = req.user.id; // Mặc định lấy của người đang login

    // Nếu client gửi userId lên (để xem profile người khác)
    if (req.query.userId) {
      // 1. Validate ID để tránh lỗi CastError
      if (!mongoose.Types.ObjectId.isValid(req.query.userId)) {
        return res.status(400).json({ msg: "User ID không hợp lệ." });
      }
      targetUserId = req.query.userId;
    }

    const limit = parseInt(req.query.limit) || 50;

    // Tìm các ván đấu
    const games = await Game.find({
      $or: [{ whitePlayer: targetUserId }, { blackPlayer: targetUserId }],
    })
    .populate("whitePlayer", "displayName ratings")
    .populate("blackPlayer", "displayName ratings")
    .sort({ createdAt: -1 })
    .limit(limit);

    // Xử lý dữ liệu an toàn (Safe Mapping)
    const gamesWithMoveCount = games.map(game => {
      let moveCount = 0;
      
      // 2. Xử lý đếm nước đi an toàn (Try-Catch cho Chess.js)
      if (game.moveCount) {
        moveCount = game.moveCount; // Nếu đã lưu trong DB thì lấy luôn
      } else if (game.pgn) {
        try {
          const chess = new Chess();
          chess.loadPgn(game.pgn);
          moveCount = chess.history().length;
        } catch (e) {
          // Nếu PGN lỗi, chỉ log warning server chứ không làm sập API
          console.warn(`[Warning] Lỗi parse PGN ván ${game._id}:`, e.message);
          moveCount = 0; 
        }
      }

      // 3. Xử lý User bị xóa (Null check)
      // Nếu user bị xóa khỏi DB, populate sẽ trả về null. 
      // Ta tạo object giả để FE không crash khi gọi .displayName
      const unknownUser = { displayName: "Người chơi ẩn", ratings: {}, id: "deleted" };
      const whitePlayer = game.whitePlayer || unknownUser;
      const blackPlayer = game.blackPlayer || unknownUser;

      return {
        _id: game._id,
        whitePlayer: whitePlayer,
        blackPlayer: blackPlayer,
        result: game.result,
        timeControl: game.timeControl || "Unlimited",
        createdAt: game.createdAt,
        moveCount: moveCount,
        whiteRating: game.whiteRating || 1200, // Fallback rating
        blackRating: game.blackRating || 1200,
      };
    });

    res.status(200).json(gamesWithMoveCount);

  } catch (err) {
    console.error("Lỗi server (getGameHistory):", err); // Log lỗi ra terminal để debug
    res.status(500).json({ error: "Lỗi máy chủ nội bộ." });
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
