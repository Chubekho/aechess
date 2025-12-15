// client/src/components/GameHistory/index.jsx
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/index";
import { Link } from "react-router";
import axiosClient from "@/utils/axiosConfig";
import clsx from "clsx";
import styles from "./GameHistory.module.scss";

import { TimeControlIcon, formatDate } from "./helpers.jsx";

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
        // Gửi targetId vào query params
        const res = await axiosClient.get(`/games/history?limit=${limit}&userId=${targetId}`);
        setGames(res.data);
      } catch (err) {
        console.error("Lỗi lấy lịch sử đấu:", err);
      }
      setLoading(false);
    };

    fetchHistory();
  }, [token, limit, targetId]); // Thêm 'user' để fetch lại khi user thay đổi

  // if (!user) return null; // Ẩn nếu không đăng nhập
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
              <td colSpan="4" className={styles.noGames}>
                Chưa có ván đấu nào.
              </td>
            </tr>
          ) : (
            games.map((game) => (
              <tr key={game._id}>
                <td>
                  <div className={styles.timeControl}>
                    <TimeControlIcon timeControl={game.timeControl} />
                    <span>{game.timeControl}</span>
                  </div>
                </td>
                {/* 1. Các kỳ thủ */}
                <td className={styles.players}>
                  <div className={styles.playerNames}>
                    <div className={styles.player}>
                      <span
                        className={clsx(styles.colorIcon, styles.white)}
                      ></span>
                      {game.whitePlayer.displayName}
                      <span className={styles.rating}>
                        ({game.whiteRating})
                      </span>
                    </div>
                    <div className={styles.player}>
                      <span
                        className={clsx(styles.colorIcon, styles.black)}
                      ></span>
                      {game.blackPlayer.displayName}
                      <span className={styles.rating}>
                        ({game.blackRating})
                      </span>
                    </div>
                  </div>
                </td>

                {/* 2. SỬA LỖI: Bọc nội dung trong <div> */}
                <td className={styles.result}>
                  <div className={styles.resultContent}>
                    {game.result === "1-0" && <strong>1 - 0</strong>}
                    {game.result === "0-1" && <strong>0 - 1</strong>}
                    {game.result === "1/2-1/2" && <span>½ - ½</span>}
                    <Link
                      to={`/analysis/${game._id}`}
                      className={styles.analysisButton}
                    >
                      <i className="fa-solid fa-magnifying-glass-chart"></i>
                    </Link>
                  </div>
                </td>

                {/* 3. Số nước đi */}
                <td className={styles.moves}>{game.moveCount}</td>
                {/* 4. Ngày */}
                <td className={styles.date}>{formatDate(game.createdAt)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      {limit === 5 && (
        <div className={styles.viewMore}>
          <Link to={`/profile/${targetId}`}>Xem tất cả</Link>
        </div>
      )}
    </div>
  );
}

export default GameHistory;
