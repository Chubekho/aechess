import clsx from "clsx";
import styles from "./EvaluationBar.module.scss";

function EvaluationBar({ evaluation }) {
  // evaluation = { type: 'cp' | 'mate', value: number }
  
  let percent = 50; // Mặc định cân bằng (50%)
  let text = "0.0";

  if (evaluation) {
    // 1. Xử lý trường hợp Chiếu hết (Mate)
    if (evaluation.type === "mate") {
      if (evaluation.value > 0) {
        percent = 100; // Trắng thắng
        text = `M${evaluation.value}`;
      } else {
        percent = 0; // Đen thắng
        text = `M${Math.abs(evaluation.value)}`;
      }
    } 
    // 2. Xử lý điểm số (Centipawn)
    else {
      // Giới hạn điểm số trong khoảng -500 đến +500 (tương đương -5 đến +5 điểm)
      // Để thanh bar không bị "đơ" ở các mức điểm quá cao
      const cappedScore = Math.max(Math.min(evaluation.value, 500), -500);
      
      // Công thức chuyển đổi score thành phần trăm chiều cao (50% + score/10)
      percent = 50 + (cappedScore / 10);
      
      // Hiển thị text (ví dụ: +1.53)
      text = (evaluation.value / 100).toFixed(2);
      if (evaluation.value > 0) text = "+" + text;
    }
  }

  // Đảo ngược màu text tùy vào nền
  const isTextBlack = percent > 50;

  return (
    <div className={styles.barContainer}>
      <div 
        className={styles.whiteBar} 
        style={{ height: `${percent}%` }}
      >
      </div>
      <span className={clsx(styles.scoreText, { [styles.darkText]: isTextBlack })}>
        {text}
      </span>
    </div>
  );
}

export default EvaluationBar;