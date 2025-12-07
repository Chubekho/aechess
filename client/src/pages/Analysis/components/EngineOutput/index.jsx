import clsx from "clsx";
import styles from "./EngineOutput.module.scss";

function EngineOutput({ lines, isEngineReady, isAnalyzing, gameResult }) {
  // 1. ƯU TIÊN 1: GAME OVER
  if (gameResult?.isGameOver) {
    let message = "";

    // Logic xác định ai thắng
    if (gameResult.type === "checkmate") {
      const winnerText = gameResult.winner === "w" ? "TRẮNG" : "ĐEN";
      message = `KẾT THÚC: CHIẾU HẾT! ${winnerText} thắng.`;
    } else {
      message = `KẾT THÚC: HÒA (${gameResult.reason || "Hòa"}).`;
    }

    return (
      <div className={styles.wrapper}>
        <div className={styles.resultDisplay}>{message}</div>
      </div>
    );
  }

  // 2. ƯU TIÊN 2: ENGINE TẮT (PAUSED)
  if (!isAnalyzing) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.loading}>ENGINE ĐANG TẠM DỪNG.</div>
      </div>
    );
  }

  // 3. ƯU TIÊN 3: ĐANG TÍNH HOẶC KHỞI ĐỘNG
  if (!isEngineReady || lines.length === 0) {
    return <div className={styles.loading}>Đang tính toán...</div>;
  }

  // 4. HIỂN THỊ BẢNG PHÂN TÍCH (lines.length > 0)
  return (
    <div className={styles.wrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Eval</th>
            <th>Best Move</th>
            <th>Line (PV)</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((line) => {
            // Format điểm số
            let scoreText = "";
            if (line.mate) {
              scoreText = `M${Math.abs(line.mate)}`; // Mate in X
            } else {
              // Centipawn -> Pawn (chia 100)
              const pawnScore = (line.score / 100).toFixed(2);
              scoreText = line.score > 0 ? `+${pawnScore}` : pawnScore;
            }

            return (
              <tr key={line.id} className={styles.lineRow}>
                <td
                  className={clsx(styles.score, {
                    [styles.positive]: line.score > 0 || line.mate > 0,
                    [styles.negative]: line.score < 0 || line.mate < 0,
                  })}
                >
                  {scoreText}
                </td>
                <td className={styles.bestMove}>
                  {line.bestMove
                    ? `${line.bestMove.from}${line.bestMove.to}`
                    : "..."}
                </td>
                <td className={styles.pv}>{line.pv}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default EngineOutput;
