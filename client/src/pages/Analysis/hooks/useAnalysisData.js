import { useEffect, useState } from "react";
import axios from "axios";
import { Chess } from "chess.js";
import { useNavigate } from "react-router";

export const useAnalysisData = (
  gameId,
  token,
  user,
  locationState,
  callbacks
) => {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const {
    setPgnHeaders,
    setPgn,
    resetNavigation,
    loadHistory,
    setFen,
    setBoardOrientation,
  } = callbacks;

  useEffect(() => {
    // Định nghĩa logic load game bên trong effect hoặc hook để closure các biến callbacks
    const loadGameToState = (gameInstance) => {
      setPgnHeaders(gameInstance.header());
      setPgn(gameInstance.pgn());
      resetNavigation();

      const historyVerbose = gameInstance.history({ verbose: true });
      loadHistory(historyVerbose);
      setFen(gameInstance.fen());

      return gameInstance.header();
    };

    const initGame = async () => {
      setLoading(true);
      try {
        // CASE 1: Load từ API (có Game ID)
        if (gameId) {
          if (!token) return; // Đợi token
          try {
            // 1. Gọi song song API lấy Game và API lấy thông tin User hiện tại
            const [gameRes, userRes] = await Promise.all([
              axios.get(`http://localhost:8080/api/games/${gameId}`, {
                headers: { Authorization: `Bearer ${token}` },
              }),
              axios.get(`http://localhost:8080/api/users/${user?.username}`, {
                headers: { Authorization: `Bearer ${token}` },
              }),
            ]);
            // 2. Load Game
            const loadedGame = new Chess();
            try {
              loadedGame.loadPgn(gameRes.data.pgn);
            } catch (e) {
              console.error("PGN Error:", e);
            }
            const headers = loadGameToState(loadedGame);

            // 3. LOGIC SET ORIENTATION
            const currentDisplayName = userRes.data.displayName;
            const blackPlayerName = headers?.Black;

            // Nếu tên User hiện tại trùng với tên người cầm quân Đen -> Xoay bàn
            if (
              currentDisplayName &&
              blackPlayerName &&
              currentDisplayName === blackPlayerName
            ) {
              setBoardOrientation("black");
            } else {
              // Trường hợp còn lại (Quân Trắng hoặc Không trùng tên) -> Mặc định Trắng
              setBoardOrientation("white");
            }
          } catch (err) {
            console.error("Lỗi tải ván đấu:", err);
            alert("Không thể tải ván đấu.");
            navigate("/");
          }
        } else {
          const pgnFromImport = location.state?.pgnInput;
          const localGame = new Chess();

          if (pgnFromImport) {
            try {
              localGame.loadPgn(pgnFromImport);
            } catch (e) {
              console.log("PGN error:", e);
              navigate("/");
            }
            // Xóa state để F5 không bị load lại
            window.history.replaceState({}, document.title);
          }

          loadGameToState(localGame);
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
    user,
    locationState,
    // Thêm các dependency từ callbacks để đảm bảo hook chạy đúng khi các hàm này thay đổi (dù thường là stable)
    setPgnHeaders,
    setPgn,
    resetNavigation,
    loadHistory,
    setFen,
    setBoardOrientation,
    navigate,
  ]); 
  return { loading };
};
