// src/context/AuthContext.js
import { createContext, useContext } from "react";

// 1. Tạo và export Context
export const AuthContext = createContext();

// 2. Tạo và export hook useAuth
// (Bây giờ file hooks/useAuth.js của bạn là không cần thiết nữa)
export const useAuth = () => {
  return useContext(AuthContext);
};