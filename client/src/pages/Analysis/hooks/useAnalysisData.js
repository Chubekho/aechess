import { useEffect, useState } from "react";
import { Chess } from "chess.js";
import { useNavigate } from "react-router";
import axiosClient from "@/utils/axiosConfig"; // [CHUẨN] Dùng axiosClient
import { useToast } from "@/hooks/index";

export const useAnalysisData = (
  gameId,
  token,
  user,
  locationState,
  callbacks
) => {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const toast = useToast();

  const {
    setPgnHeaders,
    setPgn,
    resetNavigation,
    loadHistory,
    setFen,
    setBoardOrientation,
  } = callbacks;

  useEffect(() => {
    // Helper: Trích xuất dữ liệu từ instance chess.js ra State
    const loadGameToState = (gameInstance) => {
      const headers = gameInstance.header();
      setPgnHeaders(headers); // Fix lỗi header null
      setPgn(gameInstance.pgn());
      resetNavigation();

      const historyVerbose = gameInstance.history({ verbose: true });
      loadHistory(historyVerbose); // Fix lỗi không có nước đi
      setFen(gameInstance.fen());

      return headers;
    };

    const initGame = async () => {
      setLoading(true);
      try {
        // ---------------------------------------------------------
        // CASE 1: Load Game từ Database (Có Game ID)
        // ---------------------------------------------------------
        if (gameId) {
          if (!token) return; // Chờ token sẵn sàng
          try {
            const res = await axiosClient.get(`/games/${gameId}`);
            const gameData = res; // Giả sử API trả về { success: true, game: ... }

            // Load PGN từ DB
            const loadedGame = new Chess();
            try {
              loadedGame.loadPgn(gameData.pgn);
            } catch (e) {
              console.error("PGN Error from DB:", e);
            }
            
            const headers = loadGameToState(loadedGame);

            // LOGIC ORIENTATION (XOAY BÀN CỜ)
            // So sánh username của user hiện tại với tên người cầm quân Đen trong PGN
            const blackPlayerName = headers?.Black || gameData.blackPlayer?.username;
            
            if (user && blackPlayerName && user.username === blackPlayerName) {
              setBoardOrientation("black");
            } else {
              setBoardOrientation("white");
            }

          } catch (err) {
            console.error("Lỗi tải ván đấu:", err);
            toast.error("Không tìm thấy ván đấu hoặc lỗi server.");
            navigate("/");
          }
        } 
        // ---------------------------------------------------------
        // CASE 2: Import PGN trực tiếp (Không có Game ID)
        // ---------------------------------------------------------
        else {
          // [FIX BUG] Dùng locationState được truyền vào, không dùng location.state
          const pgnFromImport = locationState?.pgnInput; 
          const localGame = new Chess();

          if (pgnFromImport) {
            try {
              localGame.loadPgn(pgnFromImport);
            } catch (e) {
              console.error("Invalid PGN Input:", e);
              toast.error("Chuỗi PGN không hợp lệ.");
              // Không navigate về home ngay để user có thể thử lại nếu muốn
            }
            // Xóa state của history browser để tránh F5 bị duplicate action (Optional)
            window.history.replaceState({}, document.title);
          }

          loadGameToState(localGame);
          
          // Với Import PGN, mặc định luôn là White trừ khi có logic khác
          setBoardOrientation("white");
        }
      } finally {
        setLoading(false);
      }
    };

    initGame();
  }, [
    gameId,
    token,
    user, // User thay đổi thì check lại orientation
    locationState,
    // Callbacks dependencies
    setPgnHeaders,
    setPgn,
    resetNavigation,
    loadHistory,
    setFen,
    setBoardOrientation,
    navigate,
    toast
  ]);

  return { loading };
};