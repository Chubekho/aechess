import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "@/hooks/index"; // Dùng để xác thực (nếu cần)

import { SocketContext } from "./SocketContext";

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { user } = useAuth(); // Lấy user từ AuthContext

  useEffect(() => {
    // Chỉ kết nối socket nếu user đã đăng nhập
    if (user) {
      // Kết nối tới server
      // Bạn có thể gửi 'token' để xác thực socket
      // const newSocket = io("http://localhost:8080", {
      //   query: { token: token } 
      // });
      
      const newSocket = io("http://localhost:8080");
      
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
  }, [user]); // Chạy lại khi 'user' thay đổi

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};