// components/GameInfoPanel/index.jsx
import { useNavigate } from "react-router";
import { useEffect, useState } from "react";
import clsx from "clsx";

import MoveBoard from "../MoveBoard";
import styles from "./GameInfoPanel.module.scss";

function GameInfoPanel({
  rootNode,
  currentNode,
  onNavigate,
  showVariations = false,
  gameStatus,
  isSpectator = false,
  gameResult,
  myColor,
  onNewGame,
  handleResign,
  handleOfferDraw,
  handleAcceptDraw,
  handleDeclineDraw,
  handleOfferRematch,
  handleAcceptRematch,
  handleDeclineRematch,
  drawStatus,    // 'idle', 'offered_by_me', 'offered_to_me'
  rematchStatus  // 'idle', 'offered_by_me', 'offered_to_me'
}) {
  const navigate = useNavigate();

  const [showResignConfirm, setShowResignConfirm] = useState(false);

  useEffect(() => {
     if(gameStatus === 'playing') setShowResignConfirm(false);
  }, [gameStatus]);

  // --- UI LOGIC LOCAL ---
  const onResignClick = () => setShowResignConfirm(true);
  const onConfirmResign = () => {
    handleResign(); // Gọi hàm từ props
    setShowResignConfirm(false);
  };
  const onCancelResign = () => setShowResignConfirm(false);

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
            {/* REMATCH BUTTONS */}
            <div className={styles.rematchWrapper}>
              {rematchStatus === "idle" && (
                <button
                  className={styles.btnRematch}
                  onClick={handleOfferRematch}
                >
                  <i className="fa-solid fa-rotate-left"></i> Tái đấu
                </button>
              )}

              {rematchStatus === "offered_by_me" && (
                <button
                  className={clsx(styles.btnRematch, styles.disabled)}
                  disabled
                >
                  <i className="fa-solid fa-spinner fa-spin"></i> Đã gửi...
                </button>
              )}

              {rematchStatus === "offered_to_me" && (
                <div className={styles.rematchConfirm}>
                  <span>Tái đấu?</span>
                  <button
                    className={styles.btnYes}
                    onClick={handleAcceptRematch}
                    title="Đồng ý"
                  >
                    <i className="fa-solid fa-check"></i>
                  </button>
                  <button
                    className={styles.btnNo}
                    onClick={handleDeclineRematch}
                    title="Từ chối"
                  >
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                </div>
              )}
            </div>

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
        {/* NÚT ĐẦU HÀNG CÓ XÁC NHẬN */}
        <div className={styles.resignWrapper}>
          {!showResignConfirm ? (
            <button
              className={styles.btnResign}
              onClick={onResignClick}
              disabled={gameStatus !== "playing"}
            >
              <i className="fa-solid fa-flag"></i> Đầu hàng
            </button>
          ) : (
            <div className={styles.confirmDropdown}>
              <span>Thua?</span>
              <button className={styles.btnYes} onClick={onConfirmResign}>
                Có
              </button>
              <button className={styles.btnNo} onClick={onCancelResign}>
                Không
              </button>
            </div>
          )}
        </div>

        {/* NÚT CẦU HÒA LOGIC */}
        <div className={styles.drawWrapper}>
          {drawStatus === "idle" && (
            <button
              className={styles.btnDraw}
              onClick={handleOfferDraw}
              disabled={gameStatus !== "playing"}
            >
              <i className="fa-solid fa-handshake"></i> Cầu hòa
            </button>
          )}

          {drawStatus === "offered_by_me" && (
            <button className={clsx(styles.btnDraw, styles.disabled)} disabled>
              Đã gửi...
            </button>
          )}

          {drawStatus === "offered_to_me" && (
            <div className={styles.drawConfirm}>
              <span>Hòa?</span>
              <button
                className={styles.btnYes}
                onClick={handleAcceptDraw}
                title="Đồng ý"
              >
                <i className="fa-solid fa-check"></i>
              </button>
              <button
                className={styles.btnNo}
                onClick={handleDeclineDraw}
                title="Từ chối"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
          )}
        </div>
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
