// server/socket/gameHandlers.js
import { getPlayerColor } from "./helpers.js";

// Hàm này sẽ đăng ký (register) tất cả các event listener liên quan đến ván đấu cho một socket
export const registerGameHandlers = (io, socket, activeGames) => {
  
  // === 3. THỰC HIỆN NƯỚC ĐI ===
  socket.on("makeMove", ({ gameId, move }) => {
    const gameData = activeGames.get(gameId);
    if (!gameData) return socket.emit("error", "Ván đấu không tồn tại.");

    const playerColor = getPlayerColor(gameData, socket.id);
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
      io.to(gameId).emit("gameOver", {
        result: "Timeout",
        winner: playerTurn === "w" ? "b" : "w",
      });
      activeGames.delete(gameId); // Xóa game
      return;
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
    } catch (e) { /* Nước đi sai (hiếm) */ }

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
      let result = "Draw";
      let winner = null;
      if (gameData.game.isCheckmate()) {
        result = "Checkmate";
        winner = playerTurn; // Người vừa đi là người thắng
      }
      io.to(gameId).emit("gameOver", { result: result, winner: winner });
      activeGames.delete(gameId); // Xóa game
    }
  });

  // === 4. XỬ LÝ ĐẦU HÀNG (RESIGN) ===
  // (Chúng ta sẽ thêm logic này vào đây luôn)
  socket.on("resign", ({ gameId }) => {
    const gameData = activeGames.get(gameId);
    if (!gameData) return;

    const playerColor = getPlayerColor(gameData, socket.id);
    if (!playerColor) return; // Người xem không được đầu hàng

    const winner = playerColor === 'w' ? 'b' : 'w'; // Đối thủ thắng

    io.to(gameId).emit("gameOver", {
      result: "Resignation",
      winner: winner,
    });
    activeGames.delete(gameId);
  });

  // (Bạn có thể thêm socket.on("offerDraw", ...) ở đây)
};