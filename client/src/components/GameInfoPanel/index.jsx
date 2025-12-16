// components/GameInfoPanel/index.jsx
import { useNavigate } from "react-router";
import MoveBoard from "../MoveBoard";
import styles from "./GameInfoPanel.module.scss";
import clsx from "clsx";

function GameInfoPanel({
  rootNode,
  currentNode,
  onNavigate,
  showVariations = false,
  onResign,
  gameStatus,
  isSpectator = false,
  gameResult,
  myColor,
  onNewGame,
}) {
  const navigate = useNavigate();

  const getResultText = () => {
    if (!gameResult) return { title: "", sub: "" };

    const { result, reason } = gameResult;
    let title = "";
    let sub = "";

    // 1. Xác định người thắng
    let winnerColor = null;
    if (result === "1-0") winnerColor = "w";
    else if (result === "0-1") winnerColor = "b";

    // 2. Text Lý do
    const reasonTextMap = {
      checkmate: "Chiếu hết",
      resignation: "Xin thua",
      timeout: "Hết giờ",
      abandoned: "Bỏ cuộc",
      stalemate: "Hết nước đi (Stalemate)",
      repetition: "Lặp lại nước đi",
      insufficient: "Không đủ quân",
      agreement: "Thỏa thuận hòa",
    };
    const reasonStr = reasonTextMap[reason] || reason;

    // 3. Logic hiển thị Text
    if (winnerColor) {
      const winnerName = winnerColor === "w" ? "Trắng" : "Đen";
      sub = `${winnerName} thắng bởi ${reasonStr}`;

      if (isSpectator) {
        title = `${winnerName} chiến thắng!`;
      } else {
        // Nếu mình là người chơi
        if (myColor === winnerColor) {
          title = "Bạn thắng!";
        } else {
          title = "Bạn thua.";
        }
      }
    } else {
      // Hòa
      title = "Hòa";
      sub = `Bởi ${reasonStr}`;
    }

    return { title, sub };
  };

  const renderFooter = () => {
    // A. Spectator
    if (isSpectator) {
      if (gameStatus === "gameOver") {
        const { title, sub } = getResultText();
        return (
          <div className={styles.resultContainer}>
            <h3>{title}</h3>
            <p>{sub}</p>
          </div>
        );
      }
      return (
        <div className={styles.spectatorMessage}>
          <i className="fa-solid fa-eye"></i> Chế độ Khán giả
        </div>
      );
    }

    // B. Player - Game Over
    if (gameStatus === "gameOver") {
      const { title, sub } = getResultText();

      return (
        <div className={styles.endGameFooter}>
          <div className={styles.resultHeader}>
            <div
              className={clsx(styles.resultTitle, {
                [styles.win]: title.includes("thắng"),
                [styles.loss]: title.includes("thua"),
                [styles.draw]: title.includes("Hòa"),
              })}
            >
              {title}
            </div>
            <div className={styles.resultReason}>{sub}</div>
          </div>

          <div className={styles.actionButtons}>
            {/* Nút Tái đấu (Disabled) */}
            <button
              className={styles.btnRematch}
              disabled
              title="Tính năng đang phát triển"
            >
              <i className="fa-solid fa-rotate-left"></i> Tái đấu
            </button>

            {/* Nút Game Mới */}
            <button className={styles.btnNewGame} onClick={onNewGame}>
              <i className="fa-solid fa-plus"></i> Game mới
            </button>
          </div>

          {/* Nút Phân tích (Full width dưới cùng) */}
          <button
            className={styles.btnAnalysis}
            onClick={() => {
              if (gameResult?.dbGameId) {
                navigate(`/analysis/${gameResult.dbGameId}`);
              }
            }}
            disabled={!gameResult?.dbGameId}
          >
            <i className="fa-solid fa-magnifying-glass-chart"></i> Phân tích ván
            cờ
          </button>
        </div>
      );
    }

    // C. Player - Playing
    return (
      <div className={styles.actionsFooter}>
        <button
          className={styles.btnResign}
          onClick={onResign}
          disabled={gameStatus !== "playing"}
        >
          <i className="fa-solid fa-flag"></i> Đầu hàng
        </button>
        <button className={styles.btnDraw} disabled={gameStatus !== "playing"}>
          <i className="fa-solid fa-handshake"></i> Cầu hòa
        </button>
      </div>
    );
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.moveListContainer}>
        <MoveBoard
          rootNode={rootNode}
          currentNode={currentNode}
          onNavigate={onNavigate}
          showVariations={showVariations}
        />
      </div>
      <div className={styles.footer}>{renderFooter()}</div>
    </div>
  );
}

export default GameInfoPanel;
