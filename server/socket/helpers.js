// server/socket/helpers.js

export const getPlayerColor = (gameData, socketId) => {
  if (!gameData || !gameData.players) return null;
  return gameData.players.find((p) => p.id === socketId)?.color;
};
