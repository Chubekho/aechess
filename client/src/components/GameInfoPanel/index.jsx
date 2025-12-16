// components/GameInfoPanel/index.jsx
import { useNavigate } from "react-router";
import { useSocket } from "@/context/SocketContext";
import { useEffect, useState } from "react";
import clsx from "clsx";

import MoveBoard from "../MoveBoard";
import styles from "./GameInfoPanel.module.scss";

function GameInfoPanel({
  gameId,
  rootNode,
  currentNode,
  onNavigate,
  showVariations = false,
  gameStatus,
  isSpectator = false,
  gameResult,
  myColor,
  onNewGame,
}) {
  const socket = useSocket();
  const navigate = useNavigate();

  const [showResignConfirm, setShowResignConfirm] = useState(false);
  const [drawStatus, setDrawStatus] = useState("idle");

  // --- SOCKET LISTENERS ---
  useEffect(() => {
    if (!socket) return;

    // 1. Nhận lời mời hòa từ đối thủ
    const onDrawOffered = () => {
      setDrawStatus("offered_to_me");
    };

    // 2. Đối thủ từ chối lời mời của mình
    const onDrawDeclined = () => {
      setDrawStatus("idle");
      alert("Đối thủ đã từ chối lời cầu hòa."); // Có thể thay bằng Toast
    };

    socket.on("drawOffered", onDrawOffered);
    socket.on("drawDeclined", onDrawDeclined);

    return () => {
      socket.off("drawOffered", onDrawOffered);
      socket.off("drawDeclined", onDrawDeclined);
    };
  }, [socket]);

  // --- HANDLERS: ĐẦU HÀNG ---
  const handleResignClick = () => {
    setShowResignConfirm(true);
  };

  const handleConfirmResign = () => {
    if (socket && gameId) {
      socket.emit("resign", { gameId });
      setShowResignConfirm(false);
    }
  };

  const handleCancelResign = () => {
    setShowResignConfirm(false);
  };

  // --- HANDLERS: CẦU HÒA ---
  const handleOfferDraw = () => {
    if (socket && gameId) {
      socket.emit("offerDraw", { gameId });
      setDrawStatus("offered_by_me");
    }
  };

  const handleAcceptDraw = () => {
    if (socket && gameId) {
      socket.emit("acceptDraw", { gameId });
      setDrawStatus("idle");
    }
  };

  const handleDeclineDraw = () => {
    if (socket && gameId) {
      socket.emit("declineDraw", { gameId });
      setDrawStatus("idle");
    }
  };

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
        {/* NÚT ĐẦU HÀNG CÓ XÁC NHẬN */}
        <div className={styles.resignWrapper}>
          {!showResignConfirm ? (
            <button
              className={styles.btnResign}
              onClick={handleResignClick}
              disabled={gameStatus !== "playing"}
            >
              <i className="fa-solid fa-flag"></i> Đầu hàng
            </button>
          ) : (
            <div className={styles.confirmDropdown}>
              <span>Thua?</span>
              <button className={styles.btnYes} onClick={handleConfirmResign}>
                Có
              </button>
              <button className={styles.btnNo} onClick={handleCancelResign}>
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
