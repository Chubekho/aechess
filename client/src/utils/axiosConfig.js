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

export default instance;