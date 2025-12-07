import styles from "./PlayerInfoBox.module.scss";
import clsx from "clsx";

function PlayerInfoBox({ player, timeControl, variant = "bottom" }) {
  // variant = 'top' (Cho Đen: Tên ở trên, Giờ ở dưới)
  // variant = 'bottom' (Cho Trắng: Giờ ở trên, Tên ở dưới)

  const name = player?.name || "Unknown"; // Sửa lại key cho phù hợp với pgnHeaders
  const rating = player?.rating ? `(${player.rating})` : "";

  // Render khối thông tin (Avatar + Tên + Rating)
  const InfoBlock = () => (
    <div className={styles.info}>
      <div className={styles.avatar}>
        {/* Placeholder Avatar */}
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
    <div className={styles.clock}>
      {timeControl || "00:00"}
    </div>
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