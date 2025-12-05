// pages/Analysis/index.jsx
import { useEffect, useState, useMemo, useCallback } from "react";
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
import EvaluationBar from "@/components/EvaluationBar";
import EngineOutput from "./components/EngineOutput";
import AnalysisSettings from "./components/AnalysisSettings";

// FEN chuẩn của bàn cờ vua khi bắt đầu
const START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

function AnalysisPage() {
  const { id: gameId } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();

  // --- 1. State & Refs ---

  // State UI
  const [fen, setFen] = useState(START_FEN);
  const [pgnHeaders, setPgnHeaders] = useState({});

  // Engine Settings
  const [depth, setDepth] = useState(18);
  const [multiPV, setMultiPV] = useState(3);

  // --- 2. Hooks ---
  const {
    currentNode,
    rootNode,
    handleNavigation,
    addMove,
    resetNavigation,
    loadHistory,
  } = useGameNavigation(setFen);

  const { lines, isEngineReady } = useStockfish(fen, { depth, multiPV });

  // --- 3. Fetch Game Data ---
  useEffect(() => {
    if (!token) return;

    const fetchGame = async () => {
      try {
        const res = await axios.get(
          `http://localhost:8080/api/games/${gameId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const gameData = res.data;
        const loadedGame = new Chess();

        // 1. Load PGN từ database
        try {
          loadedGame.loadPgn(gameData.pgn);
        } catch (e) {
          console.error("PGN Lỗi (có thể do version cũ):", e);
        }

        // 2. Lưu thông tin Header (Tên người chơi, Elo...)
        setPgnHeaders(loadedGame.getHeaders());

        // 3. Reset Cây điều hướng về trạng thái ban đầu (Root)
        resetNavigation();

        // 4. Nạp lại lịch sử vào Cây (Replay)
        const historyVerbose = loadedGame.history({ verbose: true });
        loadHistory(historyVerbose);
        setFen(loadedGame.fen());

        console.log("Game Loaded Successfully. Total Moves:", history.length);
      } catch (err) {
        console.error("Lỗi tải ván đấu:", err);
        alert("Không thể tải ván đấu này.");
        navigate("/");
      }
    };

    fetchGame();
  }, [gameId, token, navigate, resetNavigation, loadHistory]);

  // 4. Arrows (Cần cập nhật logic lấy from/to từ Tree)
  const arrows = useMemo(() => {
    const result = [];

    // B. Engine Arrows
    if (lines.length > 0) {
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
  }, [lines]);

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
      <div className={clsx("col-1")} />

      <div className={clsx("col-6", styles.boardContainerFlex)}>
        <div className={styles.evalColumn}>
          <EvaluationBar
            evaluation={
              lines[0]
                ? { type: lines[0].mate ? "mate" : "cp", value: lines[0].mate ? lines[0].mate : lines[0].score}
                : null
            }
          />
        </div>

        <div className={styles.boardWrapper}>
          <div className={styles.playerHeader}>
            <span className={styles.playerName}>
              {pgnHeaders.Black || "Black"}
            </span>
            <span className={styles.playerRating}>
              ({pgnHeaders.BlackElo || "?"})
            </span>
          </div>

          <div className={styles.board}>
            <Chessboard options={chessboardOptions} />
          </div>

          <div className={styles.playerHeader}>
            <span className={styles.playerName}>
              {pgnHeaders.White || "White"}
            </span>
            <span className={styles.playerRating}>
              ({pgnHeaders.WhiteElo || "?"})
            </span>
          </div>
        </div>
      </div>

      <div className={clsx("col-2", styles.panelArea)}>
        <div className={styles.panelContainer}>
          <div className={styles.panelHeader}>
            <h2>Phân tích & Engine</h2>
          </div>

          <div className={styles.engineOutputSection}>
            <AnalysisSettings
              depth={depth}
              setDepth={setDepth}
              multiPV={multiPV}
              setMultiPV={setMultiPV}
            />
            <EngineOutput lines={lines} isEngineReady={isEngineReady} />
          </div>

          <div className={styles.moveListSection}>
            <MoveBoard
              rootNode={rootNode}
              currentNode={currentNode} // Node hiện tại để highlight
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
