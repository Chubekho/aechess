import { useEffect, useRef, useState } from "react";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";
import clsx from "clsx";
import styles from "./PlayAI.module.scss";
import MoveBoard from "../../components/MoveBoard";

// Ánh xạ 8 level UI → Skill Level Stockfish (0-15)
const difficultyLevels = [
  { ui: 1, skill: 1 },  // Dễ
  { ui: 2, skill: 3 },
  { ui: 3, skill: 5 },
  { ui: 4, skill: 7 },  // Trung bình
  { ui: 5, skill: 9 },
  { ui: 6, skill: 11 },
  { ui: 7, skill: 13 }, // Khó
  { ui: 8, skill: 15 },
];

function PlayAI() {
  const chessGameRef = useRef(new Chess());
  const chessGame = chessGameRef.current;
  const engine = useRef(null);

  const [chessPosition, setChessPosition] = useState(chessGame.fen());
  const [moveHistory, setMoveHistory] = useState([]);
  const [lastMove, setLastMove] = useState(null);

  const [isStarted, setIsStarted] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState(5); // skill default
  const [selectedColor, setSelectedColor] = useState("w");
  const [playerColor, setPlayerColor] = useState("w");

  // Khởi tạo engine
  useEffect(() => {
    engine.current = new Worker("/stockfish.js");
    engine.current.postMessage("uci");
    engine.current.postMessage("isready");
    return () => engine.current?.terminate();
  }, []);

  // Engine lắng nghe bestmove
  useEffect(() => {
    if (!engine.current) return;
    engine.current.onmessage = (event) => {
      const message = event.data;
      if (message.startsWith("bestmove")) {
        const bestMove = message.split(" ")[1];
        if (chessGame.turn() !== playerColor && isStarted) {
          const move = chessGame.move({
            from: bestMove.slice(0, 2),
            to: bestMove.slice(2, 4),
            promotion: "q",
          });
          if (move) {
            setChessPosition(chessGame.fen());
            setLastMove(move.san);
            setMoveHistory(chessGame.history());
          }
        }
      }
    };
  }, [chessGame, isStarted, playerColor]);

  function makeAiMove() {
    if (
      !engine.current ||
      chessGame.isGameOver() ||
      chessGame.turn() === playerColor
    )
      return;

    engine.current.postMessage(
      `setoption name Skill Level value ${selectedDifficulty}`
    );
    engine.current.postMessage(`position fen ${chessGame.fen()}`);
    engine.current.postMessage("go movetime 1000");
  }

  function onPieceDrop({ sourceSquare, targetSquare }) {
    if (
      !isStarted ||
      !targetSquare ||
      chessGame.turn() !== playerColor ||
      chessGame.isGameOver()
    )
      return false;

    const move = chessGame.move({
      from: sourceSquare,
      to: targetSquare,
      promotion: "q",
    });

    if (!move) return false;

    setChessPosition(chessGame.fen());
    setMoveHistory(chessGame.history());
    setLastMove(move.san);

    if (!chessGame.isGameOver()) setTimeout(makeAiMove, 300);

    return true;
  }

  function handleStartGame() {
    chessGame.reset();
    setMoveHistory([]);
    setLastMove(null);

    let finalColor = selectedColor;
    if (finalColor === "random") finalColor = Math.random() > 0.5 ? "w" : "b";
    setPlayerColor(finalColor);
    setIsStarted(true);
    setChessPosition(chessGame.fen());

    if (finalColor === "b") setTimeout(makeAiMove, 500);
  }

  function handleStopGame() {
    setIsStarted(false);
    chessGame.reset();
    setChessPosition(chessGame.fen());
    setMoveHistory([]);
    setLastMove(null);
  }

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

      <h3 className={styles.headingMarginTop}>Bạn cầm quân</h3>
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
        <div className="col-4">
          <div className={styles.board}>
            <Chessboard
              options={{
                position: chessPosition,
                onPieceDrop,
                id: "PlayVsAI",
                boardOrientation: playerColor === "b" ? "black" : "white",
              }}
            />
          </div>
        </div>

        <div className={clsx("col-3", "align-self-center", styles["side-board"])}>
          <div className={styles.container}>
            <div className={styles["board-heading"]}>
              <h2>{isStarted ? "Chơi với máy" : "Thiết lập ván đấu"}</h2>
            </div>

            <div className={styles["board-body"]}>
              {isStarted ? (
                <MoveBoard history={moveHistory} lastMove={lastMove} />
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
                  <button>1/2</button>
                  <button onClick={() => alert("Bạn đã đầu hàng!")}>
                    <i className="fa-solid fa-flag"></i>
                  </button>
                </div>
              ) : (
                <button onClick={handleStartGame} className={styles.buttonStart}>
                  <i className={clsx("fa-solid", "fa-microchip", styles.icon)} />
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
