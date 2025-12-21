import { useState, useEffect } from "react";
import { BOARD_THEMES, applyBoardTheme } from "@/utils/themeConfig";
import axiosClient from "@/utils/axiosConfig";
import styles from "./BoardSettings.module.scss";

const BoardSettings = () => {
  const [currentTheme, setCurrentTheme] = useState(() => {
    try {
      return localStorage.getItem("boardTheme") || "brown";
    } catch (error) {
      return "brown";
    }
  });

  useEffect(() => {
    applyBoardTheme(currentTheme);
  }, [currentTheme]);

  const handleThemeChange = (themeKey) => {
    setCurrentTheme(themeKey);
    applyBoardTheme(themeKey);
    axiosClient.patch("/users/preferences", { boardTheme: themeKey }).catch((err) => {
      console.error("Failed to save theme preference:", err);
    });
  };

  return (
    <div className={styles.boardSettings}>
      <h3>Kiểu bàn cờ</h3>
      <div className={styles.themeGrid}>
        {Object.entries(BOARD_THEMES).map(([key, theme]) => (
          <div
            key={key}
            className={`${styles.themePreview} ${
              currentTheme === key ? styles.selected : ""
            }`}
            onClick={() => handleThemeChange(key)}
          >
            <div className={styles.board}>
              <div style={{ backgroundColor: theme.white }}></div>
              <div style={{ backgroundColor: theme.black }}></div>
              <div style={{ backgroundColor: theme.black }}></div>
              <div style={{ backgroundColor: theme.white }}></div>
            </div>
            <span>{theme.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BoardSettings;
