// client/src/utils/chessHelpers.js

/**
 * Chuyển đổi giây sang định dạng MM:SS
 * @param {string|number} timeString - Chuỗi dạng "600+5" hoặc số giây "600"
 * @returns {string} - "10:00 + 5" hoặc "10:00"
 */
export const formatTimeControl = (timeString) => {
  if (!timeString) return "00:00";

  // Chuyển về string để xử lý an toàn
  const str = String(timeString);

  // Tách phần giây gốc và phần increment (nếu có dấu +)
  // Ví dụ: "600+5" -> base="600", inc="5"
  const [base, inc] = str.includes('+') ? str.split('+') : [str, null];

  const totalSeconds = parseInt(base, 10);
  if (isNaN(totalSeconds)) return "00:00";

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  // Format số phút và giây (luôn hiển thị 2 chữ số cho giây)
  const formattedTime = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

  // Nếu có increment thì nối thêm vào
  return inc ? `${formattedTime} + ${inc}` : formattedTime;
};

/**
 * (Chuẩn bị cho tương lai)
 * Hàm tính toán hiển thị thay đổi rating
 */
// export const formatRatingChange = (newRating, oldRating) => {
//     // Logic sau này bạn sẽ viết ở đây
//     // return { value: "+10", color: "green" }...
// };