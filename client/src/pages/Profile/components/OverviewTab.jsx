// client/src/pages/Profile/components/OverviewTab.jsx

import GameHistory from "@/components/GameHistory";
import styles from "../Profile.module.scss"; // Import ngược styles từ cha
import StatsChart from "./StatsChart";

function OverviewTab({ user }) {
  return (
    <div className={styles.tabContent}>
      {/* Hàng 1: Các chỉ số Rating */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <i className="fa-solid fa-bolt" style={{ color: "#ffce47" }}></i>{" "}
            Blitz
          </div>
          <div className={styles.statValue}>{user.ratings?.blitz || 1200}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <i className="fa-solid fa-rocket" style={{ color: "#a7d8de" }}></i>{" "}
            Bullet
          </div>
          <div className={styles.statValue}>{user.ratings?.bullet || 1200}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <i
              className="fa-solid fa-stopwatch"
              style={{ color: "#769656" }}
            ></i>{" "}
            Rapid
          </div>
          <div className={styles.statValue}>{user.ratings?.rapid || 1200}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <i
              className="fa-solid fa-puzzle-piece"
              style={{ color: "#d64f00" }}
            ></i>{" "}
            Puzzle
          </div>
          <div className={styles.statValue}>
            {Math.floor(user.puzzleStats?.rating) || 1500}
          </div>
        </div>
      </div>

      {/* --- Hàng 2 (MỚI): Biểu đồ thống kê --- */}
      <StatsChart user={user} />

      {/* Hàng 2: Lịch sử đấu */}
      <div className={styles.sectionBlock}>
        <h3>Các ván đấu gần đây</h3>
        <GameHistory limit={50} userId={user._id} />
      </div>
    </div>
  );
}

export default OverviewTab;
