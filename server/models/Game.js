// server/models/Game.js
import mongoose from "mongoose";

const GameSchema = new mongoose.Schema({
  // --- Dùng để truy vấn nhanh (Querying) ---
  whitePlayer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true // Thêm index để tìm kiếm nhanh
  },
  blackPlayer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  result: {
    type: String, // '1-0', '0-1', '1/2-1/2'
    required: true,
    index: true
  },
  isRated: {
    type: Boolean,
    default: true,
  },
  // Rating TRƯỚC khi ván đấu diễn ra
  whiteRating: Number,
  blackRating: Number,
  
  // --- Dùng để lưu trữ & Phân tích ---
  pgn: {
    type: String,
  },
  timeControl: {
    type: String, // e.g., "10+0", "5+3"
  },
}, { timestamps: true }); // Tự động thêm createdAt

const Game = mongoose.model("Game", GameSchema);
export default Game;