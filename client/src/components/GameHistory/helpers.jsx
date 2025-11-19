// client/src/components/GameHistory/helpers.js
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import clsx from "clsx";
import styles from "./GameHistory.module.scss";

// 1. Component TimeControlIcon
export const TimeControlIcon = ({ timeControl }) => {
  let icon = "fa-regular fa-clock"; // Rapid (mặc định)
  
  // Logic chuẩn hơn để bắt "1+0", "3+2", "10+0"
  if (timeControl) {
    const baseTime = parseInt(timeControl.split('+')[0], 10);
    if (baseTime < 3) icon = "fa-solid fa-rocket";  // Bullet (dưới 3 phút)
    else if (baseTime < 10) icon = "fa-solid fa-bolt"; // Blitz (từ 3-9 phút)
    else if (baseTime < 30) icon = "fa-regular fa-clock"; // Rapid (từ 10-29 phút)
    else icon = "fa-solid fa-hourglass-half"; // Classical
  }

  return <i className={clsx(icon, styles.timeIcon)}></i>;
};

// 2. Hàm Format Ngày
// eslint-disable-next-line react-refresh/only-export-components
export const formatDate = (dateString) => {
  // 'd MMM, yyyy' -> '11 thg 11, 2025'
  return format(new Date(dateString), "d MMM, yyyy", { locale: vi });
};