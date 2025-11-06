// server/utils/eloCalculator.js

const K_FACTOR = 32; // Hằng số K cho người chơi

/**
 * Tính điểm Elo mới
 * @param {number} whiteRating Rating cũ của Trắng
 * @param {number} blackRating Rating cũ của Đen
 * @param {string} result '1-0', '0-1', hoặc '1/2-1/2'
 * @returns {{whiteNew: number, blackNew: number}}
 */
export function calculateNewRatings(whiteRating, blackRating, result) {
  // 1. Tính điểm thực tế (S_A)
  const S_white = result === '1-0' ? 1 : (result === '1/2-1/2' ? 0.5 : 0);
  const S_black = 1 - S_white;

  // 2. Tính xác suất thắng mong đợi (E_A)
  const E_white = 1 / (1 + 10 ** ((blackRating - whiteRating) / 400));
  const E_black = 1 - E_white; // Hoặc 1 / (1 + 10 ** ((whiteRating - blackRating) / 400))
  
  // 3. Tính rating mới (R'_A = R_A + K(S_A - E_A))
  const R_white_new = whiteRating + K_FACTOR * (S_white - E_white);
  const R_black_new = blackRating + K_FACTOR * (S_black - E_black);
  
  return {
    whiteNew: Math.round(R_white_new),
    blackNew: Math.round(R_black_new)
  };
}