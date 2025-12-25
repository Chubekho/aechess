//server/socket/matchmakingHandlers.js
import { Chess } from "chess.js";
import createShortId from "../utils/CreateShortId.js";
import Game from "../models/Game.js";

// State (bộ nhớ) cho các trận đang chờ xác nhận
const pendingMatches = new Map();

/**
 * Đăng ký các event listener liên quan đến matchmaking
 */
export const registerMatchmakingHandlers = (
  io,
  socket,
  matchmakingQueue,
  activeGames
) => {
  // --- 1. User bắt đầu tìm trận ---
  socket.on("findMatch", (config) => {
    const alreadyInQueue = matchmakingQueue.some(
      (p) => p.user.id === socket.user.id
    );
    if (alreadyInQueue) return;

    console.log(
      `User ${socket.user.username} đang tìm trận ${config.timeControl}`
    );

    matchmakingQueue.push({
      user: {
        id: socket.user.id,
        username: socket.user.username,
        ratings: socket.user.ratings,
        avatar: socket.user.avatar,
      },
      socketId: socket.id,
      config: config,
      joinTime: Date.now(),
    });
  });

  // --- 2. User hủy tìm (khi đang ở màn hình "Đang tìm...") ---
  socket.on("cancelFindMatch", () => {
    const index = matchmakingQueue.findIndex(
      (p) => p.user.id === socket.user.id
    );
    if (index !== -1) {
      matchmakingQueue.splice(index, 1);
      console.log(`User ${socket.user.email} đã hủy tìm trận.`);
    }
  });

  // --- 3. User nhấn "Chơi" (Chấp nhận) ---
  socket.on("acceptMatch", async ({ matchId }) => {
    const match = pendingMatches.get(matchId);
    if (!match) return; // Trận đã bị hủy

    const { playerA, playerB } = match;

    if (playerA.socketId === socket.id) {
      match.acceptedA = true;
    } else if (playerB.socketId === socket.id) {
      match.acceptedB = true;
    }

    if (match.acceptedA && match.acceptedB) {
      // SỬA: Gỡ bom hẹn giờ
      clearTimeout(match.timerId);

      // === CHÍNH THỨC TẠO GAME ===
      const gameId = createShortId(8);
      const game = new Chess();
      const category = getTimeCategory(playerA.config.timeControl);
      const timeParts = playerA.config.timeControl.split("+");
      const config = {
        time: {
          base: parseInt(timeParts[0]),
          inc: parseInt(timeParts[1] || 0),
        },
        isRated: playerA.config.isRated,
        category: category,
      };
      const baseTimeSeconds = config.time.base * 60;

      const pA_Color = Math.random() > 0.5 ? "w" : "b";
      const pB_Color = pA_Color === "w" ? "b" : "w";
      const whitePlayer = pA_Color === "w" ? playerA : playerB;
      const blackPlayer = pA_Color === "w" ? playerB : playerA;
      const whiteRating = whitePlayer.user.ratings[category] || 1200;
      const blackRating = blackPlayer.user.ratings[category] || 1200;

      const newGame = new Game({
        whitePlayer: whitePlayer.user.id,
        blackPlayer: blackPlayer.user.id,
        whiteRating: whiteRating,
        blackRating: blackRating,
        timeControl: playerA.config.timeControl,
        isRated: config.isRated,
      });
      await newGame.save();

      // SỬA: Xóa bỏ 1 lần activeGames.set bị trùng
      activeGames.set(gameId, {
        dbGameId: newGame._id,
        game: game,
        players: [
          {
            id: whitePlayer.user.id,
            username: whitePlayer.user.username,
            rating: whiteRating,
            socketId: whitePlayer.socketId,
            color: "w",
            avatar: whitePlayer.user.avatar,
          },
          {
            id: blackPlayer.user.id,
            username: blackPlayer.user.username,
            rating: blackRating,
            socketId: blackPlayer.socketId,
            color: "b",
            avatar: blackPlayer.user.avatar,
          },
        ],
        config: config,
        clocks: { w: baseTimeSeconds, b: baseTimeSeconds },
        lastMoveTimestamp: Date.now(),
        drawOffer: null,
      });

      const socketA = io.sockets.sockets.get(playerA.socketId);
      const socketB = io.sockets.sockets.get(playerB.socketId);

      // SỬA: Thêm lại logic emit "gameStart"
      if (socketA && socketB) {
        socketA.join(gameId);
        socketB.join(gameId);

        io.to(gameId).emit("gameStart", {
          gameId: gameId,
          fen: game.fen(),
          whitePlayer: activeGames
            .get(gameId)
            .players.find((p) => p.color === "w"),
          blackPlayer: activeGames
            .get(gameId)
            .players.find((p) => p.color === "b"),
          config: config,
          clocks: activeGames.get(gameId).clocks,
        });
      }

      pendingMatches.delete(matchId);
    }
  });

  // --- 4. User nhấn "Hủy" (Từ chối trận) ---
  socket.on("declineMatch", ({ matchId }) => {
    const match = pendingMatches.get(matchId);
    if (!match) return;

    // SỬA: Gỡ bom hẹn giờ
    clearTimeout(match.timerId);

    const { playerA, playerB } = match;
    const opponent =
      playerA.socketId === socket.id ? playerB : playerA;
    const opponentSocket = io.sockets.sockets.get(opponent.socketId);

    // SỬA: Xóa logic re-queue
    if (opponentSocket) {
      opponentSocket.emit("matchAborted", { reQueued: false });
    }

    pendingMatches.delete(matchId);
  });

  // --- 5. User ngắt kết nối (Rất quan trọng) ---
  socket.on("disconnect", () => {
    // 1. Dọn dẹp hàng đợi matchmaking
    const queueIndex = matchmakingQueue.findIndex(
      (p) => p.socketId === socket.id
    );
    if (queueIndex !== -1) {
      matchmakingQueue.splice(queueIndex, 1);
      console.log(
        `User ${socket.user?.email || socket.id} (disconnect) đã bị xóa khỏi queue.`
      );
    }

    // 2. Dọn dẹp phòng chờ (pendingMatches) - coi như 'decline'
    for (const [matchId, match] of pendingMatches.entries()) {
      let opponent;
      if (match.playerA.socketId === socket.id) {
        opponent = match.playerB;
      } else if (match.playerB.socketId === socket.id) {
        opponent = match.playerA;
      } else {
        continue; // Socket này không ở trong match
      }
      
      // SỬA: Gỡ bom hẹn giờ
      clearTimeout(match.timerId);

      const opponentSocket = io.sockets.sockets.get(opponent.socketId);

      // SỬA: Xóa logic re-queue
      if (opponentSocket) {
        opponentSocket.emit("matchAborted", { reQueued: false });
      }

      pendingMatches.delete(matchId);
      break;
    }
  });
};

/**
 * Bộ não ghép trận (chạy bằng setInterval)
 */
function processMatchmakingQueue(
  io,
  matchmakingQueue,
  activeGames,
  pendingMatches
) {
  if (matchmakingQueue.length < 2) return;

  matchmakingQueue.sort(
    (a, b) => (a.user.ratings.blitz || 1200) - (b.user.ratings.blitz || 1200)
  );

  let i = 0;
  while (i < matchmakingQueue.length - 1) {
    const pA = matchmakingQueue[i];
    const pB = matchmakingQueue[i + 1];

    const timeMatch = pA.config.timeControl === pB.config.timeControl;
    const ratedMatch = pA.config.isRated === pB.config.isRated;
    const category = getTimeCategory(pA.config.timeControl);
    const ratingA = pA.user.ratings[category] || 1200;
    const ratingB = pB.user.ratings[category] || 1200;
    const ratingMatch = Math.abs(ratingA - ratingB) <= 100;

    if (timeMatch && ratedMatch && ratingMatch) {
      // === TÌM THẤY TRẬN! ===
      console.log(
        `Ghép trận: ${pA.user.username} vs ${pB.user.username}`
      );

      matchmakingQueue.splice(i + 1, 1);
      matchmakingQueue.splice(i, 1);

      const matchId = createShortId(6);

      // Đặt hẹn giờ 10s để xử lý Timeout
      const timerId = setTimeout(() => {
        const match = pendingMatches.get(matchId);
        if (!match) return;

        console.log(`Hủy trận ${matchId} do hết giờ.`);
        
        const socketA = io.sockets.sockets.get(pA.socketId);
        const socketB = io.sockets.sockets.get(pB.socketId);

        // SỬA: Xóa logic re-queue
        if (socketA) socketA.emit("matchAborted", { reQueued: false });
        if (socketB) socketB.emit("matchAborted", { reQueued: false });
        
        pendingMatches.delete(matchId);
      }, 10000);

      // SỬA: Lưu timerId vào match
      pendingMatches.set(matchId, {
        playerA: pA,
        playerB: pB,
        acceptedA: false,
        acceptedB: false,
        timerId: timerId, // <-- Quan trọng để gỡ bom
      });

      const socketA = io.sockets.sockets.get(pA.socketId);
      const socketB = io.sockets.sockets.get(pB.socketId);

      if (socketA) {
        socketA.emit("matchFound", {
          matchId: matchId,
          opponent: {
            username: pB.user.username,
            rating: ratingB,
            avatar: pB.user.avatar,
          },
        });
      }
      if (socketB) {
        socketB.emit("matchFound", {
          matchId: matchId,
          opponent: {
            username: pA.user.username,
            rating: ratingA,
            avatar: pA.user.avatar,
          },
        });
      }
    } else {
      i++;
    }
  }
}

// Helper để xác định thể loại
function getTimeCategory(timeControl) {
  const parts = timeControl.split("+").map(Number);
  const baseMinutes = parts[0];
  const incrementSeconds = parts[1] || 0;
  const estimatedTime = baseMinutes * 60 + incrementSeconds * 40;

  if (estimatedTime < 180) return "bullet";
  if (estimatedTime < 600) return "blitz";
  if (estimatedTime < 1500) return "rapid";
  return "classical";
}

/**
 * Hàm khởi chạy (chạy 1 lần duy nhất)
 */
export const startMatchmakingEngine = (io, matchmakingQueue, activeGames) => {
  setInterval(() => {
    processMatchmakingQueue(io, matchmakingQueue, activeGames, pendingMatches);
  }, 5000);
};