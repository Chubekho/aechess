// components/GameInfoPanel/index.jsx
import MoveBoard from "../MoveBoard";
import styles from "./GameInfoPanel.module.scss";

function GameInfoPanel({
  rootNode,
  currentNode,
  onNavigate,
  showVariations = false,
  onResign,
  gameStatus,
  isSpectator = false,
}) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.tabs}>
        <button className={styles.tabActive}>Lịch sử</button>
      </div>

      <div className={styles.moveListContainer}>
        <MoveBoard
          rootNode={rootNode}
          currentNode={currentNode}
          onNavigate={onNavigate}
          showVariations={showVariations}
        />
      </div>

      <div className={styles.controls}>
        {!isSpectator && (
          <>
            <button onClick={onResign} disabled={gameStatus === "gameOver"}>
              Đầu hàng
            </button>
            <button disabled={gameStatus === "gameOver"}>Cầu hòa</button>
          </>
        )}
      </div>
    </div>
  );
}

export default GameInfoPanel;
