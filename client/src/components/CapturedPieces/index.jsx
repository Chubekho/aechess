import clsx from "clsx";
import styles from "./CapturedPieces.module.scss";

// Map ký tự sang FontAwesome icon
const PIECE_ICON_MAP = {
  p: "fa-solid fa-chess-pawn",
  n: "fa-solid fa-chess-knight",
  b: "fa-solid fa-chess-bishop",
  r: "fa-solid fa-chess-rook",
  q: "fa-solid fa-chess-queen",
};

/**
 * @param {Array} captured - Mảng các quân bị ăn (vd: ['p', 'n'])
 * @param {String} advantage - Điểm lợi thế (vd: '+3')
 * @param {String} pieceColor - Màu của quân bị ăn ('white' | 'black')
 */
function CapturedPieces({
  captured = [],
  advantage = null,
  pieceColor = "white",
}) {
  if (!captured || captured.length === 0) {
    // Nếu không có quân bị ăn nhưng có điểm lợi thế (trường hợp hiếm hoặc khi bắt đầu ăn điểm)
    if (!advantage) return <div className={styles.container} />;
  }

  return (
    <div className={styles.container}>
      {captured.map((piece, index) => (
        <i
          key={index}
          className={clsx(PIECE_ICON_MAP[piece], styles.piece, {
            [styles.pieceWhite]: pieceColor === "white",
            [styles.pieceBlack]: pieceColor === "black",
          })}
        ></i>
      ))}

      {advantage && <span className={styles.score}>{advantage}</span>}
    </div>
  );
}

export default CapturedPieces;
