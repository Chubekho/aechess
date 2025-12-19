import User from "../models/User.js";
import Game from "../models/Game.js";
import { calculateNewRatings } from "../utils/eloCalculator.js";
import { generatePgnWithHeaders } from "../utils/pgnFormatter.js";

export async function endGame(io, activeGames, gameId, result, reason) {
  const gameData = activeGames.get(gameId);
  if (!gameData || gameData.isFinished) return;

  gameData.isFinished = true;
  console.log(`Game ${gameId} kết thúc: ${result} (${reason})`);

  // We can emit gameOver early to the client for responsiveness
  io.to(gameId).emit("gameOver", { 
    result: result, 
    reason: reason,
    dbGameId: gameData.dbGameId // Emit the existing ID
  });

  const game = gameData.game;
  const whitePlayerInfo = gameData.players.find((p) => p.color === "w");
  const blackPlayerInfo = gameData.players.find((p) => p.color === "b");

  try {
    const { fullPgn, timeControlForDb } = generatePgnWithHeaders(
      game,
      gameData,
      result
    );
    const category = gameData.config.category;

    let finalWhiteRating = whitePlayerInfo.rating;
    let finalBlackRating = blackPlayerInfo.rating;
    
    // 1. Nếu game XẾP HẠNG -> Tính và Update Elo
    if (gameData.config.isRated && category) {
      const oldRatings = {
        white: whitePlayerInfo.rating,
        black: blackPlayerInfo.rating,
      };
      const newRatings = calculateNewRatings(
        oldRatings.white,
        oldRatings.black,
        result
      );

      finalWhiteRating = newRatings.whiteNew;
      finalBlackRating = newRatings.blackNew;

      // Update User models
      await User.findByIdAndUpdate(whitePlayerInfo.id, {
        $set: { [`ratings.${category}`]: finalWhiteRating },
      });
      await User.findByIdAndUpdate(blackPlayerInfo.id, {
        $set: { [`ratings.${category}`]: finalBlackRating },
      });

      // Gửi update rating riêng (để update UI avatar realtime)
      io.to(gameId).emit("ratingUpdate", {
        whitePlayerId: whitePlayerInfo.id,
        blackPlayerId: blackPlayerInfo.id,
        newRatings: newRatings,
        category: category,
      });
    }
    
    // 2. Cập nhật Game vào DB
    const dbGameId = gameData.dbGameId;
    if (dbGameId) {
      await Game.findByIdAndUpdate(dbGameId, {
        result: result,
        status: 'completed',
        pgn: fullPgn,
        fen: game.fen(),
        whiteRating: finalWhiteRating, // Cập nhật rating cuối cùng
        blackRating: finalBlackRating,
      });
    } else {
      console.warn(`Game ${gameId} không có dbGameId, không thể cập nhật kết quả.`);
    }

  } catch (err) {
    console.error("Lỗi khi kết thúc và lưu game:", err);
  }

  // --- QUẢN LÝ BỘ NHỚ (Cleanup Logic) ---
  if (gameData.cleanupTimer) {
    clearTimeout(gameData.cleanupTimer);
  }
  gameData.cleanupTimer = setTimeout(() => {
    if (activeGames.has(gameId)) {
      console.log(`Dọn dẹp phòng game ${gameId} do không hoạt động.`);
      activeGames.delete(gameId);
    }
  }, 5 * 60 * 1000); // 5 phút
}
