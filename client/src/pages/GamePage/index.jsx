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

  const {
    currentNode,
    rootNode,
    handleNavigation,
    addMove,
    resetNavigation,
  } = useGameNavigation(setFen);

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

  // Helper cập nhật Game từ data server (Dùng cho Reconnect/Start)
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
      historyVerbose.forEach((move) => {
        addMove(move.san, move.after);
      });

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
    [addMove, resetNavigation]
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
          // Reconnect
          syncGameFromServer({
            ...response,
            // Nếu server gửi history dạng mảng, ta có thể dùng,
            // hoặc dùng PGN/FEN để rebuild như trong helper
          });
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
        if (socket.id === moverSocketId) {
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
      alert(`Game tàn! ${data.result}`);
      setGameStatus("gameOver");
    });

    return () => {
      socket.off("gameStart");
      socket.off("movePlayed");
      socket.off("error");
      socket.off("gameOver");
    };
  }, [socket, gameId, navigate, syncGameFromServer, addMove]);

  // === 4. XỬ LÝ KHI NGƯỜI CHƠI ĐI CỜ ===
  const onPieceDrop = useCallback(
    ({ sourceSquare, targetSquare }) => {
      // Chặn nếu đang xem lại quá khứ (currentNode không phải là con cuối cùng của nhánh)
      // Logic Tree: Nếu currentNode có children, nghĩa là ta đang ở quá khứ
      if (gameStatus !== "playing" || currentNode.children.length > 0) {
        return false;
      }
      if (gameRef.current.turn() !== myColor) return false;

      const gameCopy = new Chess(gameRef.current.fen());
      try {
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

        addMove(move.san, gameCopy.fen());

        setFen(gameRef.current.fen());

        return true;
      } catch (e) {
        console.log(e);
        return false;
      }
    },
    [socket, myColor, gameId, gameStatus, currentNode, addMove]
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

  const topPlayerSide = opponentColor === "w" ? "white" : "black";
  const bottomPlayerSide = myColor === "w" ? "white" : "black";

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
    <div className={clsx(styles.wrapper, "row", "gx-6")}>
      {/* --- CỘT 1 (3/12): THÔNG TIN NGƯỜI CHƠI --- */}
      <div className={clsx("col-3", styles.playerInfoColumn)}>
        {/* Đối thủ (Luôn ở trên) */}
        <div className={styles.playerBlock}>
          <PlayerInfoBox
            player={opponent}
            timeControl={clocks[opponentColor]} // Truyền giây còn lại vào
            variant="top"
            side={topPlayerSide}
          />
        </div>

        {/* Divider */}
        <div
          style={{
            height: "1px",
            backgroundColor: "#3a3836",
            margin: "15px 0",
            width: "60%",
          }}
        />

        {/* Mình (Luôn ở dưới) */}
        <div className={styles.playerBlock}>
          <PlayerInfoBox
            player={me}
            timeControl={clocks[myColor]} // Truyền giây còn lại vào
            variant="bottom"
            side={bottomPlayerSide}
          />
        </div>
      </div>

      <div className={clsx("col-6", styles.boardArea, styles["col-height"])}>
        
        <div className={styles.board}>
          <Chessboard options={chessboardOptions} />
        </div>
        
      </div>
      <div className={clsx("col-3", styles.panelArea, styles["col-height"])}>
        <GameInfoPanel
          rootNode={rootNode}
          currentNode={currentNode}
          onNavigate={handleNavigation}
          showVariations={false}
          onResign={handleResign}
          gameStatus={gameStatus}
        />
      </div>
    </div>
  );
}

export default GamePage;
