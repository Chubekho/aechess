// client/src/utils/chessUtils.js

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
  // Nếu bàn cờ xoay (Black ở dưới), thì isFlipped = true
  const isFlipped = orientation === "black";

  // LOGIC:
  // 1. Nếu boardOrientation = "white" (Mặc định):
  //    - Top: Black
  //    - Bottom: White
  // 2. Nếu boardOrientation = "black" (Xoay):
  //    - Top: White
  //    - Bottom: Black

  const topPlayer = isFlipped ? whitePlayer : blackPlayer;
  const topReport = isFlipped ? whiteReport : blackReport;
  const topSide = isFlipped ? "white" : "black";

  const bottomPlayer = isFlipped ? blackPlayer : whitePlayer;
  const bottomReport = isFlipped ? blackReport : whiteReport;
  const bottomSide = isFlipped ? "black" : "white";

  return {
    top: {
      player: topPlayer,
      report: topReport,
      side: topSide, // Dùng để quyết định màu Avatar
    },
    bottom: {
      player: bottomPlayer,
      report: bottomReport,
      side: bottomSide,
    },
  };
};

/**
 * [MỚI] Tính toán vật chất (Material) và quân bị ăn từ FEN
 * @param {string} fen - Chuỗi FEN hiện tại
 * @returns {object} { white: { score, captured: [] }, black: { score, captured: [] } }
 */
export const calculateMaterial = (fen) => {
  // 1. Định nghĩa giá trị và số lượng quân ban đầu
  const PIECE_VALUES = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
  const INITIAL_COUNTS = { p: 8, n: 2, b: 2, r: 2, q: 1, k: 1 };

  // 2. Đếm số quân hiện tại trên bàn cờ
  // piecePlacement là phần đầu tiên của FEN (trước dấu cách)
  const piecePlacement = fen.split(" ")[0];

  const currentCounts = {
    w: { p: 0, n: 0, b: 0, r: 0, q: 0, k: 0 },
    b: { p: 0, n: 0, b: 0, r: 0, q: 0, k: 0 },
  };

  for (const char of piecePlacement) {
    if (isNaN(char)) {
      // Nếu là ký tự quân cờ (không phải số ô trống)
      const color = char === char.toUpperCase() ? "w" : "b";
      const type = char.toLowerCase();
      if (currentCounts[color][type] !== undefined) {
        currentCounts[color][type]++;
      }
    }
  }

  // 3. Tính toán quân bị ăn và tổng điểm
  const calculateSide = (sideColor, opponentColor) => {
    let score = 0;
    // const captured = [];

    // Tính điểm hiện tại của phe này
    Object.keys(PIECE_VALUES).forEach((type) => {
      score += currentCounts[sideColor][type] * PIECE_VALUES[type];
    });

    // Tính quân của ĐỐI PHƯƠNG mà phe này đã ăn (Initial - Opponent Current)
    // Ví dụ: Phe Trắng (w) hiển thị quân Đen (b) bị ăn bên cạnh tên mình
    const capturedPieces = [];
    Object.keys(INITIAL_COUNTS).forEach((type) => {
      if (type === "k") return; // Không tính vua
      const count = INITIAL_COUNTS[type] - currentCounts[opponentColor][type];
      if (count > 0) {
        for (let i = 0; i < count; i++) {
          capturedPieces.push(type);
        }
      }
    });

    // Sắp xếp quân bị ăn theo giá trị giảm dần (Q -> R -> B -> N -> P)
    capturedPieces.sort((a, b) => PIECE_VALUES[b] - PIECE_VALUES[a]);

    return { score, captured: capturedPieces };
  };

  const whiteStats = calculateSide("w", "b");
  const blackStats = calculateSide("b", "w");

  // 4. Tính điểm chênh lệch (Advantage)
  // Nếu Trắng 39, Đen 35 -> Trắng +4
  const diff = whiteStats.score - blackStats.score;
  whiteStats.advantage = diff > 0 ? `+${diff}` : null;
  blackStats.advantage = diff < 0 ? `+${Math.abs(diff)}` : null;

  return {
    white: whiteStats,
    black: blackStats,
  };
};
