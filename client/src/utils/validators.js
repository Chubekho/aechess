// Utils/validators.js (Tạo file này để dùng chung)

export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validateUsername = (username) => {
  // ^ : Bắt đầu chuỗi
  // [a-zA-Z0-9_-] : Chỉ chấp nhận chữ không dấu, số, gạch ngang, gạch dưới
  // {3,20} : Độ dài từ 3 đến 20
  // $ : Kết thúc chuỗi
  const re = /^[a-zA-Z0-9_-]{3,20}$/;
  return re.test(username);
};