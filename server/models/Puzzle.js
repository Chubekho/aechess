// models/Puzzle.js
import mongoose from "mongoose";

const puzzleSchema = new mongoose.Schema(
  {
    // ID gốc từ Lichess
    puzzleId: {
      type: String,
      required: true,
      unique: true,
    },
    // Thế cờ ban đầu
    fen: {
      type: String,
      required: true,
    },
    // Các nước đi giải (VD: ["e2e4", "e7e5"])
    moves: [
      {
        type: String,
        required: true,
      },
    ],
    // Chỉ số Glicko-2 của Puzzle
    rating: {
      type: Number,
      default: 1500,
    },
    rd: {
      type: Number,
      default: 350,
    },
    vol: {
      type: Number,
      default: 0.06,
    },
    // Chủ đề: "mateIn2", "pin", "fork"...
    themes: [String],
    openingTags: [String],
    // Độ phổ biến (tuỳ chọn)
    popularity: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Đánh index để tìm kiếm random nhanh hơn theo rating
puzzleSchema.index({ rating: 1 });

export default mongoose.model("Puzzle", puzzleSchema);
