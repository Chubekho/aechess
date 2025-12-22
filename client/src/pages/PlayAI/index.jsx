import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";
import clsx from "clsx";
import styles from "./PlayAI.module.scss";
import MoveBoard from "@/components/MoveBoard";
import { useGameNavigation } from "@/hooks/index";
import { BOARD_THEMES } from "@/utils/themeConfig";

const difficultyLevels = [
  { ui: 1, skill: 1 },
  { ui: 2, skill: 3 },
  { ui: 3, skill: 5 },
  { ui: 4, skill: 7 },
  { ui: 5, skill: 9 },
  { ui: 6, skill: 11 },
  { ui: 7, skill: 13 },
  { ui: 8, skill: 15 },
];

function PlayAI() {
  const chessGameRef = useRef(new Chess());
  const engine = useRef(null);
  const [chessPosition, setChessPosition] = useState(
    chessGameRef.current.fen()
  );
  const fenHistoryRef = useRef([chessGameRef.current.fen()]);
  const { currentNode, rootNode, handleNavigation, addMove, resetNavigation } =
    useGameNavigation(setChessPosition);

  const [isStarted, setIsStarted] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState(5);
  const [selectedColor, setSelectedColor] = useState("w");
  const [playerColor, setPlayerColor] = useState("w");

  const savedTheme = localStorage.getItem("boardTheme") || "brown";
  const themeColors = BOARD_THEMES[savedTheme] || BOARD_THEMES.brown;

  const updateGameHistory = useCallback(
    (moveSan) => {
      const newFen = chessGameRef.current.fen();
      addMove(moveSan, newFen);
      fenHistoryRef.current.push(newFen);
      setChessPosition(newFen);
    },
    [addMove]
  );

  useEffect(() => {
    engine.current = new Worker("/stockfish.js");
    engine.current.postMessage("uci");
    engine.current.postMessage("isready");

    engine.current.onmessage = (event) => {
      const message = event.data;
      if (message.startsWith("bestmove")) {
        const bestMove = message.split(" ")[1];
        const game = chessGameRef.current;

        if (game.turn() !== playerColor && isStarted) {
          try {
            const move = game.move({
              from: bestMove.slice(0, 2),
              to: bestMove.slice(2, 4),
              promotion: "q",
            });
            if (move) {
              updateGameHistory(move.san);
            }
          } catch (e) {
            console.error(e);
          }
        }
      }
    };
    return () => engine.current?.terminate();
  }, [isStarted, playerColor, updateGameHistory]);

  const makeAiMove = useCallback(() => {
    const game = chessGameRef.current;
    if (!engine.current || game.isGameOver() || game.turn() === playerColor)
      return;

    engine.current.postMessage(
      `setoption name Skill Level value ${selectedDifficulty}`
    );
    engine.current.postMessage(`position fen ${game.fen()}`);
    engine.current.postMessage("go movetime 1000");
  }, [playerColor, selectedDifficulty]);

  useEffect(() => {
    const game = chessGameRef.current;
    const isAtLatestMove = currentNode.children.length === 0;

    if (isStarted && game.turn() !== playerColor && isAtLatestMove) {
      setTimeout(makeAiMove, 500);
    }
  }, [chessPosition, isStarted, playerColor, makeAiMove, currentNode]);

  const onPieceDrop = useCallback(
    ({ sourceSquare, targetSquare }) => {
      const game = chessGameRef.current;
      if (currentNode.children.length > 0) return false;
      if (!isStarted || game.isGameOver() || game.turn() !== playerColor)
        return false;

      try {
        const move = game.move({
          from: sourceSquare,
          to: targetSquare,
          promotion: "q",
        });
        if (!move) return false;
        updateGameHistory(move.san);
        return true;
      } catch {
        return false;
      }
    },
    [isStarted, playerColor, currentNode, updateGameHistory]
  );

  function handleStartGame() {
    chessGameRef.current.reset();
    resetNavigation(chessGameRef.current.fen());
    fenHistoryRef.current = [chessGameRef.current.fen()];
    setChessPosition(chessGameRef.current.fen());

    let finalColor = selectedColor;
    if (finalColor === "random") finalColor = Math.random() > 0.5 ? "w" : "b";
    setPlayerColor(finalColor);
    setIsStarted(true);

    if (finalColor === "b") setTimeout(makeAiMove, 500);
  }

  function handleStopGame() {
    setIsStarted(false);
    chessGameRef.current.reset();
    resetNavigation();
    setChessPosition(chessGameRef.current.fen());
  }

  function handleResign() {
    alert("You resigned! The AI wins.");
    setIsStarted(false);
  }

  // 5. Memoize Options để tránh lỗi render vô hạn
  const chessboardOptions = useMemo(() => {
    return {
      position: chessPosition,
      onPieceDrop: onPieceDrop,
      id: "PlayVsAI",
      boardOrientation: playerColor === "b" ? "black" : "white",
      customBoardStyle: {
        borderRadius: "4px",
        boxShadow: "0 2px 10px rgba(0, 0, 0, 0.5)",
      },
      lightSquareStyle: { backgroundColor: themeColors.white },
      darkSquareStyle: { backgroundColor: themeColors.black },
    };
  }, [chessPosition, onPieceDrop, playerColor, themeColors]);

  const renderSetupOptions = () => (
    <div className={styles["option-board"]}>
      <h3>Sức mạnh</h3>
      <div className={styles.difficultySelector}>
        {difficultyLevels.map((item) => (
          <button
            key={item.ui}
            onClick={() => setSelectedDifficulty(item.skill)}
            className={clsx({
              [styles.active]: selectedDifficulty === item.skill,
            })}
          >
            {item.ui}
          </button>
        ))}
      </div>

      <h3 className={styles.headingMarginTop}>Your Side</h3>
      <div className={styles.colorSelector}>
        <button
          onClick={() => setSelectedColor("w")}
          className={clsx({ [styles.active]: selectedColor === "w" })}
        >
          <i className={clsx("fa-solid", "fa-chess-king", styles.iconWhite)} />
        </button>
        <button
          onClick={() => setSelectedColor("random")}
          className={clsx({ [styles.active]: selectedColor === "random" })}
        >
          <i className={clsx("fa-solid", "fa-chess-king", styles.iconRandom)} />
        </button>
        <button
          onClick={() => setSelectedColor("b")}
          className={clsx({ [styles.active]: selectedColor === "b" })}
        >
          <i className={clsx("fa-solid", "fa-chess-king", styles.iconBlack)} />
        </button>
      </div>
    </div>
  );

  return (
    <div className={styles.wrapper}>
      <div className={clsx("row", "gx-6", "justify-content-center")}>
        <div className="col-3" />
        <div className="col-5">
          <div className={styles.board}>
            <Chessboard options={chessboardOptions} />
          </div>
        </div>

        <div className={clsx("col-3", "align-self-center")}>
          <div className={styles.container}>
            <div className={styles["board-heading"]}>
              <h2>{isStarted ? "Chơi với máy" : "Thiết lập ván đấu"}</h2>
            </div>

            <div className={styles["board-body"]}>
              {isStarted ? (
                <MoveBoard
                  rootNode={rootNode}
                  currentNode={currentNode}
                  onNavigate={handleNavigation}
                  showVariations={false}
                />
              ) : (
                renderSetupOptions()
              )}
            </div>

            <div className={styles["board-footer"]}>
              {isStarted ? (
                <div className={styles.gameControls}>
                  <button onClick={handleStopGame}>
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                  <button onClick={handleResign} title="Đầu hàng">
                    <i className="fa-solid fa-flag"></i>
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleStartGame}
                  className={styles.buttonStart}
                >
                  <i
                    className={clsx("fa-solid", "fa-microchip", styles.icon)}
                  />
                  <span>CHƠI</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PlayAI;
