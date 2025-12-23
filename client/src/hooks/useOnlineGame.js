//client/src/hooks/useOnlineGame.js
import { useState, useEffect, useRef, useCallback } from "react";
import { Chess } from "chess.js";
import { useSocket,useToast } from "@/hooks/index";
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
  const toast = useToast();


  const [myColor, setMyColor] = useState(null);
  const [isSpectator, setIsSpectator] = useState(false);
  const [gameStatus, setGameStatus] = useState("waiting");
  const [clocks, setClocks] = useState({ w: 0, b: 0 });
  const [gameData, setGameData] = useState(null);
  const [gameResult, setGameResult] = useState(null);
  const [drawStatus, setDrawStatus] = useState("idle"); // 'idle' | 'offered_by_me' | 'offered_to_me'
  const [rematchStatus, setRematchStatus] = useState("idle"); // 'idle' | 'offered_by_me' | 'offered_to_me'

  // --- 1. LOGIC ĐỒNG HỒ ---
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
  }, [gameStatus]);

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
          setGameStatus(response.status);
        }
      }
    });

    // B. Game Start & Restart
    const handleGameStart = (data) => {
      console.log("Game Start/Restart!", data);
      gameRef.current = new Chess(); // Reset logic cờ

      // Reset các trạng thái UI
      setGameStatus("playing");
      setGameResult(null);
      setDrawStatus("idle");
      setRematchStatus("idle");

      syncGameFromServer(data);
    };

    socket.on("gameStart", handleGameStart);
    socket.on("gameRestarted", handleGameStart);

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

    // D. Game Over
    socket.on("gameOver", (data) => {
      setGameStatus("gameOver");
      setGameResult(data);
    });

    // E. Interaction Events (Draw)
    socket.on("drawOffered", () => setDrawStatus("offered_to_me"));
    socket.on("drawDeclined", () => {
      setDrawStatus("idle");
      toast.error("Đối thủ từ chối hòa.");
    });

    // F. Rematch
    socket.on("rematchOffered", () => setRematchStatus("offered_to_me"));
    socket.on("rematchDeclined", () => {
      setRematchStatus("idle");
      toast.error("Đối thủ từ chối tái đấu.");
    });

    // G. Error
    socket.on("error", (message) => alert(message));

    return () => {
      socket.off("gameStart");
      socket.off("gameRestarted");
      socket.off("movePlayed");
      socket.off("gameOver");
      socket.off("drawOffered");
      socket.off("drawDeclined");
      socket.off("rematchOffered");
      socket.off("rematchDeclined");
      socket.off("error");
    };
  }, [
    socket,
    gameId,
    navigate,
    syncGameFromServer,
    addMove,
    setFen,
    isSpectator,
    toast
  ]);

  // --- 4. ACTION HANDLERS (Export ra để UI dùng) ---
  const handleResign = () => {
    if (socket) socket.emit("resign", { gameId });
  };

  // Draw Handlers
  const handleOfferDraw = () => {
    if (socket) {
      socket.emit("offerDraw", { gameId });
      setDrawStatus("offered_by_me");
    }
  };
  const handleAcceptDraw = () => {
    if (socket) {
      socket.emit("acceptDraw", { gameId });
      setDrawStatus("idle");
    }
  };
  const handleDeclineDraw = () => {
    if (socket) {
      socket.emit("declineDraw", { gameId });
      setDrawStatus("idle");
    }
  };

  // Rematch Handlers
  const handleOfferRematch = () => {
    if (socket) {
      socket.emit("offerRematch", { gameId });
      setRematchStatus("offered_by_me");
    }
  };
  const handleAcceptRematch = () => {
    if (socket) {
      socket.emit("acceptRematch", { gameId });
    }
  };
  const handleDeclineRematch = () => {
    if (socket) {
      socket.emit("declineRematch", { gameId });
      setRematchStatus("idle");
    }
  };

  // Logic Make Move (Wrapper)
  const makeMove = useCallback(
    ({ sourceSquare, targetSquare }) => {
      // Chặn Spectator đi cờ
      if (isSpectator) return false;
      // Validate move
      if (gameRef.current.turn() !== myColor) {
        return false;
      }

      const gameCopy = new Chess(gameRef.current.fen());
      try {
        const move = gameCopy.move({
          from: sourceSquare,
          to: targetSquare,
          promotion: "q",
        });

        if (!move) {
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
    drawStatus,
    rematchStatus,
    handlers: {
      handleResign,
      handleOfferDraw,
      handleAcceptDraw,
      handleDeclineDraw,
      handleOfferRematch,
      handleAcceptRematch,
      handleDeclineRematch,
    },
  };
};
