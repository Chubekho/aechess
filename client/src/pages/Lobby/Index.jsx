// client/src/pages/Lobby/index.jsx
import { useSocket } from "@/context/SocketContext";
import { useNavigate } from "react-router";
import { useEffect, useState } from "react";
// import styles from "./Lobby.module.scss";

function Lobby() {
  const socket = useSocket();
  const navigate = useNavigate();
  const [isSearching, setIsSearching] = useState(null); // Lưu trữ kiểu timeControl

  // Lắng nghe server báo "Trận đã tìm thấy"
  useEffect(() => {
    if (!socket) return;
    
    const onMatchFound = (data) => {
      console.log("Đã tìm thấy trận!", data.gameId);
      setIsSearching(null); // Dừng tìm kiếm
      navigate(`/game/${data.gameId}`); // Tự động chuyển đến trang game
    };

    socket.on("matchFound", onMatchFound);
    return () => {
      socket.off("matchFound", onMatchFound);
    };
  }, [socket, navigate]);

  const handleFindMatch = (timeControl) => {
    if (!socket) return alert("Chưa kết nối server!");
    
    console.log(`Tìm trận ${timeControl}...`);
    setIsSearching(timeControl);
    // Gửi event, kèm config (giả sử tất cả là xếp hạng)
    socket.emit("findMatch", { 
      timeControl: timeControl,
      isRated: true
    });
  };

  const handleCancelSearch = () => {
    if (!socket) return;
    socket.emit("cancelFindMatch");
    setIsSearching(null);
  };

  if (isSearching) {
    return (
      <div>
        <h2>Đang tìm trận {isSearching}...</h2>
        <button onClick={handleCancelSearch}>Hủy</button>
      </div>
    );
  }

  return (
    <div>
      <h2>Chọn thời gian (Pools):</h2>
      {/* (Đây là giao diện Lichess bạn đã gửi) */}
      <button onClick={() => handleFindMatch("10+0")}>10 min</button>
      <button onClick={() => handleFindMatch("5+3")}>5 | 3</button>
      <button onClick={() => handleFindMatch("3+2")}>3 | 2</button>
    </div>
  );
}
export default Lobby;