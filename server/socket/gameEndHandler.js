import User from "../models/User.js";
import Game from "../models/Game.js";
import { calculateNewRatings } from "../utils/eloCalculator.js";
import { generatePgnWithHeaders } from "../utils/pgnFormatter.js";

export async function endGame(io, activeGames, gameId, result, reason) {
  const gameData = activeGames.get(gameId);
  if (!gameData) return;

  gameData.isFinished = true;

  console.log(`Game ${gameId} kết thúc: ${result} (${reason})`);

  io.to(gameId).emit("gameOver", { result: result, reason: reason });

  const game = gameData.game;
  const whitePlayerInfo = gameData.players.find((p) => p.color === "w");
  const blackPlayerInfo = gameData.players.find((p) => p.color === "b");

  let dbGameId = null;

  // 1. Nếu game KHÔNG xếp hạng -> Emit ngay và xóa
  if (!gameData.config.isRated) {
    io.to(gameId).emit("gameOver", { result, reason });
    return;
  }

  // 2. Xử lý Game Xếp hạng (Lưu DB trước khi Emit)
  try {
    const { fullPgn, timeControlForDb } = generatePgnWithHeaders(
      game,
      gameData,
      result
    );
    const category = gameData.config.category;

    // A. Tính và Update Elo
    if (category) {
      const oldRatings = {
        white: whitePlayerInfo.rating,
        black: blackPlayerInfo.rating,
      };
      const newRatings = calculateNewRatings(
        oldRatings.white,
        oldRatings.black,
        result
      );

      await User.findByIdAndUpdate(whitePlayerInfo.id, {
        $set: { [`ratings.${category}`]: newRatings.whiteNew },
      });
      await User.findByIdAndUpdate(blackPlayerInfo.id, {
        $set: { [`ratings.${category}`]: newRatings.blackNew },
      });

      // Gửi update rating riêng (để update UI avatar realtime)
      io.to(gameId).emit("ratingUpdate", {
        whitePlayerId: whitePlayerInfo.id,
        blackPlayerId: blackPlayerInfo.id,
        newRatings: newRatings,
        category: category,
      });

      // Lưu vào DB cho Game model (cần update rating snapshot)
      whitePlayerInfo.rating = newRatings.whiteNew;
      blackPlayerInfo.rating = newRatings.blackNew;
    }

    // B. Lưu Game vào DB
    const newGame = new Game({
      whitePlayer: whitePlayerInfo.id,
      blackPlayer: blackPlayerInfo.id,
      result: result,
      pgn: fullPgn,
      timeControl: timeControlForDb,
      isRated: true,
      whiteRating: whitePlayerInfo.rating,
      blackRating: blackPlayerInfo.rating,
    });

    await newGame.save();
    dbGameId = newGame._id;
  } catch (err) {
    console.error("Lỗi khi kết thúc game:", err);
  }
  io.to(gameId).emit("gameOver", {
    result: result,
    reason: reason,
    dbGameId: dbGameId,
  });

  // --- QUẢN LÝ BỘ NHỚ (Cleanup Logic) ---
  // Thay vì delete ngay, ta set timeout 15 phút.
  // Nếu người chơi tái đấu, timeout này sẽ bị clear trong gameHandlers.
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
