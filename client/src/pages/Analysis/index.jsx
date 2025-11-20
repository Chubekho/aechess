import { useEffect, useState, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import axios from "axios";
import clsx from "clsx";
import styles from "./Analysis.module.scss";

// Hooks & Context
import { useAuth, useGameNavigation, useStockfish } from "@/hooks/index";

// Components
import MoveBoard from "@/components/MoveBoard";
import EvaluationBar from "@/components/EvaluationBar"; // (Component từ Phần 2)
import EngineOutput from "@/components/EngineOutput";   // (Component từ Phần 2)
import AnalysisSettings from "./components/AnalysisSettings"; // (Component từ Phần 2)

function AnalysisPage() {
  const { id: gameId } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();

  // --- 1. State quản lý Game & Logic ---
  const gameRef = useRef(new Chess());
  const [fen, setFen] = useState("start"); // FEN hiện tại để hiển thị
  const [pgnHeaders, setPgnHeaders] = useState({}); // Thông tin ván đấu (White, Black...)
  
  // State cho Navigation (Tua lại)
  const [moveHistory, setMoveHistory] = useState([]);
  const [lastMove, setLastMove] = useState(null);
  const fenHistoryRef = useRef([]); // Lưu lịch sử FEN để tua

  // State cho Engine Settings
  const [depth, setDepth] = useState(18);
  const [multiPV, setMultiPV] = useState(3); // Mặc định hiện 3 dòng

  // --- 2. Sử dụng Hooks ---
  
  // A. Hook Điều hướng (Tái sử dụng từ GamePage)
  const { 
    currentMoveIndex, 
    handleNavigation 
  } = useGameNavigation(fenHistoryRef, moveHistory, setFen, setLastMove);

  // B. Hook Stockfish (Phân tích FEN hiện tại)
  const { lines, isEngineReady } = useStockfish(fen, { depth, multiPV });

  // --- 3. Fetch Dữ liệu Ván đấu ---
  useEffect(() => {
    // Cho phép xem phân tích kể cả khi chưa login (nếu muốn), 
    // nhưng ở đây giả sử cần token để gọi API
    if (!token) return;

    const fetchGame = async () => {
      try {
        const res = await axios.get(`http://localhost:8080/api/games/${gameId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        const gameData = res.data;
        const loadedGame = new Chess();
        
        // Load PGN vào chess.js
        loadedGame.loadPgn(gameData.pgn);

        // Lưu thông tin Header (Tên người chơi, kết quả...)
        setPgnHeaders(loadedGame.header());

        // Xây dựng dữ liệu lịch sử
        const historyVerbose = loadedGame.history({ verbose: true });
        const fens = historyVerbose.map(move => move.after);
        const moves = loadedGame.history();

        // Cập nhật Refs & State
        gameRef.current = loadedGame;
        fenHistoryRef.current = [new Chess().fen(), ...fens]; // FEN đầu + các nước đi
        setMoveHistory(moves);
        
        // Mặc định tua đến cuối ván
        handleNavigation('end');
        
      } catch (err) {
        console.error("Lỗi tải ván đấu:", err);
        alert("Không tìm thấy ván đấu hoặc bạn không có quyền truy cập.");
        navigate("/");
      }
    };

    fetchGame();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId, token]); // navigate và handleNavigation ổn định nên có thể bỏ qua hoặc thêm vào


  // --- 4. Tính toán Mũi tên (Arrows) cho Bàn cờ ---
  // Vẽ mũi tên cho nước đi tốt nhất (Line 1 của Stockfish)
  const engineArrows = useMemo(() => {
    if (lines.length > 0 && lines[0].bestMove) {
      const { from, to } = lines[0].bestMove;
      return [[from, to, "rgb(0, 128, 0)"]]; // Mũi tên màu xanh lá
    }
    return [];
  }, [lines]);

  // Mũi tên cho nước đi thực tế (Last Move)
//   const lastMoveArrow = useMemo(() => {
//     // (Logic này hơi phức tạp để lấy from-to từ SAN 'e4', 
//     // tạm thời react-chessboard tự highlight last move square nên có thể bỏ qua)
//     return [];
//   }, [lastMove]);


  return (
    <div className={clsx(styles.wrapper, "row", "gx-0")}>
      
      {/* CỘT 1: THANH ĐÁNH GIÁ (Nhỏ xíu bên trái) */}
      <div className={styles.evalColumn}>
        <EvaluationBar evaluation={lines[0] ? { type: lines[0].mate ? 'mate' : 'cp', value: lines[0].score } : null} />
      </div>

      {/* CỘT 2: BÀN CỜ */}
      <div className={clsx("col-7", styles.boardArea)}>
        {/* Header: Thông tin Đen */}
        <div className={styles.playerHeader}>
          <span className={styles.playerName}>{pgnHeaders.Black || "Black"}</span>
          <span className={styles.playerRating}>({pgnHeaders.BlackElo || "?"})</span>
        </div>

        <div className={styles.board}>
          <Chessboard 
            position={fen} 
            arePiecesDraggable={false} // Chế độ xem, không cho đi lung tung
            customArrows={[...engineArrows]} // Vẽ mũi tên gợi ý
            id="AnalysisBoard"
          />
        </div>

        {/* Footer: Thông tin Trắng */}
        <div className={styles.playerHeader}>
          <span className={styles.playerName}>{pgnHeaders.White || "White"}</span>
          <span className={styles.playerRating}>({pgnHeaders.WhiteElo || "?"})</span>
        </div>
      </div>

      {/* CỘT 3: BẢNG PHÂN TÍCH & LỊCH SỬ */}
      <div className={clsx("col", styles.panelArea)}>
        <div className={styles.panelContainer}>
          
          {/* Tab Header */}
          <div className={styles.panelHeader}>
            <h2>Phân tích & Engine</h2>
          </div>

          {/* 1. Cài đặt Engine */}
          <div className={styles.settingsSection}>
            <AnalysisSettings 
              depth={depth} setDepth={setDepth}
              multiPV={multiPV} setMultiPV={setMultiPV}
            />
          </div>

          {/* 2. Kết quả Engine */}
          <div className={styles.engineOutputSection}>
            <EngineOutput lines={lines} isEngineReady={isEngineReady} />
          </div>

          {/* 3. Lịch sử nước đi (Tái sử dụng MoveBoard) */}
          <div className={styles.moveListSection}>
            <MoveBoard 
              history={moveHistory}
              lastMove={lastMove}
              gameStatus="gameOver" // Để bật chế độ tua
              onNavigate={handleNavigation} // Dùng hook điều hướng
              currentMoveIndex={currentMoveIndex}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default AnalysisPage;