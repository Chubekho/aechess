export const BOARD_THEMES = {
  brown: { name: "Brown (Classic)", white: "#f0d9b5", black: "#b58863" },
  green: { name: "Green", white: "#ffffdd", black: "#86a666" },
  blue: { name: "Blue", white: "#dee3e6", black: "#8ca2ad" },
  dark: { name: "Dark Gray", white: "#bababa", black: "#646464" },
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