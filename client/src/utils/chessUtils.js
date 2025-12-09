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
