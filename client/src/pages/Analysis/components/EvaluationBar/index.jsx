import clsx from "clsx";
import styles from "./EvaluationBar.module.scss";

function EvaluationBar({ evaluation, gameResult }) {
  let percent = 50; 
  let text = "0.0";

  // 1. ƯU TIÊN: Kiểm tra Game Over trước
  if (gameResult?.isGameOver) {
    if (gameResult.type === 'checkmate') {
      if (gameResult.winner === 'w') {
        percent = 100; // Trắng thắng
        text = "1-0";
      } else {
        percent = 0;   // Đen thắng
        text = "0-1";
      }
    } else {
      // Hòa
      percent = 50;
      text = "½-½";
    }
  }

  // 2. Nếu Game chưa kết thúc, dùng data từ Stockfish
  if (evaluation) {
    const { type, value } = evaluation;
    // === 1. XỬ LÝ CHIẾU HẾT (MATE) ===
    if (type === "mate") {
      // value > 0: Trắng thắng (Mate +N) -> Full Trắng
      if (value > 0) {
        percent = 100;
        text = `M${value}`; 
      } 
      // value < 0: Đen thắng (Mate -N) -> Full Đen
      else {
        percent = 0;
        text = `M${Math.abs(value)}`;
      }
    } 
    // === 2. XỬ LÝ ĐIỂM SỐ (CENTIPAWN) ===
    else {
      const cappedScore = Math.max(Math.min(value, 500), -500);
      percent = 50 + (cappedScore / 10);
      
      text = (Math.abs(value) / 100).toFixed(2);
      text = value >= 0 ? `+${text}` : `-${text}`;
    }
  }

  // Giới hạn và style
  percent = Math.max(0, Math.min(100, percent));
  const isTextBlack = percent > 50;

  return (
    <div className={styles.barContainer}>
      <div className={styles.whiteBar} style={{ height: `${percent}%` }}></div>
      <span className={clsx(styles.scoreText, { [styles.darkText]: isTextBlack })}>
        {text}
      </span>
    </div>
  );
}

export default EvaluationBar;