import React from "react";
import clsx from "clsx";
import styles from "./PlayerReportCard.module.scss";

function PlayerReportCard({ stats }) {
  // stats: { accuracy, best, good, mistake, blunder, ... }
  
  if (!stats) return null;

  return (
    <div className={styles.reportContainer}>
      {/* 1. Phần hiển thị độ chính xác (Accuracy) */}
      <div className={styles.accuracyRow}>
        <span className={styles.accLabel}>Độ chính xác</span>
        <span className={clsx(styles.accValue, {
            [styles.high]: stats.accuracy >= 90,
            [styles.med]: stats.accuracy >= 70 && stats.accuracy < 90,
            [styles.low]: stats.accuracy < 70
        })}>
          {stats.accuracy}%
        </span>
      </div>

      {/* 2. Danh sách thống kê nước đi (Xếp dọc) */}
      <div className={styles.statsList}>
        {/* BEST / EXCELLENT */}
        <div className={styles.statItem}>
          <div className={styles.left}>
            <span className={styles.icon} style={{ color: '#96bc4b' }}>
              <i className="fa-solid fa-star"></i>
            </span>
            <span className={styles.label}>Tuyệt vời</span>
          </div>
          <span className={styles.value}>{stats.best}</span>
        </div>

        {/* GOOD */}
        <div className={styles.statItem}>
          <div className={styles.left}>
            <span className={styles.icon} style={{ color: '#98bf64' }}>
              <i className="fa-solid fa-thumbs-up"></i>
            </span>
            <span className={styles.label}>Tốt</span>
          </div>
          <span className={styles.value}>{stats.good}</span>
        </div>

        {/* MISTAKE */}
        <div className={styles.statItem}>
          <div className={styles.left}>
            <span className={styles.icon} style={{ color: '#f0c15c' }}>
              <i className="fa-solid fa-circle-question"></i>
            </span>
            <span className={styles.label}>Sai lầm</span>
          </div>
          <span className={styles.value}>{stats.mistake}</span>
        </div>

        {/* BLUNDER */}
        <div className={styles.statItem}>
          <div className={styles.left}>
            <span className={styles.icon} style={{ color: '#fa5c5c' }}>
              <i className="fa-solid fa-circle-xmark"></i>
            </span>
            <span className={styles.label}>Nghiêm trọng</span>
          </div>
          <span className={styles.value}>{stats.blunder}</span>
        </div>
      </div>
    </div>
  );
}

export default PlayerReportCard;