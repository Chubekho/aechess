// pages/Analysis/index.jsx
import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useLocation } from "react-router";
import { Chess } from "chess.js";

import ChessBoardCustom from "@/components/ChessBoardCustom";
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
import FlipBoardButton from "@/components/FlipBoardButton";

// FEN Mặc định của bàn cờ khi bắt đầu
const START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

function AnalysisPage() {
  const { id: gameId } = useParams();
  const { token, user } = useAuth();
  const location = useLocation();

  // --- State ---
  const [fen, setFen] = useState(START_FEN);
  const [pgnHeaders, setPgnHeaders] = useState({});
  const [pgn, setPgn] = useState(null);
  const [boardOrientation, setBoardOrientation] = useState("white");
  const [depth, setDepth] = useState(18);
  const [multiPV, setMultiPV] = useState(3);
  const [isAnalyzing, setIsAnalyzing] = useState(true);

  // --- Game Logic & Data Fetching ---
  const {
    currentNode,
    rootNode,
    handleNavigation,
    addMove,
    resetNavigation,
    loadHistory,
  } = useGameNavigation(setFen);

  const { loading } = useAnalysisData(gameId, token, user, location.state, {
    setPgnHeaders,
    setPgn,
    resetNavigation,
    loadHistory,
    setFen,
    setBoardOrientation,
  });

  const gameResult = useMemo(() => {
    const tempGame = new Chess(fen);
    if (tempGame.isCheckmate()) {
      const winner = tempGame.turn() === "w" ? "b" : "w";
      return { isGameOver: true, type: "checkmate", winner };
    }
    if (tempGame.isDraw()) {
      let reason = "Draw";
      if (tempGame.isStalemate()) reason = "Draw (Stalemate)";
      if (tempGame.isThreefoldRepetition()) reason = "Draw (3-fold Rep.)";
      if (tempGame.isInsufficientMaterial()) reason = "Draw (Material)";
      return { isGameOver: true, type: "draw", reason };
    }
    return null;
  }, [fen]);

  // --- Engine & Analysis ---
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

  useEffect(() => {
    if (pgn && !isReportAnalyzing && !report) {
      runAnalysis(pgn);
    }
  }, [pgn, isReportAnalyzing, report, runAnalysis]);

  const analysisMap = useMemo(() => {
    if (!report?.moves) return {};
    const map = {};
    report.moves.forEach((move) => {
      map[move.fen] = { type: move.type };
    });
    return map;
  }, [report]);

  // --- Handlers ---
  const handleFlipBoard = () => {
    setBoardOrientation((prev) => (prev === "white" ? "black" : "white"));
  };

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
        console.error(e);
        return false;
      }
    },
    [fen, addMove]
  );

  const arrows = useMemo(() => {
    if (!isAnalyzing || lines.length === 0) return [];
    return lines
      .map((line, index) => {
        if (!line.bestMove) return null;
        const { from, to } = line.bestMove;
        let opacity = 1.0;
        if (index === 1) opacity = 0.6;
        if (index >= 2) opacity = 0.3;
        return {
          startSquare: from,
          endSquare: to,
          color: `rgba(0, 128, 0, ${opacity})`,
        };
      })
      .filter(Boolean);
  }, [lines, isAnalyzing]);

  // --- Player Info & Layout ---
  const whitePlayerInfo = {
    username: pgnHeaders.White || "White",
    rating: pgnHeaders.WhiteElo,
  };
  const blackPlayerInfo = {
    username: pgnHeaders.Black || "Black",
    rating: pgnHeaders.BlackElo,
  };

  const { top, bottom } = getPlayerLayout(
    boardOrientation,
    whitePlayerInfo,
    blackPlayerInfo,
    report?.white,
    report?.black
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

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "20px" }}>
        Loading game data...
      </div>
    );
  }

  return (
    <div className={styles.analysisWrapper}>
      {/* 1. Left Panel: Players & Reports */}
      <div className={styles.leftPanel}>
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

      {/* 2. Center: Eval Bar + Board */}
      <div className={styles.boardContainer}>
        <div className={styles.evalBarWrapper}>
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
          <ChessBoardCustom
            position={fen}
            arrows={arrows}
            onPieceDrop={onPieceDrop}
            boardOrientation={boardOrientation}
            arePiecesDraggable={true}
          />
        </div>
        <FlipBoardButton onClick={handleFlipBoard} className={styles.flipBtn} />
      </div>

      {/* 3. Right Panel: Engine & Moves */}
      <div className={styles.rightPanel}>
        <div className={styles.panelContainer}>
          <div className={styles.panelHeader}>
            <h2>Analysis & Engine</h2>
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
              analysisData={analysisMap}
            />
          </div>
          {isReportAnalyzing && (
            <div className={styles.analyzingState}>
              <p>Analyzing... {reportProgress}%</p>
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
