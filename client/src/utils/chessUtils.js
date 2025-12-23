// client/src/utils/chessUtils.js

// ============================================================================
// 1. BOARD LAYOUT & UI HELPERS (Liên quan hiển thị bàn cờ, avatar)
// ============================================================================

/**
 * Tính toán layout người chơi (Top/Bottom) dựa trên hướng bàn cờ.
 * @param {string} orientation - "white" hoặc "black"
 * @param {object} whitePlayer - Thông tin người chơi Trắng
 * @param {object} blackPlayer - Thông tin người chơi Đen
 * @param {object} [whiteReport] - (Optional) Báo cáo ván đấu Trắng
 * @param {object} [blackReport] - (Optional) Báo cáo ván đấu Đen
 */
export const getPlayerLayout = (
  orientation,
  whitePlayer,
  blackPlayer,
  whiteReport = null,
  blackReport = null
) => {
  const isFlipped = orientation === "black";

  return {
    top: {
      player: isFlipped ? whitePlayer : blackPlayer,
      report: isFlipped ? whiteReport : blackReport,
      side: isFlipped ? "white" : "black",
    },
    bottom: {
      player: isFlipped ? blackPlayer : whitePlayer,
      report: isFlipped ? blackReport : whiteReport,
      side: isFlipped ? "black" : "white",
    },
  };
};

// ============================================================================
// 2. CHESS LOGIC & CALCULATION (Tính toán nước đi, FEN, PGN, Material)
// ============================================================================

/**
 * Tính toán vật chất (Material) và quân bị ăn từ FEN
 * @param {string} fen - Chuỗi FEN hiện tại
 * @returns {object} { white: { score, captured: [] }, black: { score, captured: [] } }
 */
export const calculateMaterial = (fen) => {
  const PIECE_VALUES = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
  const INITIAL_COUNTS = { p: 8, n: 2, b: 2, r: 2, q: 1, k: 1 };
  const piecePlacement = fen.split(" ")[0];

  const currentCounts = {
    w: { p: 0, n: 0, b: 0, r: 0, q: 0, k: 0 },
    b: { p: 0, n: 0, b: 0, r: 0, q: 0, k: 0 },
  };

  for (const char of piecePlacement) {
    if (isNaN(char)) {
      const color = char === char.toUpperCase() ? "w" : "b";
      const type = char.toLowerCase();
      if (currentCounts[color][type] !== undefined) {
        currentCounts[color][type]++;
      }
    }
  }

  const calculateSide = (sideColor, opponentColor) => {
    let score = 0;
    Object.keys(PIECE_VALUES).forEach((type) => {
      score += currentCounts[sideColor][type] * PIECE_VALUES[type];
    });

    const capturedPieces = [];
    Object.keys(INITIAL_COUNTS).forEach((type) => {
      if (type === "k") return;
      const count = INITIAL_COUNTS[type] - currentCounts[opponentColor][type];
      if (count > 0) {
        for (let i = 0; i < count; i++) {
          capturedPieces.push(type);
        }
      }
    });

    capturedPieces.sort((a, b) => PIECE_VALUES[b] - PIECE_VALUES[a]);
    return { score, captured: capturedPieces };
  };

  const whiteStats = calculateSide("w", "b");
  const blackStats = calculateSide("b", "w");

  const diff = whiteStats.score - blackStats.score;
  whiteStats.advantage = diff > 0 ? `+${diff}` : null;
  blackStats.advantage = diff < 0 ? `+${Math.abs(diff)}` : null;

  return { white: whiteStats, black: blackStats };
};

/**
 * Calculates the number of moves from a PGN string.
 * @param {string} pgnString - The PGN string of the game.
 * @returns {number} The total number of moves.
 */
export const getMoveCountFromPgn = (pgnString) => {
  if (!pgnString) return 0;

  // Remove PGN headers and newlines
  const pgnWithoutHeaders = pgnString
    .replace(/\[.*?\]\s*/g, " ")
    .replace(/\n/g, " ")
    .trim();
  if (!pgnWithoutHeaders) return 0;

  // Remove move numbers (e.g., "1.", "2.")
  const onlyMoves = pgnWithoutHeaders.replace(/\d+\.\s*/g, "").trim();

  // Remove game result
  const noResult = onlyMoves.replace(/\s(1-0|0-1|1\/2-1\/2|\*)$/, "").trim();
  if (!noResult) return 0;

  // Count plies (half-moves) and convert to full moves
  const plies = noResult.split(/\s+/).length;
  return Math.ceil(plies / 2);
};

// ============================================================================
// 3. GENERAL FORMATTERS (Thời gian, trạng thái game)
// ============================================================================

/**
 * Format time control string (e.g., "600+5" => "10:00 + 5")
 */
export const formatTimeControl = (timeString) => {
  if (!timeString) return "00:00";
  const str = String(timeString);
  const [base, inc] = str.includes("+") ? str.split("+") : [str, null];

  const totalSeconds = parseInt(base, 10);
  if (isNaN(totalSeconds)) return "00:00";

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const formattedTime = `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;

  return inc ? `${formattedTime} + ${inc}` : formattedTime;
};
