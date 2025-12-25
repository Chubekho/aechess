import { useState } from "react";
import { BOARD_THEMES, applyBoardTheme } from "@/utils/themeConfig";
import { useToast } from "@/hooks/index";
import axiosClient from "@/utils/axiosConfig";
import ChessBoardCustom from "@/components/ChessBoardCustom";
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
      toast.success("Cập nhật giao diện bàn cờ thành công!");
    } catch (error) {
      console.error("Failed to save theme preference:", error);
      toast.error(error.response?.msg || "Lỗi khi lưu cài đặt giao diện bàn cờ.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={styles.boardSettingsContainer}>
      <div className={styles.previewSection}>
        <h3>Xem trước</h3>
        {console.log(selectedTheme)}
        <ChessBoardCustom
          previewTheme={selectedTheme}
          boardWidth={400}
          arePiecesDraggable={false}
        />
      </div>
      <div className={styles.selectionSection}>
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
          {isSaving ? "Lưu..." : "Lưu"}
        </button>
      </div>
    </div>
  );
};

export default BoardSettings;