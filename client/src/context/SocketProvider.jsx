//client/src/context/SocketProvider.jsx
import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "@/hooks/index"; // Dùng để xác thực (nếu cần)

import { SocketContext } from "./SocketContext";

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { user, token } = useAuth(); // Lấy user từ AuthContext

  useEffect(() => {
    // Chỉ kết nối socket nếu user đã đăng nhập
    if (user) {
      // Kết nối tới server
      const newSocket = io("http://localhost:8080", { // (Hoặc IP nội bộ)
        query: {
          token: token 
        }
      });
      
      newSocket.on("connect", () => {
        console.log("Đã kết nối Socket.IO!");
      });

      newSocket.on("disconnect", () => {
        console.log("Đã ngắt kết nối Socket.IO.");
      });

      setSocket(newSocket);

      // Dọn dẹp
      return () => {
        newSocket.disconnect();
      };
    } else {
      // Nếu logout, ngắt kết nối (nếu có)
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
    }
  }, [user, token]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};