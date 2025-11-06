// server/socket/matchmakingHandlers.js
import { Chess } from "chess.js";
import createShortId from "../utils/CreateShortId.js";

// Đăng ký các event `findMatch`, `cancelFindMatch`
export const registerMatchmakingHandlers = (io, socket, matchmakingQueue) => {
  
  socket.on("findMatch", (config) => {
    // Kiểm tra xem user đã ở trong queue chưa
    const alreadyInQueue = matchmakingQueue.some(p => p.userId === socket.user.id);
    if (alreadyInQueue) return; 
    
    console.log(`User ${socket.user.id} đang tìm trận ${config.timeControl}`);
    matchmakingQueue.push({
      userId: socket.user.id,
      socketId: socket.id,
      rating: socket.user.rating,
      config: config, // { timeControl: "10+0", isRated: true }
      joinTime: Date.now()
    });
  });

  socket.on("cancelFindMatch", () => {
    const index = matchmakingQueue.findIndex(p => p.userId === socket.user.id);
    if (index !== -1) {
      matchmakingQueue.splice(index, 1);
      console.log(`User ${socket.user.id} đã hủy tìm trận.`);
    }
  });

  // Xử lý ngắt kết nối: cũng phải xóa khỏi queue
  socket.on("disconnect", () => {
    const index = matchmakingQueue.findIndex(p => p.socketId === socket.id);
    if (index !== -1) {
      matchmakingQueue.splice(index, 1);
      console.log(`User ${socket.user.id} (disconnect) đã bị xóa khỏi queue.`);
    }
  });
};


// Bộ não ghép trận (chạy bằng setInterval)
function processMatchmakingQueue(io, matchmakingQueue, activeGames) {
  if (matchmakingQueue.length < 2) return;

  // Sắp xếp: Ưu tiên rating
  matchmakingQueue.sort((a, b) => a.rating - b.rating);

  let i = 0;
  while (i < matchmakingQueue.length - 1) {
    const pA = matchmakingQueue[i];
    const pB = matchmakingQueue[i + 1];

    // Tiêu chí ghép:
    const timeMatch = pA.config.timeControl === pB.config.timeControl;
    const ratedMatch = pA.config.isRated === pB.config.isRated;
    const ratingMatch = Math.abs(pA.rating - pB.rating) <= 100; // Chênh lệch <= 100

    if (timeMatch && ratedMatch && ratingMatch) {
      // === TÌM THẤY TRẬN! ===
      console.log(`Ghép trận: ${pA.userId} vs ${pB.userId}`);
      
      // 1. Xóa họ khỏi queue
      matchmakingQueue.splice(i + 1, 1);
      matchmakingQueue.splice(i, 1);

      // 2. Tạo logic game (giống 'createRoom')
      const gameId = createShortId();
      const game = new Chess();
      
      const timeParts = pA.config.timeControl.split('+');
      const config = {
        time: { base: parseInt(timeParts[0]), inc: parseInt(timeParts[1] || 0) },
        isRated: pA.config.isRated,
      };
      
      const baseTimeSeconds = config.time.base * 60;

      // 3. Gán màu ngẫu nhiên
      const pA_Color = Math.random() > 0.5 ? 'w' : 'b';
      const pB_Color = pA_Color === 'w' ? 'b' : 'w';

      const whitePlayer = (pA_Color === 'w') ? pA : pB;
      const blackPlayer = (pA_Color === 'w') ? pB : pA;

      // 4. Lưu game vào bộ nhớ
      activeGames.set(gameId, {
        game: game,
        players: [
          { id: whitePlayer.userId, socketId: whitePlayer.socketId, color: 'w', rating: whitePlayer.rating },
          { id: blackPlayer.userId, socketId: blackPlayer.socketId, color: 'b', rating: blackPlayer.rating }
        ],
        config: config,
        clocks: { w: baseTimeSeconds, b: baseTimeSeconds },
        lastMoveTimestamp: Date.now(), // Bắt đầu đếm giờ
      });
      
      // 5. Lấy socket của 2 người chơi
      const socketA = io.sockets.sockets.get(pA.socketId);
      const socketB = io.sockets.sockets.get(pB.socketId);

      if (socketA && socketB) {
        socketA.join(gameId);
        socketB.join(gameId);
        
        // 6. Gửi thông báo "ĐÃ TÌM THẤY TRẬN"
        io.to(gameId).emit("matchFound", { gameId });
      } else {
        // (Nếu 1 trong 2 ngắt kết nối, hủy game)
        activeGames.delete(gameId);
        // (Có thể đưa người còn lại về queue)
      }
    } else {
      i++; // Không khớp, kiểm tra cặp tiếp theo
    }
  }
}

// Hàm khởi chạy (chạy 1 lần duy nhất)
export const startMatchmakingEngine = (io, matchmakingQueue, activeGames) => {
  setInterval(() => {
    processMatchmakingQueue(io, matchmakingQueue, activeGames);
  }, 5000); // 5 giây 1 lần
};