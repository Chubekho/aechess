// pages/Analysis/index.jsx
import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useLocation } from "react-router";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import clsx from "clsx";
import styles from "./Analysis.module.scss";

// Hooks & Context
import {
  useAuth,
  useGameNavigation,
  useStockfish,
  useFullGameAnalysis,
} from "@/hooks/index";

import { useAnalysisData } from "./hooks/useAnalysisData";
import { getPlayerLayout } from "@/utils/chessUtils";

// Components
import MoveBoard from "@/components/MoveBoard";
import EvaluationBar from "@/pages/Analysis/components/EvaluationBar";
import EngineOutput from "./components/EngineOutput";
import PlayerInfoBox from "@/components/PlayerInfoBox";
import AnalysisSettings from "./components/AnalysisSettings";
import PlayerReportCard from "./components/PlayerReportCard";

// FEN chuẩn của bàn cờ vua khi bắt đầu
const START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

function AnalysisPage() {
  const { id: gameId } = useParams();
  const { token, user } = useAuth();

  const location = useLocation();

  // --- 1. State & Refs ---

  // State UI
  const [fen, setFen] = useState(START_FEN);
  const [pgnHeaders, setPgnHeaders] = useState({});
  const [pgn, setPgn] = useState(null);
  const [boardOrientation, setBoardOrientation] = useState("white");

  // Engine Settings
  const [depth, setDepth] = useState(18);
  const [multiPV, setMultiPV] = useState(3);
  const [isAnalyzing, setIsAnalyzing] = useState(true);

  // --- 2. Game Logic Hooks ---
  const {
    currentNode,
    rootNode,
    handleNavigation,
    addMove,
    resetNavigation,
    loadHistory,
  } = useGameNavigation(setFen);

  // --- FETCH DATA HOOK ---
  // Gọi hook và truyền các hàm setter vào
  const { loading } = useAnalysisData(gameId, token, user, location.state, {
    setPgnHeaders,
    setPgn,
    resetNavigation,
    loadHistory,
    setFen,
    setBoardOrientation,
  });

  // --- Engine & Analysis Hooks ---
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

  const { lines, isEngineReady } = useStockfish(fen, {
    depth,
    multiPV,
    isAnalyzing,
  });

  const {
    runAnalysis,
    progress: reportProgress,
    isAnalyzing: isReportAnalyzing,
    report,
  } = useFullGameAnalysis();

  // --- 3. Fetch & Init Game Data ---
  useEffect(() => {}, [
    gameId,
    token,
    user,
    resetNavigation,
    loadHistory,
    location.state,
  ]);

  // --- 5. AUTO RUN ANALYSIS ---
  useEffect(() => {
    if (pgn && !isReportAnalyzing && !report) {
      runAnalysis(pgn);
    }
  }, [pgn, isReportAnalyzing, report, runAnalysis]);

  // --- 6. Helper & Handlers ---
  // Hàm đảo ngược bàn cờ thủ công
  const handleFlipBoard = () => {
    setBoardOrientation((prev) => (prev === "white" ? "black" : "white"));
  };

  // 5. Logic OnPieceDrop
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

  // 4. Arrows logic
  const arrows = useMemo(() => {
    const result = [];

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

  // Player Info & Layout Data
  const whitePlayerInfo = {
    name: pgnHeaders.White || "White",
    rating: pgnHeaders.WhiteElo,
  };
  const blackPlayerInfo = {
    name: pgnHeaders.Black || "Black",
    rating: pgnHeaders.BlackElo,
  };

  // 2. Gọi Helper (Truyền cả Report)
  const { top, bottom } = getPlayerLayout(
    boardOrientation,
    whitePlayerInfo,
    blackPlayerInfo,
    report?.white,
    report?.black
  );

  const chessboardOptions = useMemo(
    () => ({
      position: fen,
      arrows,
      onPieceDrop: onPieceDrop,
      id: "PlayVsPerson",
      boardOrientation: boardOrientation,
    }),
    [fen, onPieceDrop, arrows, boardOrientation]
  );

  const Divider = () => (
    <div
      style={{
        height: "1px",
        backgroundColor: "#3a3836",
        margin: "15px 0",
        width: "100%",
      }}
    />
  );

  if (loading)
    return <div className="text-center p-5">Loading game data...</div>;

  return (
    <div className={clsx(styles.wrapper, "row", "gx-6")}>
      {/* --- CỘT 1 (TRÁI): THÔNG TIN PLAYER & REPORT --- */}
      <div className={clsx("col-3", styles.playerInfoColumn)}>
        {/* PLAYER Ở TRÊN (TOP) */}
        <div className={styles.playerBlock}>
          <PlayerInfoBox
            player={top.player}
            timeControl={pgnHeaders.TimeControl}
            variant="top"
            side={top.side}
          />
          {!isReportAnalyzing && top.report && (
            <div className={styles.reportWrapper}>
              <PlayerReportCard stats={top.report} />
            </div>
          )}
        </div>

        <Divider />

        {/* PLAYER Ở DƯỚI (BOTTOM) */}
        <div className={styles.playerBlock}>
          <PlayerInfoBox
            player={bottom.player}
            timeControl={pgnHeaders.TimeControl}
            variant="bottom"
            side={bottom.side}
          />
          {!isReportAnalyzing && bottom.report && (
            <div className={styles.reportWrapper}>
              <PlayerReportCard stats={bottom.report} />
            </div>
          )}
        </div>
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
          <button
            className={styles.flipBtn}
            onClick={handleFlipBoard}
            title="Xoay bàn cờ"
          >
            <i className="fa-solid fa-retweet"></i>
          </button>
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

          {/* CHỈ HIỂN THỊ LOADING BAR Ở ĐÂY (Vì Report Card đã chuyển sang trái) */}
          {isReportAnalyzing && (
            <div className={styles.analyzingState}>
              <p style={{ color: "#aaa", fontSize: "1.3rem" }}>
                Đang phân tích... {reportProgress}%
              </p>
              <div className={styles.progressBar}>
                <div style={{ width: `${reportProgress}%` }}></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AnalysisPage;
