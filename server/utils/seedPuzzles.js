// server/utils/seedPuzzles.js
import fs from "fs";
import csv from "csv-parser";
import mongoose from "mongoose";
import dotenv from "dotenv";
import Puzzle from "../models/Puzzle.js";

// Load biến môi trường
dotenv.config();

// Kết nối DB
const connectDB = async () => {
  try {
    await mongoose.connect(
      process.env.MONGO_URI || "mongodb://localhost:27017/aechess"
    );
    console.log("MongoDB Connected for Seeding");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

const importData = async () => {
  await connectDB();

  const results = [];
  // Đảm bảo file csv nằm đúng chỗ (ví dụ để ngay trong thư mục server)
  const CSV_FILE_PATH = "./lichess_puzzles_sample.csv";

  fs.createReadStream(CSV_FILE_PATH)
    .pipe(csv()) // Nếu file dùng dấu chấm phẩy, sửa thành: csv({ separator: ';' })
    .on("data", (data) => {
      // --- DEBUG LOG ---
      // Mở dòng dưới đây nếu chạy lại vẫn lỗi để xem tên cột thực tế là gì
      // console.log("Row data:", data);

      // --- FIX LỖI: Kiểm tra dữ liệu trước khi xử lý ---

      // 1. Kiểm tra xem cột Moves có tồn tại không.
      // Lưu ý: Cột trong file CSV viết hoa hay thường thì ở đây phải viết y hệt.
      // Code dưới đây ưu tiên 'Moves', nếu không có thì tìm 'moves'
      const movesRaw = data.Moves || data.moves;

      if (!movesRaw) {
        // Nếu dòng này không có moves (ví dụ dòng trống), bỏ qua
        return;
      }

      results.push({
        // Tương tự, kiểm tra cả 2 trường hợp Hoa/Thường cho các cột khác
        puzzleId: data.PuzzleId || data.puzzleId,
        fen: data.FEN || data.fen,

        // Sử dụng toán tử ?. để an toàn hơn, hoặc dùng biến movesRaw đã check ở trên
        moves: movesRaw.split(" "),

        rating: parseInt(data.Rating || data.rating || 1500),
        rd: parseInt(data.RatingDeviation || data.ratingDeviation || 0),

        themes: (data.Themes || data.themes || "").split(" "),
        openingTags: (data.OpeningTags || data.openingTags || "").split(" "),
      });
    })
    .on("end", async () => {
      console.log(
        `Đã đọc xong ${results.length} puzzles. Bắt đầu lưu vào DB...`
      );
      try {
        // ordered: false để nếu 1 bản ghi lỗi (trùng ID) thì các bản ghi khác vẫn chạy
        await Puzzle.insertMany(results, { ordered: false });
        console.log("Import thành công!");
      } catch (error) {
        // Bỏ qua lỗi trùng lặp (E11000)
        if (error.code === 11000) {
          console.log(
            "Import hoàn tất (Có một số Puzzle bị trùng lặp đã được bỏ qua)."
          );
        } else {
          console.log("Có lỗi:", error.message);
        }
      } finally {
        mongoose.disconnect();
        console.log("Đã ngắt kết nối DB.");
        process.exit();
      }
    });
};

importData();
