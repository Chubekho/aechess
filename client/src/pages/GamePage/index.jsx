import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router";
import { useSocket } from "@/context/SocketContext";
import { useGameNavigation } from "@/hooks/index";

import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import clsx from "clsx";
import styles from "./GamePage.module.scss";

import PlayerInfoBox from "@/components/PlayerInfoBox";
import GameInfoPanel from "@/components/GameInfoPanel";

function GamePage() {
  const { gameId } = useParams();
  const socket = useSocket();
  const navigate = useNavigate();

  // --- State của Game ---
  const gameRef = useRef(new Chess());
  const [fen, setFen] = useState(gameRef.current.fen());
  const [myColor, setMyColor] = useState(null);

  // State cho thông tin ván đấu
  const [gameData, setGameData] = useState(null);
  const [gameStatus, setGameStatus] = useState("waiting");
  const [clocks, setClocks] = useState({ w: 0, b: 0 });

  const [moveHistory, setMoveHistory] = useState([]);
  const [lastMove, setLastMove] = useState(null);

  const fenHistoryRef = useRef([new Chess().fen()]);

  const {
    currentMoveIndex,
    setCurrentMoveIndex, // Cần dùng khi reset game
    handleNavigation,
    snapToEnd,
  } = useGameNavigation(fenHistoryRef, moveHistory, setFen, setLastMove);

  // --- 1. Component Đồng hồ (Clock) ---
  useEffect(() => {
    if (gameStatus !== "playing") return;
    const timer = setInterval(() => {
      const turn = gameRef.current.turn();
      setClocks((prev) => {
        const next = { ...prev };
        if (turn === "w") next.w = prev.w > 0 ? prev.w - 1 : 0;
        else next.b = prev.b > 0 ? prev.b - 1 : 0;
        return next;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [gameStatus]);

  // --- 2. Helper update state ---
  const updateGameStateFull = useCallback(
    (data) => {
      // A. Load Logic Cờ
      // Ưu tiên PGN nếu có (khi F5), nếu không thì dùng FEN (khi start game)
      if (data.pgn) {
        try {
          gameRef.current.loadPgn(data.pgn);
        } catch (e) {
          console.error("Lỗi PGN:", e);
        }
      } else if (data.fen) {
        gameRef.current.load(data.fen);
      }

      // B. Cập nhật State UI
      const currentFen = gameRef.current.fen();
      setFen(currentFen);

      // C. Cập nhật Lịch sử
      const historyVerbose = gameRef.current.history({ verbose: true });
      const fens = historyVerbose.map((move) => move.after);
      fenHistoryRef.current = [new Chess().fen(), ...fens]; // Reset ref với lịch sử mới

      const moves = gameRef.current.history();
      setMoveHistory(moves);

      // D. Dùng hàm của Hook để đưa về cuối
      // (Thay vì tự setIndex và setLastMove thủ công)
      // Lưu ý: snapToEnd cần dữ liệu mới nhất, nhưng vì nó dùng ref nên an toàn
      // Tuy nhiên, lastMove cần được set thủ công 1 lần ở đây vì snapToEnd dựa vào moveHistory state (có thể chưa cập nhật kịp)
      setLastMove(historyVerbose[historyVerbose.length - 1]?.san || null);
      // Chúng ta set index trực tiếp để tránh độ trễ của state
      setCurrentMoveIndex(moves.length);

      // E. Cập nhật Thông tin Game (nếu có)
      if (data.whitePlayer && data.blackPlayer && data.config) {
        setGameData({
          config: data.config,
          whitePlayer: data.whitePlayer,
          blackPlayer: data.blackPlayer,
        });
      }

      // F. Cập nhật Đồng hồ (QUAN TRỌNG: Đồng bộ ngay lập tức)
      if (data.clocks) {
        setClocks(data.clocks);
      } else if (data.config?.time) {
        // Fallback: Nếu không có clocks hiện tại, dùng base time
        const baseTime = (data.config.time.base || 10) * 60;
        setClocks({ w: baseTime, b: baseTime });
      }

      // G. Cập nhật Trạng thái
      if (data.status === "playing" || (!data.status && moves.length >= 0)) {
        // Logic đơn giản: nếu đã load game xong thì coi như playing
        setGameStatus("playing");
      }
    },
    [setCurrentMoveIndex]
  );

  // === 3. KẾT NỐI VÀ LẮNG NGHE SOCKET ===
  useEffect(() => {
    if (!socket) return;

    // A. Join Room (Xử lý F5 / Reconnect)
    socket.emit("joinRoom", { gameId }, (response) => {
      if (response.error) {
        alert(response.error);
        navigate("/");
      } else {
        setMyColor(response.assignedColor);
        if (
          response.status === "playing" ||
          response.status === "waiting_as_host"
        ) {
          updateGameStateFull({
            pgn: response.pgn,
            fen: response.fen,
            clocks: response.clocks,
            whitePlayer: response.whitePlayer,
            blackPlayer: response.blackPlayer,
            config: response.config,
            status: response.status,
          });
        }
      }
    });

    // B. Game Start (Bắt đầu trận mới)
    socket.on("gameStart", (data) => {
      console.log("Game Bắt đầu!", data);
      gameRef.current = new Chess();
      updateGameStateFull({ ...data, status: "playing" });
    });

    // C. Move Played (Nước đi đối thủ)
    socket.on(
      "movePlayed",
      ({ newFen, lastMove, clocks: serverClocks, moverSocketId }) => {
        if (socket.id === moverSocketId) {
          setClocks(serverClocks);
          return;
        }

        gameRef.current.load(newFen);
        setFen(newFen);
        setClocks(serverClocks);

        setMoveHistory((prev) => [...prev, lastMove]);
        setLastMove(lastMove);

        // Cập nhật lịch sử cho hook
        fenHistoryRef.current.push(newFen);
        // Dùng hàm của hook để tua về cuối
        snapToEnd();
      }
    );

    socket.on("error", (message) => alert(message));
    socket.on("gameOver", (data) => {
      alert(`Game tàn! ${data.result}`);
      setGameStatus("gameOver");
    });

    return () => {
      socket.off("gameStart");
      socket.off("movePlayed");
      socket.off("error");
      socket.off("gameOver");
    };
  }, [socket, gameId, navigate, updateGameStateFull, snapToEnd]);

  // === 4. XỬ LÝ KHI NGƯỜI CHƠI ĐI CỜ ===
  const onPieceDrop = useCallback(
    ({ sourceSquare, targetSquare }) => {
      // Dùng currentMoveIndex từ Hook
      if (gameStatus !== "playing" || currentMoveIndex !== fenHistoryRef.current.length - 1) {
        return false;
      }
      if (gameRef.current.turn() !== myColor) return false;

      const gameCopy = new Chess(gameRef.current.fen());
      const move = gameCopy.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: "q",
      });

      if (move === null) return false;

      socket.emit("makeMove", {
        gameId: gameId,
        move: { from: sourceSquare, to: targetSquare },
      });

      // Cập nhật Client
      gameRef.current.load(gameCopy.fen());
      setFen(gameRef.current.fen());
      setMoveHistory((prev) => [...prev, move.san]);
      
      // Cập nhật lịch sử cho Hook
      fenHistoryRef.current.push(gameRef.current.fen());
      // Dùng hàm của hook
      snapToEnd();
      // Cần setLastMove thủ công vì snapToEnd dựa vào moveHistory cũ trong render này
      setLastMove(move.san);

      return true;
    },
    [socket, myColor, gameId, gameStatus, currentMoveIndex, snapToEnd]
  );

  // === 5. CÁC HANDLERS KHÁC ===
  const handleResign = () => {
    if (socket) socket.emit("resign", { gameId });
  };

  // === 6. RENDER ===
  const me =
    gameData && myColor
      ? myColor === "w"
        ? gameData.whitePlayer
        : gameData.blackPlayer
      : null;
  const opponent =
    gameData && myColor
      ? myColor === "w"
        ? gameData.blackPlayer
        : gameData.whitePlayer
      : null;
  const opponentColor = myColor === "w" ? "b" : "w";

  const chessboardOptions = useMemo(
    () => ({
      position: fen,
      onPieceDrop: onPieceDrop,
      id: "PlayVsPerson",
      boardOrientation: myColor === "b" ? "black" : "white",
    }),
    [fen, onPieceDrop, myColor]
  );

  return (
    <div className={clsx(styles.wrapper, "row", "gx-5")}>
      <div className={clsx("col-3", styles["col-height"])} />
      <div className={clsx("col-5", styles.boardArea, styles["col-height"])}>
        <PlayerInfoBox
          player={opponent}
          clock={clocks[opponentColor]}
          isTurn={
            gameStatus === "playing" && gameRef.current.turn() === opponentColor
          }
        />
        <div className={styles.board}>
          <Chessboard options={chessboardOptions} />
        </div>
        <PlayerInfoBox
          player={me}
          clock={clocks[myColor]}
          isTurn={
            gameStatus === "playing" && gameRef.current.turn() === myColor
          }
        />
      </div>
      <div className={clsx("col-3", styles.panelArea, styles["col-height"])}>
        <GameInfoPanel
          moveHistory={moveHistory}
          lastMove={lastMove}
          onResign={handleResign}
          gameStatus={gameStatus}
          onNavigate={handleNavigation}
          currentMoveIndex={currentMoveIndex}
        />
      </div>
    </div>
  );
}

export default GamePage;
