// server/socket/helpers.js

/**
 * Lấy màu của người chơi (w/b) dựa trên User ID
 */
export const getPlayerColor = (gameData, userId) => {
  if (!gameData || !gameData.players) return null;
  return gameData.players.find((p) => p.id === userId)?.color;
};

/**
 * Lấy object player của đối thủ
 */
export const getOpponent = (gameData, userId) => {
  if (!gameData || !gameData.players) return null;
  return gameData.players.find((p) => p.id !== userId);
};