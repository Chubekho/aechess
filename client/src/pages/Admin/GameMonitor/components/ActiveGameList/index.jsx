// client/src/pages/Admin/GameMonitor/ActiveGameList/index.jsx
import React from 'react';
import styles from './ActiveGameList.module.scss';
import { format } from 'date-fns';

const ActiveGameList = ({ games, onAbort }) => {
    const activeGames = games.games;
    
  if (!activeGames || activeGames.length === 0) {
    return <p className={styles.noGames}>No active games at the moment.</p>;
  }

  return (
    <div className={styles.tableContainer}>
      <table className={styles.gameTable}>
        <thead>
          <tr>
            <th>Players</th>
            <th>Time Control</th>
            <th>Started At</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {activeGames.map((game) => (
            <tr key={game._id}>
              <td>
                <div className={styles.playerInfo}>
                  <strong>W:</strong> {game.whitePlayer.username} ({game.whiteRating})
                </div>
                <div className={styles.playerInfo}>
                  <strong>B:</strong> {game.blackPlayer.username} ({game.blackRating})
                </div>
              </td>
              <td>{game.timeControl}</td>
              <td>{format(new Date(game.createdAt), 'HH:mm:ss')}</td>
              <td>
                <span className={`${styles.badge} ${styles.badgeActive}`}>
                  Active
                </span>
              </td>
              <td>
                <button
                  onClick={() => onAbort(game._id)}
                  className={`${styles.button} ${styles.buttonAbort}`}
                >
                  Force Abort
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ActiveGameList;