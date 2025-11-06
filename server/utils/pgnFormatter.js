// server/utils/pgnFormatter.js

/**
 * Thêm header vào PGN và trả về chuỗi PGN hoàn chỉnh
 * @param {object} game - Instance chess.js của ván đấu
 * @param {object} gameData - Dữ liệu ván đấu từ activeGames
 * @param {string} result - Kết quả ván đấu ('1-0', '0-1', '1/2-1/2')
 * @returns {string} Chuỗi PGN đã định dạng
 */
export function generatePgnWithHeaders(game, gameData, result) {
  // 1. Lấy thông tin người chơi
  const whitePlayerInfo = gameData.players.find((p) => p.color === "w");
  const blackPlayerInfo = gameData.players.find((p) => p.color === "b");

  // 2. Lấy ngày tháng (YYYY.MM.DD)
  const now = new Date();
  const dateStr = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(
    2,
    "0"
  )}.${String(now.getDate()).padStart(2, "0")}`;

  // 3. Lấy kiểu sự kiện (Matchmaking hay Chơi bạn)
  // (Chúng ta sẽ cần chuẩn hóa 'config' object sau, tạm thời check cả 2)
  let eventType = "Friendly Match";
  let timeControlStr = "Unlimited";
  let timeControlForDb = "Unlimited"; // "10+0"

  if (gameData.config.timeControl) {
    // Đến từ Matchmaking
    eventType = "LiveChess (Matchmaking)";
    timeControlForDb = gameData.config.timeControl;
    const parts = gameData.config.timeControl.split("+");
    timeControlStr = `${parseInt(parts[0]) * 60}+${parseInt(parts[1] || 0)}`;
  } else if (gameData.config.time) {
    // Đến từ PlayFriend
    eventType = "Friendly Match";
    timeControlForDb = `${gameData.config.time.base}+${gameData.config.time.inc}`;
    timeControlStr = `${gameData.config.time.base * 60}+${gameData.config.time.inc}`;
  }

  // 4. Set các header
  game.setHeader("Event", eventType);
  game.setHeader("Site", "aechess"); // Tên website của bạn
  game.setHeader("Date", dateStr);
  game.setHeader("Result", result);
  game.setHeader("White", whitePlayerInfo.displayName || "Player 1");
  game.setHeader("Black", blackPlayerInfo.displayName || "Player 2");
  game.setHeader("WhiteElo", whitePlayerInfo.rating || 1200);
  game.setHeader("BlackElo", blackPlayerInfo.rating || 1200);
  game.setHeader("TimeControl", timeControlStr); // PGN chuẩn (giây + giây cộng)

  // 5. Trả về PGN
  return {
    fullPgn: game.pgn(),
    timeControlForDb: timeControlForDb,
  };
}