// components/PlayerInfoBox/index.jsx
import styles from "./PlayerInfoBox.module.scss";
import clsx from "clsx";

// Hàm format thời gian (MM:SS)
const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

function PlayerInfoBox({ player, clock, isTurn }) {
  const name = player?.displayName || "Waiting for player...";
  const rating = player?.rating || 1200;

  return (
    <div className={styles.wrapper}>
      <div className={styles.info}>
        <span className={styles.name}>{name}</span>
        <span className={styles.rating}>({rating})</span>
      </div>
      <div className={clsx(styles.clock, { [styles.active]: isTurn })}>
        {formatTime(clock)}
      </div>
    </div>
  );
}
export default PlayerInfoBox;