// components/MoveBoard/index.jsx
import { useEffect, useRef } from "react";
import clsx from "clsx";
import styles from "./MoveBoard.module.scss";

const MoveNavigator = ({ onNavigate }) => {
  return (
    <div className={styles.navigator}>
      <button onClick={() => onNavigate("start")} aria-label="First move">
        <i className="fa-solid fa-backward-fast"></i>
      </button>
      <button onClick={() => onNavigate("back")} aria-label="Previous move">
        <i className="fa-solid fa-backward-step"></i>
      </button>
      <button onClick={() => onNavigate("next")} aria-label="Next move">
        <i className="fa-solid fa-forward-step"></i>
      </button>
      <button onClick={() => onNavigate("end")} aria-label="Last move">
        <i className="fa-solid fa-forward-fast"></i>
      </button>
      <button aria-label="Options">
        <i className="fa-solid fa-bars"></i>
      </button>
    </div>
  );
};

function MoveBoard({
  history = [],
  lastMove = null,
  gameStatus = "playing",
  onNavigate,
  currentMoveIndex = 0,
}) {
  const scrollRef = useRef(null);
  const moveRefs = useRef({});

  // Xử lý phím mũi tên
  useEffect(() => {
    if (!onNavigate) return;
    const handleKeyDown = (e) => {
      if (
        document.activeElement.tagName === "INPUT" ||
        document.activeElement.tagName === "TEXTAREA"
      ) {
        return;
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        onNavigate("back");
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        onNavigate("next");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onNavigate]);

  // Tính toán mảng 'pairs'
  const pairs = [];
  for (let i = 0; i < history.length; i += 2) {
    pairs.push({
      moveNumber: i / 2 + 1,
      white: history[i],
      black: history[i + 1] || "",
    });
  }

  // Xử lý cuộn (scroll)
  useEffect(() => {
    // 1. Nếu đang chơi (hoặc tua về cuối) -> cuộn xuống dưới cùng
    if (gameStatus === "playing" || currentMoveIndex === history.length) {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }
    // 2. Nếu đang tua -> cuộn đến nước đi được chọn
    else if (moveRefs.current[currentMoveIndex]) {
      moveRefs.current[currentMoveIndex].scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [history, gameStatus, currentMoveIndex]);

  // Helper tính index (cho onClick)
  const getMoveIndex = (pairIndex, isWhite) => {
    return isWhite ? pairIndex * 2 + 1 : pairIndex * 2 + 2;
  };

  return (
    <div className={styles.moveBoardWrapper}>
      <MoveNavigator onNavigate={onNavigate} />

      <div className={styles.moveList} ref={scrollRef}>
        {pairs.map((pair, index) => {
          const whiteMoveIndex = getMoveIndex(index, true);
          const blackMoveIndex = getMoveIndex(index, false);

          const isWhiteSelected = currentMoveIndex === whiteMoveIndex;
          const isBlackSelected = currentMoveIndex === blackMoveIndex;

          return (
            <div key={pair.moveNumber} className={styles.movePair}>
              <span className={styles.moveNumber}>{pair.moveNumber}.</span>
              <span
                ref={(el) => (moveRefs.current[whiteMoveIndex] = el)}
                className={clsx(styles.moveWhite, {
                  [styles.selectedMove]: isWhiteSelected,
                  // Chỉ highlight 'lastMove' khi đang ở cuối
                  [styles.lastMove]:
                    currentMoveIndex === history.length &&
                    pair.white === lastMove,
                })}
                onClick={() => onNavigate("select", whiteMoveIndex)}
              >
                {pair.white}
              </span>
              <span
                ref={(el) => (moveRefs.current[blackMoveIndex] = el)}
                className={clsx(styles.moveBlack, {
                  [styles.selectedMove]: isBlackSelected,
                  [styles.lastMove]:
                    currentMoveIndex === history.length &&
                    pair.black === lastMove,
                })}
                onClick={() => onNavigate("select", blackMoveIndex)}
              >
                {pair.black}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default MoveBoard;
