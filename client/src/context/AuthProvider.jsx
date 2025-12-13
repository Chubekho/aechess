import { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";

import { AuthContext } from "./AuthContext";

// 2. Tạo Provider (Component "bọc")
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(
    () => localStorage.getItem("accessToken") || null
  );
  const [loading, setLoading] = useState(true);

  // Cấu hình axios gửi token theo mỗi request
  const api = useMemo(
    () =>
      axios.create({
        baseURL: "http://localhost:8080/api",
        headers: {
          "Content-Type": "application/json",
        },
      }),
    []
  );

  // Logic này sẽ chạy lại mỗi khi 'token' hoặc 'api' thay đổi
  useEffect(() => {
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
  }, [api, token]);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("accessToken");
  }, [setToken, setUser]);

  // useEffect để tự động lấy thông tin user khi có token
  useEffect(() => {
    const fetchUser = async () => {
      if (token) {
        try {
          localStorage.setItem("accessToken", token);
          const res = await api.get("/auth/me");
          setUser(res.data);
        } catch (err) {
          console.error("Token hết hạn hoặc không hợp lệ, đăng xuất:", err);
          logout();
        }
      } else {
        localStorage.removeItem("accessToken");
      }
      setLoading(false);
    };
    fetchUser();
  }, [token, api, logout]);

  // === Các hàm (Actions) ===

  const login = async (loginId, password) => {
    try {
      // Backend mong đợi: req.body = { loginId, password }
      const res = await api.post("/auth/login", { loginId, password });
      setToken(res.data.token);
    } catch (err) {
      console.error("Lỗi đăng nhập:", err);
      // Lấy msg lỗi từ backend trả về
      const msg = err.response?.data?.msg || "Đăng nhập thất bại";
      throw new Error(msg);
    }
  };

  const register = async (email, password) => {
    try {
      const res = await api.post("/auth/register", {
        email,
        password,
      });
      // Lưu token
      setToken(res.data.token); 
      return res.data;

    } catch (err) {
      console.error("Lỗi đăng ký:", err);
      const msg = err.response?.data?.msg || "Đăng ký thất bại";
      throw new Error(msg);
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
        manualSetToken, 
      }}
    >
      {!loading && children} {/* Chỉ render khi đã check xong auth */}
    </AuthContext.Provider>
  );
};
