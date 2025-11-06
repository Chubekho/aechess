// server/socket/gameEndHandler.js
import User from "../models/User.js";
import Game from "../models/Game.js";
import { calculateNewRatings } from "../utils/eloCalculator.js";
import { generatePgnWithHeaders } from "../utils/pgnFormatter.js";

/**
 * Xử lý kết thúc ván đấu
 */
export async function endGame(io, activeGames, gameId, result, reason) {
  const gameData = activeGames.get(gameId);
  if (!gameData) return; // Game đã được xử lý

  console.log(`Game ${gameId} kết thúc: ${result} (${reason})`);

  // 1. Gửi thông báo Game Over
  io.to(gameId).emit("gameOver", { result: result, reason: reason });

  const game = gameData.game;
  const whitePlayerInfo = gameData.players.find((p) => p.color === "w");
  const blackPlayerInfo = gameData.players.find((p) => p.color === "b");
  
  // 2. Nếu game không xếp hạng (từ "Chơi với bạn"), chỉ xóa và dừng
  if (!gameData.config.isRated) {
    activeGames.delete(gameId);
    return;
  }

  // Gọi helper để lấy PGN đã định dạng
  const { fullPgn, timeControlForDb } = generatePgnWithHeaders(
    game,
    gameData,
    result
  );

  try {

    // 4. Tính Elo mới
    const oldRatings = {
      white: whitePlayerInfo.rating,
      black: blackPlayerInfo.rating,
    };
    const newRatings = calculateNewRatings(
      oldRatings.white,
      oldRatings.black,
      result
    );

    // 5. Cập nhật User trong DB
    await User.findByIdAndUpdate(whitePlayerInfo.id, {
      rating: newRatings.whiteNew,
    });
    await User.findByIdAndUpdate(blackPlayerInfo.id, {
      rating: newRatings.blackNew,
    });

    // 6. Lưu ván đấu vào DB
    const newGame = new Game({
      whitePlayer: whitePlayerInfo.id,
      blackPlayer: blackPlayerInfo.id,
      result: result,
      pgn: fullPgn,
      timeControl: timeControlForDb,
      isRated: true,
      whiteRating: oldRatings.white,
      blackRating: oldRatings.black,
    });
    await newGame.save();

    // 7. Gửi rating mới về client (tùy chọn)
    io.to(gameId).emit("ratingUpdate", {
      whitePlayerId: whitePlayerInfo.id,
      blackPlayerId: blackPlayerInfo.id,
      newRatings: newRatings,
    });
  } catch (err) {
    console.error("Lỗi khi kết thúc game:", err);
  } finally {
    // 8. Xóa game khỏi bộ nhớ
    activeGames.delete(gameId);
  }
}
