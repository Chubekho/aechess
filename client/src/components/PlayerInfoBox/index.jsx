//client/src/components/PlayerInfoBox/index.jsx
import styles from "./PlayerInfoBox.module.scss";
import clsx from "clsx";
import { formatTimeControl } from "@/utils/gameHelpers";

function PlayerInfoBox({
  player,
  timeControl,
  variant = "bottom",
  side = "white",
}) {
  // variant = 'top' (Cho Đen: Tên ở trên, Giờ ở dưới)
  // variant = 'bottom' (Cho Trắng: Giờ ở trên, Tên ở dưới)

  const name = player?.name || player?.displayName || "Unknown"; 
  const rating = player?.rating ? `(${player.rating})` : "";

  const formattedTime = formatTimeControl(timeControl);

  const avatarClass = clsx(styles.avatar, {
    [styles.avatarBlack]: side === "black",
    [styles.avatarWhite]: side === "white",
  });

  // Render khối thông tin (Avatar + Tên + Rating)
  const InfoBlock = () => (
    <div className={styles.info}>
      <div className={avatarClass}>
        <i className="fa-solid fa-user"></i>
      </div>
      <div className={styles.textDetails}>
        <span className={styles.name}>{name}</span>
        <span className={styles.rating}>{rating}</span>
      </div>
    </div>
  );

  // Render đồng hồ (Chỉ hiển thị text Time Control)
  const ClockBlock = () => (
    <div className={styles.clock}>{formattedTime}</div>
  );

  return (
    <div className={clsx(styles.wrapper, styles[variant])}>
      {variant === "top" ? (
        <>
          <InfoBlock />
          <ClockBlock />
        </>
      ) : (
        <>
          <ClockBlock />
          <InfoBlock />
        </>
      )}
    </div>
  );
}

export default PlayerInfoBox;
