// components/GameInfoPanel/index.jsx
import MoveBoard from "../MoveBoard";
import styles from "./GameInfoPanel.module.scss";

function GameInfoPanel({
  moveHistory,
  lastMove,
  onResign,
  gameStatus,
  onNavigate,
  currentMoveIndex,
}) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.tabs}>
        <button className={styles.tabActive}>Lịch sử</button>
        <button>Chat</button>
      </div>

      <div className={styles.moveListContainer}>
        <MoveBoard
          history={moveHistory}
          lastMove={lastMove}
          gameStatus={gameStatus}
          onNavigate={onNavigate}
          currentMoveIndex={currentMoveIndex}
        />
      </div>

      <div className={styles.controls}>
        <button onClick={onResign} disabled={gameStatus === "gameOver"}>
          Đầu hàng
        </button>
        <button disabled={gameStatus === "gameOver"}>Cầu hòa</button>
      </div>
    </div>
  );
}

export default GameInfoPanel;