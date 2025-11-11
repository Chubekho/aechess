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
    // 3. Xác định thể loại game
    const category = gameData.config.category;
    if (!category) {
      console.error(`Lỗi: Không tìm thấy 'category' cho game ${gameId}`);
      // Nếu không có thể loại, không thể cập nhật Elo
      return; 
    }

    // 4. Tính Elo mới
    // (whitePlayerInfo.rating đã là rating đúng thể loại,
    // được gán khi matchmakingHandler tạo 'activeGames')
    const oldRatings = {
      white: whitePlayerInfo.rating,
      black: blackPlayerInfo.rating,
    };
    const newRatings = calculateNewRatings(
      oldRatings.white,
      oldRatings.black,
      result
    );

    // 5. Cập nhật User trong DB (dùng dot notation)
    const whiteUpdateField = `ratings.${category}`; // e.g., "ratings.blitz"
    const blackUpdateField = `ratings.${category}`;

    await User.findByIdAndUpdate(whitePlayerInfo.id, {
      $set: { [whiteUpdateField]: newRatings.whiteNew }
    });
    await User.findByIdAndUpdate(blackPlayerInfo.id, {
      $set: { [blackUpdateField]: newRatings.blackNew }
    });

    // 6. Lưu ván đấu vào DB
    const newGame = new Game({
      whitePlayer: whitePlayerInfo.id,
      blackPlayer: blackPlayerInfo.id,
      result: result,
      pgn: fullPgn,
      timeControl: timeControlForDb,
      isRated: true,
      whiteRating: oldRatings.white, // Lưu rating cũ (của thể loại này)
      blackRating: oldRatings.black,
    });
    await newGame.save();

    // 7. Gửi rating mới về client (tùy chọn)
    io.to(gameId).emit("ratingUpdate", {
      whitePlayerId: whitePlayerInfo.id,
      blackPlayerId: blackPlayerInfo.id,
      newRatings: newRatings,
      category: category // Gửi thể loại để client biết update UI nào
    });
  } catch (err) {
    console.error("Lỗi khi kết thúc game:", err);
  } finally {
    // 8. Xóa game khỏi bộ nhớ
    activeGames.delete(gameId);
  }
}