import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";
import clsx from "clsx";
import styles from "./PlayAI.module.scss";
import MoveBoard from "@/components/MoveBoard";
import { useGameNavigation } from "@/hooks/index";

// Ánh xạ 8 level UI → Skill Level Stockfish (0-15)
const difficultyLevels = [
  { ui: 1, skill: 1 }, // Dễ
  { ui: 2, skill: 3 },
  { ui: 3, skill: 5 },
  { ui: 4, skill: 7 }, // Trung bình
  { ui: 5, skill: 9 },
  { ui: 6, skill: 11 },
  { ui: 7, skill: 13 }, // Khó
  { ui: 8, skill: 15 },
];

function PlayAI() {
  const chessGameRef = useRef(new Chess());
  const engine = useRef(null);

  const [chessPosition, setChessPosition] = useState(
    chessGameRef.current.fen()
  );
  const [moveHistory, setMoveHistory] = useState([]);
  const [lastMove, setLastMove] = useState(null);

  const fenHistoryRef = useRef([chessGameRef.current.fen()]);
  const {
    currentMoveIndex,
    setCurrentMoveIndex, // Cần để reset khi start game
    handleNavigation,
    snapToEnd,
  } = useGameNavigation(
    fenHistoryRef,
    moveHistory,
    setChessPosition,
    setLastMove
  );

  const [isStarted, setIsStarted] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState(5); // skill default
  const [selectedColor, setSelectedColor] = useState("w");
  const [playerColor, setPlayerColor] = useState("w");

  // Helper: Cập nhật trạng thái game và lịch sử (Dùng chung cho cả AI và Player)
  const updateGameHistory = (moveSan) => {
    const newFen = chessGameRef.current.fen();

    // 1. Cập nhật FEN History
    fenHistoryRef.current.push(newFen);

    // 2. Cập nhật Move History
    setMoveHistory((prev) => [...prev, moveSan]);

    // 3. Cập nhật Last Move
    setLastMove(moveSan);

    // 4. Cập nhật vị trí bàn cờ
    setChessPosition(newFen);

    // 5. Snap thanh điều hướng về cuối
    snapToEnd();
  };

  // Khởi tạo engine
  // 1. Khởi tạo Engine (Chạy 1 lần duy nhất)
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
              updateGameHistory(move.san); // <-- SỬA: Dùng helper
            }
          } catch (e) {
            console.error(e);
          }
        }
      }
    };
    return () => engine.current?.terminate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStarted, playerColor, snapToEnd]);

  // 2. Hàm yêu cầu AI đi nước cờ
  const makeAiMove = useCallback(() => {
    const game = chessGameRef.current;
    if (!engine.current || game.isGameOver() || game.turn() === playerColor)
      return;

    // Gửi lệnh cho Stockfish
    engine.current.postMessage(
      `setoption name Skill Level value ${selectedDifficulty}`
    );
    engine.current.postMessage(`position fen ${game.fen()}`);
    engine.current.postMessage("go movetime 1000"); // Suy nghĩ 1s
  }, [playerColor, selectedDifficulty]);

  // Trigger AI đi khi đến lượt (quan trọng khi người chơi cầm Đen)
  useEffect(() => {
    const game = chessGameRef.current;
    // Chỉ gọi AI nếu đang ở nước đi cuối cùng (không phải đang tua)
    if (
      isStarted &&
      game.turn() !== playerColor &&
      currentMoveIndex === fenHistoryRef.current.length - 1
    ) {
      setTimeout(makeAiMove, 500);
    }
  }, [chessPosition, isStarted, playerColor, makeAiMove, currentMoveIndex]);

  // 3. Xử lý người chơi đi cờ
  const onPieceDrop = useCallback(
    ({ sourceSquare, targetSquare }) => {
      const game = chessGameRef.current;

      if (!isStarted || game.isGameOver() || game.turn() !== playerColor)
        return false;

      try {
        const move = game.move({
          from: sourceSquare,
          to: targetSquare,
          promotion: "q",
        });

        if (!move) return false;

        updateGameHistory(move.san); // <-- SỬA: Dùng helper
        return true;
      } catch {
        return false;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isStarted, playerColor, currentMoveIndex, snapToEnd]
  );

  // 4. Các hàm điều khiển Game
  // 4. Controls
  function handleStartGame() {
    chessGameRef.current.reset();

    // Reset States
    setMoveHistory([]);
    setLastMove(null);
    fenHistoryRef.current = [chessGameRef.current.fen()]; // Reset ref
    setCurrentMoveIndex(0); // Reset index
    setChessPosition(chessGameRef.current.fen());

    let finalColor = selectedColor;
    if (finalColor === "random") finalColor = Math.random() > 0.5 ? "w" : "b";
    setPlayerColor(finalColor);
    setIsStarted(true);

    if (finalColor === "b") setTimeout(makeAiMove, 500);
  }

  function handleStopGame() {
    setIsStarted(false);
    chessGameRef.current.reset(); // Reset logic
    setChessPosition(chessGameRef.current.fen()); // Reset UI
    setMoveHistory([]);
    setLastMove(null);
  }

  function handleResign() {
    alert("Bạn đã đầu hàng! Máy thắng.");
    setIsStarted(false); // Dừng game nhưng không reset bàn cờ ngay để người chơi xem lại
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
    };
  }, [chessPosition, onPieceDrop, playerColor]);

  // --- RENDER JSX ---
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
        {/* Cột Giữa (Bàn Cờ) */}
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
                  history={moveHistory} 
                  lastMove={lastMove}
                  // MỚI: Truyền logic điều hướng xuống
                  onNavigate={handleNavigation}
                  currentMoveIndex={currentMoveIndex}
                  gameStatus={isStarted ? "playing" : "gameOver"} // Để MoveBoard biết có scroll tự động không
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
