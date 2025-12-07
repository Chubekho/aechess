// pages/Analysis/index.jsx
import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import axios from "axios";
import clsx from "clsx";
import styles from "./Analysis.module.scss";

// Hooks & Context
import { useAuth, useGameNavigation, useStockfish } from "@/hooks/index";

// Components
import MoveBoard from "@/components/MoveBoard";
import EvaluationBar from "@/pages/Analysis/components/EvaluationBar";
import EngineOutput from "./components/EngineOutput";
import AnalysisSettings from "./components/AnalysisSettings";
import PlayerInfoBox from "@/components/PlayerInfoBox";

// FEN chuẩn của bàn cờ vua khi bắt đầu
const START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

function AnalysisPage() {
  const { id: gameId } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // --- 1. State & Refs ---

  // State UI
  const [fen, setFen] = useState(START_FEN);
  const [pgnHeaders, setPgnHeaders] = useState({});

  // Engine Settings
  const [depth, setDepth] = useState(18);
  const [multiPV, setMultiPV] = useState(3);

  const [isAnalyzing, setIsAnalyzing] = useState(true);

  // Để biết trạng thái của game
  const gameResult = useMemo(() => {
    const tempGame = new Chess(fen);

    if (tempGame.isCheckmate()) {
      // Nếu đến lượt Trắng đi mà bị chiếu hết -> Đen thắng ('b')
      const winner = tempGame.turn() === "w" ? "b" : "w";
      return { isGameOver: true, type: "checkmate", winner };
    }

    if (tempGame.isDraw()) {
      let reason = "Hòa";
      if (tempGame.isStalemate()) reason = "Hòa (Stalemate)";
      if (tempGame.isThreefoldRepetition()) reason = "Hòa (Lặp lại 3 lần)";
      if (tempGame.isInsufficientMaterial()) reason = "Hòa (Không đủ quân)";

      return { isGameOver: true, type: "draw", reason };
    }

    return null; // Game chưa kết thúc
  }, [fen]);

  // --- 2. Hooks ---
  const {
    currentNode,
    rootNode,
    handleNavigation,
    addMove,
    resetNavigation,
    loadHistory,
  } = useGameNavigation(setFen);

  const { lines, isEngineReady } = useStockfish(fen, {
    depth,
    multiPV,
    isAnalyzing,
  });

  // --- 3. Fetch & Init Game Data ---
  useEffect(() => {
    // Helper: Nạp game vào State & Tree
    const loadGameToState = (gameInstance) => {
      // 1. Cập nhật Header
      setPgnHeaders(gameInstance.header());

      // 2. Reset Cây
      resetNavigation();

      // 3. Nạp lịch sử (Bulk Load)
      const historyVerbose = gameInstance.history({ verbose: true });
      loadHistory(historyVerbose);

      // 4. Cập nhật UI về cuối
      setFen(gameInstance.fen());
    };

    const initGame = async () => {
      // CASE 1: Xem lại ván đấu (Có gameId)
      if (gameId) {
        if (!token) return; // Đợi token (nếu bắt buộc)
        try {
          const res = await axios.get(
            `http://localhost:8080/api/games/${gameId}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );

          const loadedGame = new Chess();
          // Load PGN an toàn
          try {
            loadedGame.loadPgn(res.data.pgn);
          } catch (e) {
            console.error("PGN Error:", e);
          }

          loadGameToState(loadedGame);
        } catch (err) {
          console.error("Lỗi tải ván đấu:", err);
          alert("Không thể tải ván đấu.");
          navigate("/");
        }
      }
      // CASE 2: Chế độ Import hoặc Tự do
      else {
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
      }
    };

    initGame();
  }, [gameId, token, navigate, resetNavigation, loadHistory, location.state]);

  // 4. Arrows (Cần cập nhật logic lấy from/to từ Tree)
  const arrows = useMemo(() => {
    const result = [];

    // B. Engine Arrows
    if (isAnalyzing && lines.length > 0) {
      lines.forEach((line, index) => {
        if (line.bestMove) {
          const { from, to } = line.bestMove;
          let opacity = 1.0;
          if (index === 1) opacity = 0.6;
          if (index >= 2) opacity = 0.3;
          result.push({
            startSquare: from,
            endSquare: to,
            color: `rgba(0, 128, 0, ${opacity})`,
          });
        }
      });
    }
    return result;
  }, [lines, isAnalyzing]);

  // 5. Logic OnPieceDrop (Đơn giản hơn rất nhiều)
  const onPieceDrop = useCallback(
    ({ sourceSquare, targetSquare }) => {
      const tempGame = new Chess(fen);
      try {
        const move = tempGame.move({
          from: sourceSquare,
          to: targetSquare,
          promotion: "q",
        });

        if (!move) return false;

        addMove(move.san, tempGame.fen());
        setFen(tempGame.fen());

        return true;
      } catch (e) {
        console.log(e);
        return false;
      }
    },
    [fen, addMove]
  );

  const chessboardOptions = useMemo(
    () => ({
      position: fen,
      arrows,
      onPieceDrop: onPieceDrop,
      id: "PlayVsPerson",
      boardOrientation: "white",
    }),
    [fen, onPieceDrop, arrows]
  );

  return (
    <div className={clsx(styles.wrapper, "row", "gx-6")}>
      {/* --- CỘT 1 (3/12): THÔNG TIN NGƯỜI CHƠI --- */}
      <div className={clsx("col-3", styles.playerInfoColumn)}>
        {/* Player B (Black) */}
        <PlayerInfoBox
          player={{
            name: pgnHeaders.Black || "Black",
            rating: pgnHeaders.BlackElo,
          }}
          timeControl={pgnHeaders.TimeControl}
          variant="top"
        />

        {/* Player A (White) */}
        <PlayerInfoBox
          player={{
            name: pgnHeaders.White || "White",
            rating: pgnHeaders.WhiteElo,
          }}
          timeControl={pgnHeaders.TimeControl}
          variant="bottom"
        />
      </div>

      {/* --- CỘT 2 (6/12): BÀN CỜ + EVAL BAR --- */}
      <div className={clsx("col-6", styles.boardContainerFlex)}>
        <div className={styles.evalColumn}>
          <EvaluationBar
            evaluation={
              lines[0]
                ? {
                    type: lines[0].mate ? "mate" : "cp",
                    value: lines[0].mate ? lines[0].mate : lines[0].score,
                  }
                : null
            }
            gameResult={gameResult}
            isAnalyzing={isAnalyzing}
          />
        </div>

        <div className={styles.boardWrapper}>
          <Chessboard options={chessboardOptions} />
        </div>
      </div>

      {/* --- CỘT 3 (3/12): PANEL PHÂN TÍCH --- */}
      <div className={clsx("col-3", styles.panelArea)}>
        <div className={styles.panelContainer}>
          <div className={styles.panelHeader}>
            <h2>Phân tích & Engine</h2>
            <label className={styles.engineToggle}>
              <input
                type="checkbox"
                checked={isAnalyzing}
                onChange={() => setIsAnalyzing(!isAnalyzing)}
              />
              <span className={styles.slider}></span>
            </label>
          </div>

          <div className={styles.engineOutputSection}>
            <AnalysisSettings
              depth={depth}
              setDepth={setDepth}
              multiPV={multiPV}
              setMultiPV={setMultiPV}
            />
            <EngineOutput
              lines={lines}
              isEngineReady={isEngineReady}
              isAnalyzing={isAnalyzing}
              gameResult={gameResult}
            />
          </div>

          <div className={styles.moveListSection}>
            <MoveBoard
              rootNode={rootNode}
              currentNode={currentNode}
              onNavigate={handleNavigation}
              showVariations={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default AnalysisPage;
