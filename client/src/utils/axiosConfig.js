// client/src/utils/axiosConfig.js
import axios from "axios";

// Lấy URL từ biến môi trường (VITE_...) hoặc fallback về localhost
const baseURL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

const instance = axios.create({
  baseURL: baseURL,
  // timeout: 10000, // Có thể thêm timeout nếu muốn
  headers: {
    "Content-Type": "application/json",
  },
});

// INTERCEPTOR: Tự động gắn Token vào mọi request
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken"); // Hoặc lấy từ nơi bạn lưu token
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

instance.interceptors.response.use(
  (response) => {
    // Nếu server trả về 2xx, trả về data bình thường
    // Bạn có thể return response.data để đỡ phải chấm .data ở client
    return response.data;
  },
  (error) => {
    // Xử lý các lỗi chung
    if (error.response && error.response.status === 401) {
      // Ví dụ: Token hết hạn hoặc không hợp lệ
      console.error("Token expired or unauthorized. Redirecting to login...");
      localStorage.removeItem("accessToken");
      // window.location.href = "/auth/login"; // Có thể redirect cứng về trang login
    }
    return Promise.reject(error);
  }
);

export default instance;
