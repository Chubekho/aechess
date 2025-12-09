/**
 * Xác định vị trí và thông tin người chơi dựa trên hướng bàn cờ
 */
export const getPlayerLayout = (gameData, orientation) => {
  // orientation: 'white' (Trắng dưới) | 'black' (Đen dưới)
  
  // Default info
  const whiteInfo = gameData?.whitePlayer || { name: "White" };
  const blackInfo = gameData?.blackPlayer || { name: "Black" };

  if (orientation === 'white') {
    return {
      top: { player: blackInfo, side: 'black' },
      bottom: { player: whiteInfo, side: 'white' }
    };
  } else {
    return {
      top: { player: whiteInfo, side: 'white' },
      bottom: { player: blackInfo, side: 'black' }
    };
  }
};