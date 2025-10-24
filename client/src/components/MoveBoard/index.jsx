import { useEffect, useMemo, useRef } from "react";
import clsx from "clsx";
import styles from "./MoveBoard.module.scss";

function MoveBoard({ history = [], lastMove = null }) {
  const scrollRef = useRef(null);

  // Chuyển đổi mảng lịch sử (['e4', 'e5']) thành cặp ({w: 'e4', b: 'e5'})
  // Logic này được chuyển từ PlayAI sang đây
  const pairedMoves = useMemo(() => {
    const pairs = [];
    for (let i = 0; i < history.length; i += 2) {
      pairs.push({
        moveNumber: i / 2 + 1,
        white: history[i],
        black: history[i + 1] || "", // Nếu nước Đen chưa có thì là chuỗi rỗng
      });
    }
    return pairs;
  }, [history]); // Phụ thuộc vào prop 'history'

  useEffect(() => {
    if (scrollRef.current) {
      // Tự động cuộn xuống dưới cùng
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]); // Phụ thuộc vào 'history'

  return (
    <div className={styles.moveList} ref={scrollRef}>
      {pairedMoves.map((pair) => (
        <div key={pair.moveNumber} className={styles.movePair}>
          <span className={styles.moveNumber}>{pair.moveNumber}.</span>

          <span
            className={clsx(styles.moveWhite, {
              [styles.lastMove]: pair.white === lastMove,
            })}
          >
            {pair.white}
          </span>

          <span
            className={clsx(styles.moveBlack, {
              [styles.lastMove]: pair.black === lastMove,
            })}
          >
            {pair.black}
          </span>
        </div>
      ))}
    </div>
  );
}

export default MoveBoard;