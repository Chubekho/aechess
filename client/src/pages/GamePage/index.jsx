import { useCallback, useMemo, useState } from "react";
import { useParams } from "react-router";
import { useSocket } from "@/context/SocketContext";
import { Chessboard } from "react-chessboard";
import clsx from "clsx";
import styles from "./GamePage.module.scss";

import { useGameNavigation, useOnlineGame } from "@/hooks/index";
import { getPlayerLayout } from "@/utils/chessUtils";

import PlayerInfoBox from "@/components/PlayerInfoBox";
import GameInfoPanel from "@/components/GameInfoPanel";
import FlipBoardButton from "@/components/FlipBoardButton";

const START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

function GamePage() {
  const { gameId } = useParams();
  const socket = useSocket();
  const [fen, setFen] = useState(START_FEN);

  // --- State của Game ---
  const {
    currentNode,
    rootNode,
    handleNavigation,
    addMove,
    resetNavigation,
    loadHistory,
  } = useGameNavigation(setFen);

  const { myColor, gameStatus, clocks, gameData, makeMove, isSpectator } =
    useOnlineGame(fen, setFen, gameId, addMove, resetNavigation, loadHistory);
  const [userOrientation, setUserOrientation] = useState(null);
  const boardOrientation = useMemo(() => {
    if (userOrientation) return userOrientation;
    if (myColor === "b") return "black";
    return "white";
  }, [userOrientation, myColor]);

  // === 4. XỬ LÝ KHI NGƯỜI CHƠI ĐI CỜ ===
  const onPieceDrop = useCallback(
    ({ sourceSquare, targetSquare }) => {
      if (isSpectator) return false;
      // Logic Tree: Nếu currentNode có children, nghĩa là ta đang ở quá khứ
      if (gameStatus !== "playing" || currentNode.children.length > 0) {
        console.log(currentNode.children);

        return false;
      }
      return makeMove({ sourceSquare, targetSquare });
    },
    [makeMove, gameStatus, currentNode.children, isSpectator]
  );

  // === 5. CÁC HANDLERS KHÁC ===
  const handleResign = () => {
    if (socket && !isSpectator) socket.emit("resign", { gameId });
  };

  const handleFlipBoard = () => {
    setUserOrientation((prev) => {
      // Nếu chưa set (null), lấy hướng hiện tại làm mốc để đảo
      const current = prev || (myColor === "b" ? "black" : "white");
      return current === "white" ? "black" : "white";
    });
  };

  // === 6. RENDER ===
  const whitePlayer = gameData?.whitePlayer;
  const blackPlayer = gameData?.blackPlayer;

  let top, bottom;

  if (isSpectator) {
    // Layout cố định cho Spectator (Trắng dưới, Đen trên)
    top = { player: blackPlayer, side: "black" };
    bottom = { player: whitePlayer, side: "white" };
  } else {
    // Layout động cho Player
    const layout = getPlayerLayout(boardOrientation, whitePlayer, blackPlayer);
    top = layout.top;
    bottom = layout.bottom;
  }

  const topClock = clocks[top.side === "white" ? "w" : "b"];
  const bottomClock = clocks[bottom.side === "white" ? "w" : "b"];

  const chessboardOptions = useMemo(
    () => ({
      position: fen,
      onPieceDrop: onPieceDrop,
      id: "PlayVsPerson",
      boardOrientation: boardOrientation,
      arePiecesDraggable: !isSpectator && gameStatus === "playing",
    }),
    [fen, onPieceDrop, boardOrientation, isSpectator, gameStatus]
  );

  return (
    <div className={clsx(styles.wrapper, "row", "gx-6")}>
      {/* --- CỘT 1 (3/12): THÔNG TIN NGƯỜI CHƠI --- */}
      <div className={clsx("col-3", styles.playerInfoColumn)}>
        {/* Đối thủ (Luôn ở trên) */}
        <div className={styles.playerBlock}>
          <PlayerInfoBox
            player={top.player}
            timeControl={topClock} // Truyền giây còn lại vào
            variant="top"
            side={top.side}
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
            player={bottom.player}
            timeControl={bottomClock} // Truyền giây còn lại vào
            variant="bottom"
            side={bottom.side}
          />
        </div>
      </div>

      <div className={clsx("col-6", styles.boardArea, styles["col-height"])}>
        {isSpectator && (
          <div className={styles.spectatorBadge}>
            <i className="fa-solid fa-eye"></i> Bạn đang xem trận đấu
          </div>
        )}
        <div className={styles.board}>
          <Chessboard options={chessboardOptions} />
        </div>
      </div>
      <div className={clsx("col-3", styles.panelArea, styles["col-height"])}>
        <FlipBoardButton
          onClick={handleFlipBoard}
          className={styles.gamePageFlipBtn}
        />
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
