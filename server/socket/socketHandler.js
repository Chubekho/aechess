// server/socket/socketHandler.js
import { Chess } from "chess.js";

import createShortId from "../utils/CreateShortId.js";

// Nơi lưu trữ tất cả các ván đấu đang diễn ra
// Rất quan trọng: Server dùng 'chess.js' của riêng nó
const activeGames = new Map();

const getPlayerColor = (gameData, socketId) => {
  return gameData.players.find((p) => p.id === socketId)?.color;
};

const initializeSocket = (io) => {
  io.on("connection", (socket) => {
    console.log(`Một client vừa kết nối: ${socket.id}`);

    // === 1. TẠO PHÒNG ===
    socket.on("createRoom", (roomConfig, callback) => {
      if (typeof callback !== "function") return;

      const gameId = createShortId();
      const game = new Chess();

      let playerColor = roomConfig.color;
      if (playerColor === "random") {
        playerColor = Math.random() > 0.5 ? "w" : "b";
      }

      // NÂNG CẤP: Lưu trữ state đồng hồ
      const baseTimeSeconds = (roomConfig.time.base || 10) * 60;

      activeGames.set(gameId, {
        game: game,
        players: [{ id: socket.id, color: playerColor }],
        config: roomConfig,
        // MỚI: Clock state (lưu bằng giây)
        clocks: {
          w: baseTimeSeconds,
          b: baseTimeSeconds,
        },
        lastMoveTimestamp: null, // Sẽ set khi game bắt đầu
      });

      socket.join(gameId);
      console.log(`Phòng ${gameId} đã được tạo bởi ${socket.id}`);
      callback({ gameId: gameId, assignedColor: playerColor });
    });

    // === 2. THAM GIA PHÒNG ===
    socket.on("joinRoom", ({ gameId }, callback) => {
      const gameData = activeGames.get(gameId);
      if (!gameData) return callback({ error: "Phòng không tồn tại." });

      const isAlreadyPlayer = gameData.players.find((p) => p.id === socket.id);

      // SỬA LỖI: Gửi trạng thái hiện tại về cho Host/Player
      if (isAlreadyPlayer) {
        socket.join(gameId);

        const whitePlayer = gameData.players.find((p) => p.color === "w");
        const blackPlayer = gameData.players.find((p) => p.color === "b");

        // Xác định status:
        // 1. 'playing' (nếu F5 khi game đang chạy)
        // 2. 'waiting_as_host' (nếu là host vừa tạo phòng)
        const status =
          gameData.players.length === 2 && gameData.lastMoveTimestamp
            ? "playing"
            : "waiting_as_host";

        return callback({
          success: true,
          msg: "Re-joined",
          assignedColor: isAlreadyPlayer.color,

          // Gửi FEN, clocks, và config về cho Host
          fen: gameData.game.fen(),
          clocks: gameData.clocks,
          config: gameData.config,
          // (TODO: Gửi data player đầy đủ hơn)
          whitePlayer: whitePlayer
            ? { id: whitePlayer.id, displayName: "Host" }
            : null,
          blackPlayer: blackPlayer
            ? { id: blackPlayer.id, displayName: "Guest" }
            : null,
          status: status, // <-- Gửi status
        });
      }

      if (gameData.players.length >= 2) {
        return callback({ error: "Phòng đã đầy." });
      }

      // Thêm người chơi B
      const hostColor = gameData.players[0].color;
      const guestColor = hostColor === "w" ? "b" : "w";
      gameData.players.push({ id: socket.id, color: guestColor });
      socket.join(gameId);
      console.log(`${socket.id} đã tham gia phòng ${gameId}`);

      const whitePlayer = gameData.players.find((p) => p.color === "w").id;
      const blackPlayer = gameData.players.find((p) => p.color === "b").id;

      // NÂNG CẤP: Bắt đầu đếm giờ
      gameData.lastMoveTimestamp = Date.now();

      io.to(gameId).emit("gameStart", {
        gameId: gameId,
        fen: gameData.game.fen(),
        whitePlayer: { id: whitePlayer, displayName: "Player W" }, // TODO: Lấy tên thật từ DB/Auth
        blackPlayer: { id: blackPlayer, displayName: "Player B" },
        config: gameData.config,
        clocks: gameData.clocks, // Gửi thời gian ban đầu
      });

      callback({ success: true, assignedColor: guestColor });
    });

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

      // --- LOGIC ĐỒNG HỒ (MỚI) ---
      const now = Date.now();
      const timeElapsedSeconds = (now - gameData.lastMoveTimestamp) / 1000;

      // 1. Trừ thời gian
      gameData.clocks[playerTurn] -= timeElapsedSeconds;

      // (Kiểm tra hết giờ)
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
      } catch (e) {
        /* Nước đi sai (hiếm) */
      }

      if (moveResult === null) {
        return socket.emit("error", "Nước đi không hợp lệ.");
      }

      // Nước đi HỢP LỆ
      // 2. Cộng increment
      const increment = gameData.config.time.inc || 0;
      gameData.clocks[playerTurn] += increment;

      // 3. Cập nhật timestamp
      gameData.lastMoveTimestamp = now;

      console.log(`Nước đi trong phòng ${gameId}: ${moveResult.san}`);

      io.to(gameId).emit("movePlayed", {
        newFen: gameData.game.fen(),
        lastMove: moveResult.san,
        clocks: gameData.clocks, // Gửi thời gian đã cập nhật
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

    // === Xử lý Ngắt kết nối ===
    socket.on("disconnect", () => {
      console.log(`Client đã ngắt kết nối: ${socket.id}`);
      // (Bạn nên thêm logic xử lý khi 1 trong 2 người chơi thoát)
    });
  });
};

export default initializeSocket;
