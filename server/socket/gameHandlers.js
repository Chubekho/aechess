// server/socket/gameHandlers.js
import { getPlayerColor, getOpponent } from "./helpers.js";
import { endGame } from "./gameEndHandler.js";

export const registerGameHandlers = (io, socket, activeGames) => {
  socket.on("makeMove", ({ gameId, move }) => {
    const gameData = activeGames.get(gameId);
    if (!gameData || gameData.isFinished) return;

    const playerColor = getPlayerColor(gameData, socket.user.id);
    if (!playerColor)
      return socket.emit("error", "Bạn không phải là người chơi.");

    const playerTurn = gameData.game.turn();
    if (playerColor !== playerTurn) {
      return socket.emit("error", "Không phải lượt của bạn.");
    }

    // --- LOGIC ĐỒNG HỒ ---
    const now = Date.now();
    if (gameData.lastMoveTimestamp) {
      const timeElapsedSeconds = (now - gameData.lastMoveTimestamp) / 1000;
      gameData.clocks[playerTurn] -= timeElapsedSeconds;
    }

    if (gameData.clocks[playerTurn] <= 0) {
      const result = playerTurn === "w" ? "0-1" : "1-0";
      return endGame(io, activeGames, gameId, result, "Timeout");
    }
    // --- Kết thúc Logic Đồng hồ ---

    // Thực hiện nước đi
    let moveResult = null;
    try {
      moveResult = gameData.game.move({
        from: move.from,
        to: move.to,
        promotion: "q",
      });
    } catch (e) {
      /* Nước đi sai (hiếm) */
    }

    if (!moveResult) {
      return socket.emit("error", "Nước đi không hợp lệ.");
    }

    // Nước đi HỢP LỆ
    const increment = gameData.config.time.inc || 0;
    gameData.clocks[playerTurn] += increment;
    gameData.lastMoveTimestamp = now;

    io.to(gameId).emit("movePlayed", {
      newFen: gameData.game.fen(),
      lastMove: moveResult.san,
      clocks: gameData.clocks,
      moverSocketId: socket.id,
      pgn: gameData.game.pgn(),
    });

    // (Kiểm tra chiếu hết / hòa cờ)
    if (gameData.game.isGameOver()) {
      let result = "1/2-1/2";
      let reason = "Draw";
      if (gameData.game.isCheckmate()) {
        result = playerTurn === "w" ? "1-0" : "0-1";
        reason = "Checkmate";
      }

      return endGame(io, activeGames, gameId, result, reason);
    }
  });

  // === 4. XỬ LÝ ĐẦU HÀNG (RESIGN) ===
  socket.on("resign", ({ gameId }) => {
    const gameData = activeGames.get(gameId);
    if (!gameData) return;

    // SỬA: Dùng socket.user.id
    const playerColor = getPlayerColor(gameData, socket.user.id);
    if (!playerColor) return;

    const result = playerColor === "w" ? "0-1" : "1-0"; // Đối thủ thắng
    return endGame(io, activeGames, gameId, result, "Resignation");
  });

  // === 5. XỬ LÝ CẦU HÒA ===

  // A. Người chơi gửi lời cầu hòa
  socket.on("offerDraw", ({ gameId }) => {
    const gameData = activeGames.get(gameId);
    if (!gameData) return;

    const playerColor = getPlayerColor(gameData, socket.user.id);
    if (!playerColor) return;

    // Lưu lại lời đề nghị
    gameData.drawOffer = playerColor;

    // Tìm socket của đối thủ và gửi lời đề nghị
    const opponent = getOpponent(gameData, socket.user.id);
    if (opponent && opponent.socketId) {
      io.to(opponent.socketId).emit("drawOffered", {
        fromColor: playerColor,
      });
    }
  });

  // B. Người chơi chấp nhận hòa
  socket.on("acceptDraw", ({ gameId }) => {
    const gameData = activeGames.get(gameId);
    if (!gameData) return;

    const playerColor = getPlayerColor(gameData, socket.user.id);

    // Kiểm tra xem có lời đề nghị hòa từ đối thủ không
    const opponentColor = playerColor === "w" ? "b" : "w";
    if (gameData.drawOffer === opponentColor) {
      return endGame(io, activeGames, gameId, "1/2-1/2", "Agreement");
    }
  });

  // C. Người chơi từ chối hòa
  socket.on("declineDraw", ({ gameId }) => {
    const gameData = activeGames.get(gameId);
    if (!gameData) return;

    // Hủy lời đề nghị
    gameData.drawOffer = null;

    // Tìm socket của đối thủ và báo là đã từ chối
    const opponent = getOpponent(gameData, socket.user.id);
    if (opponent && opponent.socketId) {
      io.to(opponent.socketId).emit("drawDeclined");
    }
  });

  // === 6. XỬ LÝ TÁI ĐẤU (REMATCH) ===

  // A. Mời tái đấu
  socket.on("offerRematch", ({ gameId }) => {
    const gameData = activeGames.get(gameId);
    // Chỉ cho phép khi game data còn tồn tại VÀ game đã kết thúc
    if (!gameData || !gameData.isFinished) return;

    const playerColor = getPlayerColor(gameData, socket.user.id);
    if (!playerColor) return;

    gameData.rematchOffer = playerColor;

    const opponent = getOpponent(gameData, socket.user.id);
    if (opponent?.socketId) {
      io.to(opponent.socketId).emit("rematchOffered", {
        fromColor: playerColor,
      });
    }
  });

  // B. Từ chối tái đấu
  socket.on("declineRematch", ({ gameId }) => {
    const gameData = activeGames.get(gameId);
    if (!gameData) return;

    gameData.rematchOffer = null;
    const opponent = getOpponent(gameData, socket.user.id);
    if (opponent?.socketId) {
      io.to(opponent.socketId).emit("rematchDeclined");
    }
  });

  // === C. CHẤP NHẬN TÁI ĐẤU ===
  socket.on("acceptRematch", ({ gameId }) => {
    const gameData = activeGames.get(gameId);
    if (!gameData) return;

    const playerColor = getPlayerColor(gameData, socket.user.id);
    const opponentColor = playerColor === "w" ? "b" : "w";

    // Kiểm tra khớp lời mời
    if (gameData.rematchOffer === opponentColor) {
      // 1. HỦY TIMEOUT DỌN DẸP (Quan trọng!)
      if (gameData.cleanupTimer) {
        clearTimeout(gameData.cleanupTimer);
        gameData.cleanupTimer = null;
      }

      console.log(
        `Phòng ${gameId}: Tái đấu được chấp nhận. Đang khởi tạo ván mới...`
      );

      // 2. SWAP PLAYERS & COLORS
      gameData.players.forEach((p) => {
        p.color = p.color === "w" ? "b" : "w";
      });

      // 3. RESET GAME STATE
      gameData.game.reset(); // Reset bàn cờ chess.js
      gameData.pgn = "";

      const baseTimeMinutes = parseInt(gameData.config.time.base);
      const baseTimeSeconds = baseTimeMinutes * 60;

      gameData.clocks = { w: baseTimeSeconds, b: baseTimeSeconds };
      gameData.lastMoveTimestamp = Date.now(); // Reset mốc thời gian để khớp logic roomHandlers

      // Reset Flags
      gameData.result = null;
      gameData.drawOffer = null;
      gameData.rematchOffer = null;
      gameData.isFinished = false;

      // 4. THÔNG BÁO CLIENT
      // Tìm lại ai cầm trắng, ai cầm đen sau khi swap để gửi đúng info
      const newWhitePlayer = gameData.players.find((p) => p.color === "w");
      const newBlackPlayer = gameData.players.find((p) => p.color === "b");

      // Emit sự kiện gameRestarted với đầy đủ thông tin như gameStart
      io.to(gameId).emit("gameRestarted", {
        gameId: gameId,
        fen: gameData.game.fen(),
        whitePlayer: newWhitePlayer,
        blackPlayer: newBlackPlayer,
        clocks: gameData.clocks,
        config: gameData.config, // Gửi lại config để client chắc chắn về time control
      });
    }
  });
};
