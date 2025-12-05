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
      {/* ... Render Table of Analysis Lines ... */}
      <table className={styles.table}>{/* ... Render lines ... */}</table>
    </div>
  );
}

export default EngineOutput;
