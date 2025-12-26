import User from "../models/User.js";
import Game from "../models/Game.js";
import { calculateNewRatings } from "../utils/eloCalculator.js";
import { generatePgnWithHeaders } from "../utils/pgnFormatter.js";

export async function endGame(io, activeGames, gameId, result, reason) {
  const gameData = activeGames.get(gameId);
  if (!gameData || gameData.isFinished) return;

  gameData.isFinished = true;
  console.log(`Game ${gameId} kết thúc: ${result} (${reason})`);

  const game = gameData.game;
  const whitePlayerInfo = gameData.players.find((p) => p.color === "w");
  const blackPlayerInfo = gameData.players.find((p) => p.color === "b");
  const category = gameData.config.category;

  let finalWhiteRating = whitePlayerInfo.rating;
  let finalBlackRating = blackPlayerInfo.rating;
  let newRatingsForPayload = null;

  // 1. Calculate ratings BEFORE emitting gameOver if the game is rated.
  if (gameData.config.isRated && category) {
    const oldRatings = {
      white: whitePlayerInfo.rating,
      black: blackPlayerInfo.rating,
    };
    const calculatedRatings = calculateNewRatings(
      oldRatings.white,
      oldRatings.black,
      result
    );

    finalWhiteRating = calculatedRatings.whiteNew;
    finalBlackRating = calculatedRatings.blackNew;

    newRatingsForPayload = {
      white: finalWhiteRating,
      black: finalBlackRating,
      // You can also include diffs if the frontend needs them
      // whiteDiff: calculatedRatings.whiteDiff,
      // blackDiff: calculatedRatings.blackDiff,
    };
  }

  // 2. Emit gameOver with the new ratings included in the payload.
  io.to(gameId).emit("gameOver", {
    result: result,
    reason: reason,
    dbGameId: gameData.dbGameId,
    newRatings: newRatingsForPayload,
  });

  // 3. Perform database updates asynchronously after emitting.
  try {
    const { fullPgn } = generatePgnWithHeaders(
      game,
      gameData,
      result
    );

    // Update User models if rated
    if (gameData.config.isRated && category) {
      await User.findByIdAndUpdate(whitePlayerInfo.id, {
        $set: { [`ratings.${category}`]: finalWhiteRating },
      });
      await User.findByIdAndUpdate(blackPlayerInfo.id, {
        $set: { [`ratings.${category}`]: finalBlackRating },
      });
    }

    // Update Game model
    const dbGameId = gameData.dbGameId;
    if (dbGameId) {
      await Game.findByIdAndUpdate(dbGameId, {
        result: result,
        status: 'completed',
        pgn: fullPgn,
        fen: game.fen(),
        whiteRating: finalWhiteRating,
        blackRating: finalBlackRating,
      });
    } else {
      console.warn(`Game ${gameId} không có dbGameId, không thể cập nhật kết quả.`);
    }

  } catch (err) {
    console.error("Lỗi khi kết thúc và lưu game:", err);
  }

  // 4. Memory Cleanup
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
