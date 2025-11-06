// server/socket/gameHandlers.js
import { getPlayerColor, getOpponent } from "./helpers.js";
import { endGame } from "./gameEndHandler.js";

// Hàm này sẽ đăng ký (register) tất cả các event listener liên quan đến ván đấu cho một socket
export const registerGameHandlers = (io, socket, activeGames) => {
  // === 3. THỰC HIỆN NƯỚC ĐI ===
  socket.on("makeMove", ({ gameId, move }) => {
    const gameData = activeGames.get(gameId);
    if (!gameData) return socket.emit("error", "Ván đấu không tồn tại.");

    const playerColor = getPlayerColor(gameData, socket.user.id);
    if (!playerColor)
      return socket.emit("error", "Bạn không phải là người chơi.");

    const playerTurn = gameData.game.turn();
    if (playerColor !== playerTurn) {
      return socket.emit("error", "Không phải lượt của bạn.");
    }

    // --- LOGIC ĐỒNG HỒ ---
    const now = Date.now();
    const timeElapsedSeconds = (now - gameData.lastMoveTimestamp) / 1000;
    gameData.clocks[playerTurn] -= timeElapsedSeconds;

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

    if (moveResult === null) {
      return socket.emit("error", "Nước đi không hợp lệ.");
    }

    // Nước đi HỢP LỆ
    const increment = gameData.config.time.inc || 0;
    gameData.clocks[playerTurn] += increment;
    gameData.lastMoveTimestamp = now;

    console.log(`Nước đi trong phòng ${gameId}: ${moveResult.san}`);

    io.to(gameId).emit("movePlayed", {
      newFen: gameData.game.fen(),
      lastMove: moveResult.san,
      clocks: gameData.clocks,
    });

    // (Kiểm tra chiếu hết / hòa cờ)
    if (gameData.game.isGameOver()) {
      let result = "1/2-1/2";
      let reason = "Draw"; // (Thêm logic isStalemate(), etc.)
      if (gameData.game.isCheckmate()) {
        result = playerTurn === "w" ? "1-0" : "0-1";
        reason = "Checkmate";
      }
      
      return endGame(io, activeGames, gameId, result, reason);
    }
  });

  // === 4. XỬ LÝ ĐẦU HÀNG (RESIGN) ===
  // (Chúng ta sẽ thêm logic này vào đây luôn)
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
        fromColor: playerColor 
      });
    }
  });
  
  // B. Người chơi chấp nhận hòa
  socket.on("acceptDraw", ({ gameId }) => {
    const gameData = activeGames.get(gameId);
    if (!gameData) return;
    
    const playerColor = getPlayerColor(gameData, socket.user.id);
    
    // Kiểm tra xem có lời đề nghị hòa từ đối thủ không
    const opponentColor = playerColor === 'w' ? 'b' : 'w';
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
};
