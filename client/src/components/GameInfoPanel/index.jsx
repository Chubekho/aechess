// components/GameInfoPanel/index.jsx
import MoveBoard from "../MoveBoard"; // Tái sử dụng
import styles from "./GameInfoPanel.module.scss";

function GameInfoPanel({ moveHistory, lastMove, onResign }) {
  return (
    <div className={styles.wrapper}>
      {/* Tab (Chat, Lịch sử,...) - (Có thể thêm sau) */}
      <div className={styles.tabs}>
        <button className={styles.tabActive}>Lịch sử</button>
        <button>Chat</button>
      </div>

      {/* Lịch sử nước đi */}
      <div className={styles.moveListContainer}>
        <MoveBoard history={moveHistory} lastMove={lastMove} />
      </div>
      
      {/* Nút điều khiển */}
      <div className={styles.controls}>
        <button onClick={onResign}>Đầu hàng</button>
        <button>Cầu hòa</button>
      </div>
    </div>
  );
}
export default GameInfoPanel;