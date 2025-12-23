//client/src/components/PlayerInfoBox/index.jsx
import styles from "./PlayerInfoBox.module.scss";
import clsx from "clsx";
import { formatTimeControl } from "@/utils/chessUtils";
import CapturedPieces from "@/components/CapturedPieces";

function PlayerInfoBox({
  player,
  timeControl,
  variant = "bottom",
  side = "white",
  material = null,
  isTurn = false,
  ratingDiff = null,
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

  const capturedPieceColor = side === "white" ? "black" : "white";

  // Render khối thông tin (Avatar + Tên + Rating)
  const InfoBlock = () => (
    <div className={styles.info}>
      <div className={avatarClass}>
        <i className="fa-solid fa-user"></i>
      </div>
      <div className={styles.textDetails}>
        <div className={styles.nameRow}>
          <span className={styles.name}>{name}</span>
          <span className={styles.rating}>{rating}</span>
          {ratingDiff !== null && (
            <span
              className={clsx(styles.ratingChange, {
                [styles.diffPositive]: ratingDiff > 0,
                [styles.diffNegative]: ratingDiff < 0,
                [styles.diffZero]: ratingDiff === 0,
              })}
            >
              {ratingDiff > 0 ? "+" : ""}
              {ratingDiff}
            </span>
          )}
        </div>
      </div>
    </div>
  );

  // Render đồng hồ (Chỉ hiển thị text Time Control)
  const ClockBlock = () => (
    <div
      className={clsx(styles.clock, {
        [styles.clockActive]: isTurn, // [MỚI] Active class
        [styles.lowTime]: typeof timeControl === "number" && timeControl < 20,
      })}
    >
      {formattedTime}
    </div>
  );

  const CapturedBlock = () => (
    <div style={{ marginTop: "10px", marginBottom: "10px" }}>
      <CapturedPieces
        captured={material?.captured}
        advantage={material?.advantage}
        pieceColor={capturedPieceColor}
      />
    </div>
  );

  return (
    <div className={clsx(styles.wrapper, styles[variant])}>
      {variant === "top" ? (
        <>
          <CapturedBlock />
          <InfoBlock />
          <ClockBlock />
        </>
      ) : (
        <>
          <ClockBlock />
          <InfoBlock />
          <CapturedBlock />
        </>
      )}
    </div>
  );
}

export default PlayerInfoBox;
