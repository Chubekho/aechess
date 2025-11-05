import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router";
import { useSocket } from "@/context/SocketContext";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";

// MỚI: Import các component con

import styles from "./GamePage.module.scss";
import clsx from "clsx";
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
  const [gameData, setGameData] = useState(null); // Sẽ chứa { whitePlayer, blackPlayer, config }
  const [gameStatus, setGameStatus] = useState("waiting"); // waiting | playing | gameOver
  const [clocks, setClocks] = useState({ w: 0, b: 0 }); // Thời gian (tính bằng giây)
  const [moveHistory, setMoveHistory] = useState([]);
  const [lastMove, setLastMove] = useState(null);

  // Component Đồng hồ (Clock)
  // Server sẽ gửi thời gian CHUẨN sau mỗi nước đi
  useEffect(() => {
    if (gameStatus !== "playing") return;

    const timer = setInterval(() => {
      // Luôn lấy lượt đi (turn) MỚI NHẤT từ ref
      const turn = gameRef.current.turn();

      setClocks((prevClocks) => {
        if (turn === "w") {
          return { ...prevClocks, w: prevClocks.w > 0 ? prevClocks.w - 1 : 0 };
        } else {
          return { ...prevClocks, b: prevClocks.b > 0 ? prevClocks.b - 1 : 0 };
        }
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameStatus]); // Chỉ phụ thuộc vào gameStatus

  // === 1. KẾT NỐI VÀ LẮNG NGHE SOCKET ===
  useEffect(() => {
    if (!socket) return;

    // (Logic `joinRoom` của bạn giữ nguyên)
    // Client gửi 'joinRoom'
    socket.emit("joinRoom", { gameId }, (response) => {
      if (response.error) {
        alert(response.error);
        navigate("/");
      } else {
        // Gán màu ngay khi join
        setMyColor(response.assignedColor);

        // NẾU LÀ HOST (hoặc F5)
        // Server sẽ gửi trạng thái hiện tại ngay lập tức
        if (
          response.status === "playing" ||
          response.status === "waiting_as_host"
        ) {
          gameRef.current.load(response.fen);
          setFen(response.fen);
          setClocks(response.clocks);
          setGameData({
            config: response.config,
            whitePlayer: response.whitePlayer,
            blackPlayer: response.blackPlayer,
          });
          setMoveHistory(gameRef.current.history());

          // Nếu game đã 'playing' (ví dụ: F5), kích hoạt game
          if (response.status === "playing") {
            setGameStatus("playing");
          }
        }
      }
    });

    // Lắng nghe server báo "Game Bắt đầu"
    socket.on("gameStart", (data) => {
      console.log("Game Bắt đầu!", data);

      // 6. SỬA: Cập nhật ref và state
      gameRef.current.load(data.fen); // Cập nhật "não"
      setGameData(data);
      setFen(data.fen);

      const baseTimeInSeconds = (data.config.time.base || 10) * 60;
      setClocks({ w: baseTimeInSeconds, b: baseTimeInSeconds });

      setGameStatus("playing");
      setMoveHistory([]);
      setLastMove(null);
    });

    // Lắng nghe "Nước đi đã được thực hiện"
    socket.on("movePlayed", ({ newFen, lastMove, clocks: serverClocks }) => {
      // 7. SỬA: Cập nhật ref và state
      gameRef.current.load(newFen); // Cập nhật "não"
      setFen(newFen);
      setLastMove(lastMove);
      setMoveHistory(gameRef.current.history());
      setClocks(serverClocks);
    });

    // Lắng nghe lỗi
    socket.on("error", (message) => {
      alert(message);
    });

    // Lắng nghe game tàn
    socket.on("gameOver", (data) => {
      alert(`Game tàn! ${data.result}`);
    });

    return () => {
      // (Dọn dẹp listeners)
      socket.off("gameStart");
      socket.off("movePlayed");
      socket.off("error");
      socket.off("gameOver");
    };
  }, [socket, gameId, navigate]); // Thêm 'game' vào dependencies

  // === 2. XỬ LÝ KHI NGƯỜI CHƠI ĐI CỜ ===
  const onPieceDrop = useCallback(
    ({ sourceSquare, targetSquare }) => {
      if (!socket || gameStatus !== "playing") {
        return false;
      }

      // Sửa lỗi: Chỉ cho đi khi đúng lượt
      if (gameRef.current.turn() !== myColor) {
        return false;
      }

      let move = null;

      try {
        // 9. SỬA: Thực hiện nước đi TRỰC TIẾP trên ref (không cần copy)
        move = gameRef.current.move({
          from: sourceSquare,
          to: targetSquare,
          promotion: "q",
        });
      } catch (e) {
        console.log(e);

        return false; // Nước đi sai
      }

      if (move === null) return false;

      // Gửi nước đi hợp lệ lên server
      socket.emit("makeMove", {
        gameId: gameId,
        move: { from: sourceSquare, to: targetSquare },
      });

      // Cập nhật UI ngay lập tức
      setFen(gameRef.current.fen());
      setMoveHistory(gameRef.current.history());
      setLastMove(move.san);

      return true;
    },
    [socket, myColor, gameId, gameStatus]
  );

  // === 3. XỬ LÝ NÚT BẤM (Đầu hàng, Cầu hòa) ===
  const handleResign = () => {
    if (socket) {
      socket.emit("resign", { gameId });
    }
  };

  // === Tách biệt thông tin người chơi ===
  const me =
    gameData && myColor
      ? myColor === "w"
        ? gameData.whitePlayer
        : gameData.blackPlayer
      : null; // Player data của tôi

  const opponent =
    gameData && myColor
      ? myColor === "w"
        ? gameData.blackPlayer
        : gameData.whitePlayer
      : null; // Player data của đối thủ

  const opponentColor = myColor === "w" ? "b" : "w";

  // Gán options
  const chessboardOptions = useMemo(
    () => ({
      position: fen,
      onPieceDrop: onPieceDrop,
      id: "PlayVsAI",
      boardOrientation: myColor === "b" ? "black" : "white",
    }),
    [fen, onPieceDrop, myColor]
  );

  return (
    <div className={clsx(styles.wrapper, "row", "gx-5")}>
      <div className="col-3" />

      {/* CỘT TRÁI: BÀN CỜ */}
      <div className={clsx("col-5", styles.boardArea)}>
        {/* 13. SỬA: Truyền clock an toàn hơn */}
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

      {/* CỘT PHẢI: BẢNG THÔNG TIN */}
      <div className={clsx("col-3", styles.panelArea)}>
        <GameInfoPanel
          moveHistory={moveHistory}
          lastMove={lastMove}
          onResign={handleResign}
          // (Thêm onOfferDraw...)
        />
      </div>
    </div>
  );
}

export default GamePage;
