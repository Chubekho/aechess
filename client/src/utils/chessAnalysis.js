// client/src/utils/chessAnalysis.js

/**
 * Chuyển đổi điểm Centipawn (cp) sang Tỷ lệ thắng (0 - 100%)
 * Công thức tham khảo từ Lichess/Stockfish
 */
export const getWinChance = (cp) => {
  if (cp === null) return 50; // Unknown
  // Giới hạn cp trong khoảng hợp lý (-1000 đến 1000) để tính toán
  const clampedCp = Math.max(-1000, Math.min(1000, cp));
  return 50 + 50 * (2 / (1 + Math.exp(-0.00368208 * clampedCp)) - 1);
};

/**
 * Phân loại nước đi dựa trên sự sụt giảm tỷ lệ thắng
 * @param {number} prevWinChance - Tỷ lệ thắng trước khi đi
 * @param {number} currentWinChance - Tỷ lệ thắng sau khi đi
 */
export const classifyMove = (prevWinChance, currentWinChance) => {
  // Tính độ chênh lệch (Delta)
  // Nếu diff < 0 tức là tỷ lệ thắng tăng (do đối thủ đi lỗi trước đó hoặc engine đánh giá lại) -> Coi là 0
  const diff = Math.max(0, prevWinChance - currentWinChance);

  // 1. BEST (Tốt nhất) - Icon: ⭐
  // Không mất % thắng nào hoặc tăng % thắng
  if (diff <= 0.5) return "best"; 

  // 2. EXCELLENT (Xuất sắc) - Icon: 👍
  // Mất rất ít lợi thế (< 3% cơ hội thắng)
  if (diff <= 3) return "excellent";

  // 3. GOOD (Tốt / Bình thường) - Icon: (Ẩn)
  // Mất lợi thế chấp nhận được (< 15%). 
  if (diff < 15) return "good"; 

  // 4. MISTAKE (Sai lầm) - Icon: ? (Màu cam)
  // Mất lợi thế đáng kể (15% - 25%)
  if (diff < 25) return "mistake"; 

  // 5. BLUNDER (Ngớ ngẩn) - Icon: ?? (Màu đỏ)
  // Mất lợi thế nghiêm trọng (> 25%)
  return "blunder"; 
};

/**
 * Tính độ chính xác trung bình (CAPS)
 * @param {Array} movesData - Mảng chứa winChance của từng nước
 */
export const calculateAccuracy = (movesData) => {
  let whiteAcc = 0, blackAcc = 0;
  let whiteMoves = 0, blackMoves = 0;

  movesData.forEach((move) => {
    // move.accuracyScore là điểm chấm cho nước đi đó (0-100)
    // 100 - (sự sụt giảm win chance * trọng số)
    if (move.turn === 'w') {
        whiteAcc += move.accuracyScore;
        whiteMoves++;
    } else {
        blackAcc += move.accuracyScore;
        blackMoves++;
    }
  });

  return {
    white: whiteMoves ? (whiteAcc / whiteMoves).toFixed(1) : 0,
    black: blackMoves ? (blackAcc / blackMoves).toFixed(1) : 0,
  };
};