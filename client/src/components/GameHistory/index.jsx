// client/src/components/GameHistory/index.jsx
import { useState, useEffect } from "react";
import { Link } from "react-router";
import axiosClient from "@/utils/axiosConfig";
import clsx from "clsx";
import styles from "./GameHistory.module.scss";
import { TimeControlIcon, formatDate } from "./helpers.jsx";

const PlayerInfo = ({ player, rating, color }) => {
  const hasProfile = player && player.username && player.username !== "undefined";
  const displayName = player?.username || "Anonymous";

  return (
    <div className={styles.player}>
      <span className={clsx(styles.colorIcon, styles[color])}></span>
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

function GameHistory({ limit = 10, userId }) {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchHistory = async () => {
      setLoading(true);
      try {
        const res = await axiosClient.get(
          `/games/history?limit=${limit}&userId=${userId}`
        );
        
        if (Array.isArray(res)) {
          setGames(res);
        }
      } catch (err) {
        console.error("Error fetching game history:", err);
        setGames([]); // Reset to empty array on error
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [limit, userId]);

  if (loading) return <div className={styles.loading}>Loading game history...</div>;

  return (
    <div className={styles.wrapper}>
      <h2 className={styles.title}>Game History</h2>
      <table className={styles.table}>
        <thead>
          <tr>
            <th />
            <th>Players</th>
            <th>Result</th>
            <th>Moves</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {(!games || games.length === 0) ? (
            <tr>
              <td colSpan="5" className={styles.noGames}>
                No games found.
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
                <td className={styles.players}>
                  <div className={styles.playerNames}>
                    <PlayerInfo 
                      player={game.whitePlayer} 
                      rating={game.whiteRating} 
                      color="white" 
                    />
                    <PlayerInfo 
                      player={game.blackPlayer} 
                      rating={game.blackRating} 
                      color="black" 
                    />
                  </div>
                </td>
                <td className={styles.result}>
                  <div className={styles.resultContent}>
                    {game.result === "1-0" && <strong>1 - 0</strong>}
                    {game.result === "0-1" && <strong>0 - 1</strong>}
                    {game.result === "1/2-1/2" && <span>½ - ½</span>}
                    <Link
                      to={`/analysis/${game._id}`}
                      className={styles.analysisButton}
                      title="Analyze game"
                    >
                      <i className="fa-solid fa-magnifying-glass-chart"></i>
                    </Link>
                  </div>
                </td>
                <td className={styles.moves}>{game.moveCount || 0}</td>
                <td className={styles.date}>{formatDate(game.createdAt)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default GameHistory;