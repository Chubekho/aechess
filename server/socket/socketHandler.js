import { activeGames } from "../utils/gameState.js";
import { registerGameHandlers } from "./gameHandlers.js";
import { registerRoomHandlers } from "./roomHandlers.js";
import {
  registerMatchmakingHandlers,
  startMatchmakingEngine,
} from "./matchmakingHandlers.js";
import socketAuth from "../middleware/socketAuth.js";

// --- State Chung Của Server ---

// Nơi lưu trữ tất cả các ván đấu đang diễn ra

const matchmakingQueue = [];

const initializeSocket = (io) => {
  //middleware Auth
  io.use(socketAuth);

  io.on("connection", (socket) => {
    console.log(`User đã xác thực: ${socket.id}, Email: ${socket.user.username}`);


    // === 3. XỬ LÝ GAME ===
    registerRoomHandlers(io, socket, activeGames);
    registerGameHandlers(io, socket, activeGames);
    registerMatchmakingHandlers(io, socket, matchmakingQueue, activeGames);

    // === Xử lý Ngắt kết nối ===
    socket.on("disconnect", () => {
      console.log(`Client đã ngắt kết nối: ${socket.id}`);
      // TODO: Bạn cần thêm logic để xử lý 'disconnect'
      // (Bạn nên thêm logic xử lý khi 1 trong 2 người chơi thoát)
      // Ví dụ: tìm xem socket.id này có đang ở trong 'activeGames' không
      // Nếu có, emit 'gameOver' (đối thủ thắng) cho người chơi còn lại
    });
  });
  startMatchmakingEngine(io, matchmakingQueue, activeGames);
};

export default initializeSocket;
