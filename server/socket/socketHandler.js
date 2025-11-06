// server/socket/socketHandler.js
import { Chess } from "chess.js";

import { registerGameHandlers } from "./gameHandlers.js";
import { getPlayerColor } from "./helpers.js";

import createShortId from "../utils/CreateShortId.js";

// Nơi lưu trữ tất cả các ván đấu đang diễn ra
// Rất quan trọng: Server dùng 'chess.js' của riêng nó
const activeGames = new Map();

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

    // === 3. XỬ LÝ GAME ===
    registerGameHandlers(io, socket, activeGames);

    // === Xử lý Ngắt kết nối ===
    socket.on("disconnect", () => {
      console.log(`Client đã ngắt kết nối: ${socket.id}`);
      // TODO: Bạn cần thêm logic để xử lý 'disconnect'
      // (Bạn nên thêm logic xử lý khi 1 trong 2 người chơi thoát)
      // Ví dụ: tìm xem socket.id này có đang ở trong 'activeGames' không
      // Nếu có, emit 'gameOver' (đối thủ thắng) cho người chơi còn lại
    });
  });
};

export default initializeSocket;
