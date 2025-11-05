import { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";

import { AuthContext } from "./AuthContext";

// 2. Tạo Provider (Component "bọc")
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(
    () => localStorage.getItem("token") || null
  );
  const [loading, setLoading] = useState(true); // State check "đang tải"

  // Cấu hình axios gửi token theo mỗi request
  const api = useMemo(
    () =>
      axios.create({
        baseURL: "http://localhost:8080/api", // Địa chỉ backend
      }),
    []
  );

  // Logic này sẽ chạy lại mỗi khi 'token' hoặc 'api' thay đổi
  useEffect(() => {
    // Cài đặt interceptor
    const interceptor = api.interceptors.request.use((config) => {
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Hàm dọn dẹp: gỡ interceptor cũ khi token thay đổi
    return () => {
      api.interceptors.request.eject(interceptor);
    };
  }, [api, token]); // Phụ thuộc vào api và token

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, [setToken, setUser]);

  // useEffect để tự động lấy thông tin user khi có token
  useEffect(() => {
    const fetchUser = async () => {
      if (token) {
        try {
          localStorage.setItem("token", token);
          const res = await api.get("/auth/me");
          setUser(res.data);
        } catch (err) {
          console.error("Token không hợp lệ, đăng xuất:", err);
          logout();
        }
      } else {
        localStorage.removeItem("token");
      }
      setLoading(false);
    };
    fetchUser();
  }, [token, api, logout]);

  // === Các hàm (Actions) ===

  const login = async (email, password) => {
    try {
      const res = await api.post("/auth/login", { email, password });
      setToken(res.data.token); // Kích hoạt useEffect
    } catch (err) {
      console.error("Lỗi đăng nhập:", err);
      throw new Error(err.response.data.msg || "Đăng nhập thất bại");
    }
  };

  const register = async (email, password) => {
    try {
      const res = await api.post("/auth/register", { email, password });
      setToken(res.data.token); // Kích hoạt useEffect
    } catch (err) {
      console.error("Lỗi đăng ký:", err);
      throw new Error(err.response.data.msg || "Đăng ký thất bại");
    }
  };

  // MỚI: Hàm này dành cho AuthCallback.jsx
  const manualSetToken = (newToken) => {
    if (newToken) {
      setToken(newToken); // Kích hoạt useEffect để lấy user
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        register,
        logout,
        loading,
        manualSetToken, // <-- Thêm hàm mới vào context
      }}
    >
      {!loading && children} {/* Chỉ render khi đã check xong auth */}
    </AuthContext.Provider>
  );
};
