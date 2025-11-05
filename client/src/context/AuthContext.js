// src/context/AuthContext.js
import { createContext, useContext } from "react";

// 1. Tạo và export Context
export const AuthContext = createContext();

// 2. Tạo và export hook useAuth
export const useAuth = () => {
  return useContext(AuthContext);
};