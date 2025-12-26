//client/src/context/SocketProvider.jsx
import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "@/hooks/index";
import { useToast } from "@/hooks/index";

import { SocketContext } from "./SocketContext";

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { user, token, logout } = useAuth();
  const toast = useToast();

  useEffect(() => {
    // Only connect if the user is logged in
    if (user) {
      // Connect to the server
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8080";
      const socketUrl = apiUrl.replace(/\/api\/?$/, "");

      const newSocket = io(socketUrl, {
        query: {
          token: token,
        },
      });

      newSocket.on("connect", () => {
        console.log("Socket.IO connected!");
      });

      newSocket.on("disconnect", () => {
        console.log("Socket.IO disconnected.");
      });

      newSocket.on("connect_error", (err) => {
        console.error("Socket connection error:", err.message);
        if (err.message === "Account is banned") {
          toast.error("Your account has been banned and you have been logged out.");
          logout();
          newSocket.disconnect();
        }
      });

      setSocket(newSocket);

      // Cleanup
      return () => {
        newSocket.disconnect();
      };
    } else {
      // If logged out, disconnect the socket if it exists
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, token]);

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
};