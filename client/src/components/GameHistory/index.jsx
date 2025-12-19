// client/src/components/GameHistory/index.jsx
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/index";
import { Link } from "react-router"; // hoặc 'react-router-dom'
import axiosClient from "@/utils/axiosConfig";
import clsx from "clsx";
import styles from "./GameHistory.module.scss";
import { TimeControlIcon, formatDate } from "./helpers.jsx";

// --- SUB-COMPONENT: Hiển thị thông tin 1 người chơi ---
// Giúp code gọn hơn, không bị lặp lại logic White/Black
const PlayerInfo = ({ player, rating, color }) => {
  // Kiểm tra xem user có tồn tại và có username hợp lệ không
  const hasProfile = player && player.username && player.username !== "undefined";
  const displayName = player?.username || "Anonymous"; // Hoặc hiển thị "Người chơi ẩn danh"

  return (
    <div className={styles.player}>
      <span className={clsx(styles.colorIcon, styles[color])}></span>
      
      {/* Logic: Nếu có profile thì Link, không thì hiện Text thường */}
      {hasProfile ? (
        <Link to={`/profile/${player.username}`} className={styles.playerInfoLink}>
          <h4>{displayName}</h4>
        </Link>
      ) : (
        <span className={styles.playerInfoLink} style={{ cursor: "default", textDecoration: "none" }}>
          <h4>{displayName}</h4>
        </span>
      )}
      
      <span className={styles.rating}>({rating})</span>
    </div>
  );
};

function GameHistory({ limit = 5, userId }) {
  const { token, user } = useAuth();
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);

  const targetId = userId || user?.id;

  useEffect(() => {
    if (!token || !targetId) return;

    const fetchHistory = async () => {
      setLoading(true);
      try {
        const res = await axiosClient.get(
          `/games/history?limit=${limit}&userId=${targetId}`
        );
        
        setGames(res.data);
      } catch (err) {
        console.error("Lỗi lấy lịch sử đấu:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [token, limit, targetId]);

  if (loading) return <div className={styles.loading}>Đang tải lịch sử...</div>;

  return (
    <div className={styles.wrapper}>
      <h2 className={styles.title}>Lịch sử ván đấu</h2>
      <table className={styles.table}>
        <thead>
          <tr>
            <th />
            <th>Các kỳ thủ</th>
            <th>Kết quả</th>
            <th>Nước đi</th>
            <th>Ngày</th>
          </tr>
        </thead>
        <tbody>
          {games.length === 0 ? (
            <tr>
              <td colSpan="5" className={styles.noGames}>
                Chưa có ván đấu nào.
              </td>
            </tr>
          ) : (
            games.map((game) => (
              <tr key={game._id}>
                {/* Cột 1: Time Control */}
                <td>
                  <div className={styles.timeControl}>
                    <TimeControlIcon timeControl={game.timeControl} />
                    <span>{game.timeControl}</span>
                  </div>
                </td>

                {/* Cột 2: Players (Đã tối ưu) */}
                <td className={styles.players}>
                  <div className={styles.playerNames}>
                    {/* Render White Player */}
                    <PlayerInfo 
                      player={game.whitePlayer} 
                      rating={game.whiteRating} 
                      color="white" 
                    />
                    
                    {/* Render Black Player */}
                    <PlayerInfo 
                      player={game.blackPlayer} 
                      rating={game.blackRating} 
                      color="black" 
                    />
                  </div>
                </td>

                {/* Cột 3: Kết quả */}
                <td className={styles.result}>
                  <div className={styles.resultContent}>
                    {game.result === "1-0" && <strong>1 - 0</strong>}
                    {game.result === "0-1" && <strong>0 - 1</strong>}
                    {game.result === "1/2-1/2" && <span>½ - ½</span>}
                    <Link
                      to={`/analysis/${game._id}`}
                      className={styles.analysisButton}
                      title="Phân tích ván đấu"
                    >
                      <i className="fa-solid fa-magnifying-glass-chart"></i>
                    </Link>
                  </div>
                </td>

                {/* Cột 4: Số nước đi */}
                <td className={styles.moves}>{game.moveCount}</td>
                
                {/* Cột 5: Ngày */}
                <td className={styles.date}>{formatDate(game.createdAt)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      
      {limit === 5 && (
        <div className={styles.viewMore}>
          <Link to={`/profile/${user.username}`}>Xem tất cả</Link>
        </div>
      )}
    </div>
  );
}

export default GameHistory;