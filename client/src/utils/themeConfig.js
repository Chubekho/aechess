export const BOARD_THEMES = {
  brown: { name: "Gỗ (Cổ điển)", white: "#eeeed2", black: "#769656" },
  green: { name: "Xanh lá", white: "#ffffdd", black: "#86a666" },
  blue: { name: "Xanh dương", white: "#dee3e6", black: "#8ca2ad" },
  dark: { name: "Xám tối", white: "#bababa", black: "#646464" },
};

export function applyBoardTheme(themeName) {
  const theme = BOARD_THEMES[themeName];
  if (!theme) {
    console.warn(`Theme "${themeName}" not found.`);
    return;
  }

  const root = document.documentElement;
  root.style.setProperty("--board-bg-white", theme.white);
  root.style.setProperty("--board-bg-black", theme.black);

  try {
    localStorage.setItem("boardTheme", themeName);
  } catch (error) {
    console.error("Failed to save theme to localStorage", error);
  }
}
