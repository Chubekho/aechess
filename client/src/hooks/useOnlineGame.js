import { useState, useEffect, useRef, useCallback } from "react";
import { Chess } from "chess.js";
import { useSocket } from "@/context/SocketContext";
import { useNavigate } from "react-router";

export const useOnlineGame = (
  fen,
  setFen,
  gameId,
  addMove,
  resetNavigation,
  loadHistory
) => {
  const socket = useSocket();
  const navigate = useNavigate();
  const gameRef = useRef(new Chess());

  const [myColor, setMyColor] = useState(null);
  const [isSpectator, setIsSpectator] = useState(false);
  const [gameStatus, setGameStatus] = useState("waiting");
  const [clocks, setClocks] = useState({ w: 0, b: 0 });
  const [gameData, setGameData] = useState(null);
  const [gameResult, setGameResult] = useState(null);

  useEffect(() => {
    if (gameStatus !== "playing") return;

    const timer = setInterval(() => {
      // Lấy lượt đi hiện tại từ ref để đảm bảo chính xác nhất
      const turn = gameRef.current.turn();

      setClocks((prev) => {
        const next = { ...prev };
        if (turn === "w") {
          // Giảm time trắng, không dưới 0
          next.w = Math.max(0, prev.w - 1);
        } else {
          // Giảm time đen, không dưới 0
          next.b = Math.max(0, prev.b - 1);
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameStatus]); // Chạy lại khi trạng thái game thay đổi

  // Helper sync (Internal)
  const syncGameFromServer = useCallback(
    (data) => {
      // 1. Load logic cờ
      if (data.pgn) {
        gameRef.current.loadPgn(data.pgn);
      } else {
        gameRef.current.load(data.fen);
      }

      // 2. Xây dựng lại Tree cho MoveBoard
      // Reset về đầu
      resetNavigation();
      // Replay lại toàn bộ lịch sử vào Tree
      const historyVerbose = gameRef.current.history({ verbose: true });
      if (loadHistory) {
        loadHistory(historyVerbose);
      }

      // 3. Cập nhật các thông tin khác
      setFen(gameRef.current.fen());
      if (data.clocks) setClocks(data.clocks);

      if (data.whitePlayer) {
        setGameData({
          config: data.config,
          whitePlayer: data.whitePlayer,
          blackPlayer: data.blackPlayer,
        });
      }

      if (data.status === "playing") setGameStatus("playing");
    },
    [setFen, resetNavigation, loadHistory]
  );

  // Logic Socket
  useEffect(() => {
    if (!socket) return;
    // A. Join Room (Xử lý F5 / Reconnect)
    socket.emit("joinRoom", { gameId }, (response) => {
      if (response.error) {
        alert(response.error);
        navigate("/");
      } else {
        if (response.role === "spectator") {
          setIsSpectator(true);
          setMyColor(null); // Spectator không có màu phe
          console.log("Joined as Spectator");
        } else {
          setIsSpectator(false);
          setMyColor(response.assignedColor);
        }

        // Sync data cho cả Player và Spectator
        if (
          response.status === "playing" ||
          response.status === "waiting_as_host"
        ) {
          syncGameFromServer({ ...response });
        }
      }
    });

    // B. Game Start (Bắt đầu trận mới)
    socket.on("gameStart", (data) => {
      console.log("Game Bắt đầu!", data);
      gameRef.current = new Chess();
      syncGameFromServer({ ...data, status: "playing" });
    });

    // C. Move Played (Nước đi đối thủ)
    socket.on(
      "movePlayed",
      ({ newFen, lastMove, clocks: serverClocks, moverSocketId }) => {
        if (!isSpectator && socket.id === moverSocketId) {
          setClocks(serverClocks);
          return;
        }

        gameRef.current.load(newFen);
        addMove(lastMove, newFen);
        setFen(newFen);
        setClocks(serverClocks);
      }
    );

    socket.on("error", (message) => alert(message));
    socket.on("gameOver", (data) => {
      setGameStatus("gameOver");
      if (isSpectator) console.log("Trận đấu kết thúc", data.result);
      setGameResult(data);
    });

    return () => {
      socket.off("gameStart");
      socket.off("movePlayed");
      socket.off("error");
      socket.off("gameOver");
    };
  }, [
    socket,
    gameId,
    navigate,
    syncGameFromServer,
    addMove,
    setFen,
    isSpectator,
  ]);

  // Logic Make Move (Wrapper)
  const makeMove = useCallback(
    ({ sourceSquare, targetSquare }) => {
      // Chặn Spectator đi cờ
      if (isSpectator) return false;
      // Validate move
      if (gameRef.current.turn() !== myColor) {
        console.log("not your turrn");
        return false;
      }
      const gameCopy = new Chess(gameRef.current.fen());
      try {
        const move = gameCopy.move({
          from: sourceSquare,
          to: targetSquare,
          promotion: "q",
        });

        if (move === null) {
          console.log("move === null");

          return false;
        }
        socket.emit("makeMove", {
          gameId: gameId,
          move: { from: sourceSquare, to: targetSquare },
        });
        // Cập nhật Client
        gameRef.current.load(gameCopy.fen());
        addMove(move.san, gameCopy.fen());
        setFen(gameRef.current.fen());

        return true;
      } catch (e) {
        console.log(e);
        return false;
      }
    },
    [myColor, socket, addMove, gameId, setFen, isSpectator]
  );

  return {
    myColor,
    gameStatus,
    clocks,
    gameData,
    gameRef,
    gameResult,
    makeMove,
    isSpectator,
  };
};
