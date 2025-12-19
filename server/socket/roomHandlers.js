// server/socket/roomHandlers.js
import { Chess } from "chess.js";
import createShortId from "../utils/CreateShortId.js";
import Game from "../models/Game.js";

// Đăng ký các event 'createRoom' và 'joinRoom'
export const registerRoomHandlers = (io, socket, activeGames) => {
  // === 1. TẠO PHÒNG ===
  socket.on("createRoom", (roomConfig, callback) => {
    if (typeof callback !== "function") return;

    const gameId = createShortId();
    const game = new Chess();

    let playerColor = roomConfig.color;
    if (playerColor === "random") {
      playerColor = Math.random() > 0.5 ? "w" : "b";
    }

    const baseTimeSeconds = (roomConfig.time.base || 10) * 60;

    // SỬA: Lưu thông tin đầy đủ của người chơi
    const hostPlayer = {
      id: socket.user.id, // Dùng User ID (bền bỉ)
      socketId: socket.id, // Dùng Socket ID (tạm thời)
      displayName: socket.user.displayName,
      rating: socket.user.rating,
      color: playerColor,
    };

    activeGames.set(gameId, {
      game: game,
      players: [hostPlayer],
      config: roomConfig,
      clocks: { w: baseTimeSeconds, b: baseTimeSeconds },
      lastMoveTimestamp: null,
      drawOffer: null, // Mới: Để xử lý cầu hòa
    });

    socket.join(gameId);
    console.log(`Phòng ${gameId} đã được tạo bởi ${socket.user.email}`);
    callback({ gameId: gameId, assignedColor: playerColor });
  });

  // === 2. THAM GIA PHÒNG ===
  socket.on("joinRoom", async ({ gameId }, callback) => {
    const gameData = activeGames.get(gameId);
    if (!gameData) return callback({ error: "Phòng không tồn tại." });

    // SỬA: Kiểm tra bằng User ID thay vì Socket ID
    const isAlreadyPlayer = gameData.players.find(
      (p) => p.id === socket.user.id
    );

    // Gửi trạng thái hiện tại về cho Host/Player
    if (isAlreadyPlayer) {
      // Cập nhật socketId mới cho người chơi (quan trọng khi F5)
      isAlreadyPlayer.socketId = socket.id;
      socket.join(gameId);

      const whitePlayer = gameData.players.find((p) => p.color === "w");
      const blackPlayer = gameData.players.find((p) => p.color === "b");
      const status =
        gameData.players.length === 2 && gameData.lastMoveTimestamp
          ? "playing"
          : "waiting_as_host";

      return callback({
        success: true,
        msg: "Re-joined",
        assignedColor: isAlreadyPlayer.color,
        fen: gameData.game.fen(),
        pgn: gameData.game.pgn(),
        clocks: gameData.clocks,
        config: gameData.config,
        whitePlayer: whitePlayer,
        blackPlayer: blackPlayer,
        status: status,
      });
    }

    if (gameData.players.length >= 2) {
      socket.join(gameId); // Join để nhận event 'move', 'gameOver'
      console.log(`${socket.user.email} đang xem phòng ${gameId} (Spectator)`);

      const whitePlayer = gameData.players.find((p) => p.color === "w");
      const blackPlayer = gameData.players.find((p) => p.color === "b");

      return callback({
        success: true,
        role: "spectator", // Frontend check cái này để disable bàn cờ
        fen: gameData.game.fen(),
        pgn: gameData.game.pgn(),
        clocks: gameData.clocks,
        config: gameData.config,
        whitePlayer: whitePlayer,
        blackPlayer: blackPlayer,
        status: "playing", // Spectator vào xem thì game thường đang chạy
      });
    }

    // Thêm người chơi B
    const hostColor = gameData.players[0].color;
    const guestColor = hostColor === "w" ? "b" : "w";

    // SỬA: Lưu thông tin đầy đủ của người chơi B
    const guestPlayer = {
      id: socket.user.id,
      socketId: socket.id,
      displayName: socket.user.displayName,
      rating: socket.user.rating,
      color: guestColor,
    };
    gameData.players.push(guestPlayer);

    socket.join(gameId);
    console.log(`${socket.user.username} đã tham gia phòng ${gameId}`);

    const whitePlayer = gameData.players.find((p) => p.color === "w");
    const blackPlayer = gameData.players.find((p) => p.color === "b");

    gameData.lastMoveTimestamp = Date.now();

    const timeControl = `${gameData.config.time.base}+${gameData.config.time.inc}`;
    const newGame = new Game({
      whitePlayer: whitePlayer.id,
      blackPlayer: blackPlayer.id,
      whiteRating: whitePlayer.rating,
      blackRating: blackPlayer.rating,
      timeControl: timeControl,
      isRated: gameData.config.isRated,
    });
    await newGame.save();
    gameData.dbGameId = newGame._id;

    io.to(gameId).emit("gameStart", {
      gameId: gameId,
      fen: gameData.game.fen(),
      whitePlayer: whitePlayer,
      blackPlayer: blackPlayer,
      config: gameData.config,
      clocks: gameData.clocks,
    });

    callback({
      success: true,
      assignedColor: guestColor,
      status: "joining_as_guest",
    });
  });
};
