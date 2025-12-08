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
  const diff = prevWinChance - currentWinChance;

  // Logic phân loại cơ bản (có thể tinh chỉnh sau)
  if (diff <= 0) return "best";       // Tăng hoặc giữ nguyên tỷ lệ thắng -> Nước đi tốt nhất/Excellent
  if (diff < 5) return "good";        // Mất ít lợi thế -> Tốt
  if (diff < 10) return "inaccuracy"; // Thiếu chính xác
  if (diff < 20) return "mistake";    // Sai lầm
  return "blunder";                   // Sai lầm nghiêm trọng
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