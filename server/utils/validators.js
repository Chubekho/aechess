// server/utils/validators.js

export const validateEmail = (email) => {
  // Regex kiểm tra email cơ bản
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validateUsername = (username) => {
  // Regex: 3-20 ký tự, không dấu, không khoảng trắng, chỉ gồm chữ, số, - và _
  const re = /^[a-zA-Z0-9_-]{3,20}$/;
  return re.test(username);
};