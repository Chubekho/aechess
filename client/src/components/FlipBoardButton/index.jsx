import React from "react";
import styles from "./FlipBoardButton.module.scss"; // CSS Module riêng

const FlipBoardButton = ({ onClick, className }) => {
  return (
    <button
      className={`${styles.flipBtn} ${className || ""}`}
      onClick={onClick}
      title="Xoay bàn cờ"
    >
      <i className="fa-solid fa-retweet"></i>
    </button>
  );
};

export default FlipBoardButton;