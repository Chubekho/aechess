import clsx from "clsx";
import styles from "./EngineOutput.module.scss";

function EngineOutput({ lines, isEngineReady }) {
  if (!isEngineReady) {
    return <div className={styles.loading}>Đang khởi động Engine...</div>;
  }

  if (lines.length === 0) {
    return <div className={styles.loading}>Đang tính toán...</div>;
  }

  return (
    <div className={styles.wrapper}>
      <table className={styles.table}>
        
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
                <td className={clsx(styles.score, { 
                  [styles.positive]: line.score > 0 || line.mate > 0,
                  [styles.negative]: line.score < 0 || line.mate < 0
                })}>
                  {scoreText}
                </td>
                <td className={styles.bestMove}>
                  {/* Hiển thị bestMove.from + bestMove.to (tạm thời) */}
                  {/* Thực tế nên dùng chess.js để convert sang SAN (e.g. "Nf3") nhưng phức tạp */}
                  {line.bestMove ? `${line.bestMove.from}${line.bestMove.to}` : "..."}
                </td>
                <td className={styles.pv}>
                  {line.pv}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default EngineOutput;