import { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";

import { AuthContext } from "./AuthContext";

// 2. Create Provider (Wrapper Component)
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(
    () => localStorage.getItem("accessToken") || null
  );
  const [loading, setLoading] = useState(true);

  // Configure axios to send token with each request
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

  // This logic runs again whenever 'token' or 'api' changes
  useEffect(() => {
    const interceptor = api.interceptors.request.use((config) => {
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Cleanup function: remove old interceptor when token changes
    return () => {
      api.interceptors.request.eject(interceptor);
    };
  }, [api, token]);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("accessToken");
  }, [setToken, setUser]);

  // useEffect to automatically fetch user info when a token exists
  useEffect(() => {
    const fetchUser = async () => {
      if (token) {
        try {
          localStorage.setItem("accessToken", token);
          const res = await api.get("/auth/me");
          setUser(res.data);
        } catch (err) {
          console.error("Token expired or invalid, logging out:", err);
          logout();
        }
      } else {
        localStorage.removeItem("accessToken");
      }
      setLoading(false);
    };
    fetchUser();
  }, [token, api, logout]);

  // === Actions ===

  const login = async (loginId, password) => {
    try {
      // Backend expects: req.body = { loginId, password }
      const res = await api.post("/auth/login", { loginId, password });
      setToken(res.data.token);
    } catch (err) {
      console.error("Login error:", err);
      // Get error message from backend response
      const msg = err.response?.data?.msg || "Login failed";
      throw new Error(msg);
    }
  };

  const register = async (email, password) => {
    try {
      const res = await api.post("/auth/register", {
        email,
        password,
      });
      // Save token
      setToken(res.data.token); 
      return res.data;

    } catch (err)
      {
      console.error("Registration error:", err);
      const msg = err.response?.data?.msg || "Registration failed";
      throw new Error(msg);
    }
  };

  // NEW: This function is for AuthCallback.jsx
  const manualSetToken = (newToken) => {
    if (newToken) {
      setToken(newToken); // Triggers useEffect to fetch user
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser, // Expose setUser to consumers
        token,
        login,
        register,
        logout,
        loading,
        manualSetToken, 
      }}
    >
      {!loading && children} {/* Only render children after auth check is complete */}
    </AuthContext.Provider>
  );
};