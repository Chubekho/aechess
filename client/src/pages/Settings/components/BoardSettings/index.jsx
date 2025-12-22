import { useState } from "react";
import { BOARD_THEMES, applyBoardTheme } from "@/utils/themeConfig";
import { useToast } from "@/hooks/index";
import axiosClient from "@/utils/axiosConfig";
import styles from "./BoardSettings.module.scss";

const BoardSettings = () => {
  const toast = useToast();
  const [selectedTheme, setSelectedTheme] = useState(() => {
    return localStorage.getItem("boardTheme") || "brown";
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleThemeClick = (themeKey) => {
    setSelectedTheme(themeKey);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await axiosClient.patch("/users/preferences", { boardTheme: selectedTheme });
      applyBoardTheme(selectedTheme);
      toast.success("Board theme updated successfully!");
    } catch (error) {
      console.error("Failed to save theme preference:", error);
      toast.error(error.response?.data?.msg || "Failed to update theme.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={styles.boardSettings}>
      <h3>Kiểu bàn cờ</h3>
      <div className={styles.themeGrid}>
        {Object.entries(BOARD_THEMES).map(([key, theme]) => (
          <div
            key={key}
            className={`${styles.themePreview} ${
              selectedTheme === key ? styles.selected : ""
            }`}
            onClick={() => handleThemeClick(key)}
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
      <button
        className={styles.saveButton}
        onClick={handleSave}
        disabled={isSaving}
      >
        {isSaving ? "Saving..." : "Save Changes"}
      </button>
    </div>
  );
};

export default BoardSettings;