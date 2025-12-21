import { useEffect } from "react";
import { useAuth } from "@/hooks/index";
import { applyBoardTheme } from "@/utils/themeConfig";

const useThemeSync = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (user?.preferences?.boardTheme) {
      let localTheme = "brown"; // Default value
      try {
        localTheme = localStorage.getItem("boardTheme") || "brown";
      } catch (error) {
        console.error("Failed to read theme from localStorage", error);
      }

      if (user.preferences.boardTheme !== localTheme) {
        applyBoardTheme(user.preferences.boardTheme);
      }
    }
  }, [user]);
};

export default useThemeSync;
