import { useState } from "react";
import { useNavigate } from "react-router";
import { Chess } from "chess.js";
import styles from "./Import.module.scss"; // Bạn tự tạo CSS nhé (padding, textarea width 100%...)

function ImportPage() {
  const [pgn, setPgn] = useState("");
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleAnalyze = () => {
    // 1. Reset lỗi cũ
    setError(null);
    const trimmedPgn = pgn.trim();

    // 2. Kiểm tra rỗng
    if (!trimmedPgn) {
      setError("Vui lòng nhập chuỗi PGN.");
      return;
    }

    // 3. Kiểm tra tính hợp lệ bằng chess.js
    const tempGame = new Chess();
    try {
      // Cố gắng load PGN
      tempGame.loadPgn(trimmedPgn);

      // Kiểm tra xem có nước đi nào không (tùy chọn, nhưng nên có)
      // Nếu PGN chỉ toàn header mà không có move, chess.js vẫn load được nhưng history rỗng.
      // Bạn có thể cho phép hoặc chặn tùy ý. Ở đây ta cho phép nhưng cảnh báo nhẹ nếu muốn.
      /* if (tempGame.history().length === 0) {
         setError("PGN hợp lệ nhưng không chứa nước đi nào.");
         return;
      }
      */
    } catch (e) {
      // Nếu chess.js không đọc được -> PGN sai
      console.error("PGN Error:", e);
      setError("Định dạng PGN không hợp lệ. Vui lòng kiểm tra lại.");
      return;
    }

    // 4. Nếu mọi thứ OK -> Chuyển trang
    navigate("/analysis", { state: { pgnInput: trimmedPgn } });
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.container}>
        <h2 className={styles.title}>Nhập PGN</h2>
        <p className={styles.description}>
          Dán biên bản ván đấu (PGN) vào đây để phân tích.
        </p>

        <textarea
          rows="10"
          value={pgn}
          onChange={(e) => setPgn(e.target.value)}
          placeholder='[Event "Casual Game"] ... 1. e4 e5 ...'
          className={styles.textarea}
        />
        {error && <p className={styles.errorText}>{error}</p>}
        <button onClick={handleAnalyze} className={styles.buttonAnalyze}>
          Phân tích
        </button>
      </div>
    </div>
  );
}

export default ImportPage;
