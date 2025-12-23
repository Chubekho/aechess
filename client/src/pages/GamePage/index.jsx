import { useCallback, useMemo, useState } from "react";
import { useParams } from "react-router";
import { useSocket } from "@/context/SocketContext";
import clsx from "clsx";

import { useGameNavigation, useOnlineGame } from "@/hooks/index";
import { getPlayerLayout, calculateMaterial } from "@/utils/chessUtils";

import ChessBoardCustom from "@/components/ChessBoardCustom";
import PlayerInfoBox from "@/components/PlayerInfoBox";
import GameInfoPanel from "@/components/GameInfoPanel";
import FlipBoardButton from "@/components/FlipBoardButton";
import styles from "./GamePage.module.scss";

const START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

function GamePage() {
  const { gameId } = useParams();
  const [fen, setFen] = useState(START_FEN);
  const socket = useSocket();

  // --- Game State ---
  const {
    currentNode,
    rootNode,
    handleNavigation,
    addMove,
    resetNavigation,
    loadHistory,
  } = useGameNavigation(setFen);

  const {
    myColor,
    gameStatus,
    clocks,
    gameData,
    makeMove,
    isSpectator,
    gameResult,
    drawStatus,
    rematchStatus,
    handlers,
  } = useOnlineGame(fen, setFen, gameId, addMove, resetNavigation, loadHistory);

  const [userOrientation, setUserOrientation] = useState(null);

  const materialData = useMemo(() => {
    return calculateMaterial(fen);
  }, [fen]);

  const currentTurnColor = gameData?.turn === "w" ? "white" : "black";
  const isGameActive = gameStatus === "playing";

  const boardOrientation = useMemo(() => {
    if (userOrientation) return userOrientation;
    if (myColor === "b") return "black";
    return "white";
  }, [userOrientation, myColor]);

  const handleNewGame = () => {
    if (!socket || !gameData?.config) return;

    const base = gameData.config.time.base;
    const inc = gameData.config.time.inc;
    const timeControl = `${base}+${inc}`;

    socket.emit("findMatch", {
      timeControl,
      isRated: gameData.config.isRated,
    });
    window.location.href = "/";
  };

  const onPieceDrop = useCallback(
    ({ sourceSquare, targetSquare }) => {
      if (isSpectator) return false;
      if (gameStatus !== "playing" || currentNode.children.length > 0) {
        return false;
      }
      return makeMove({ sourceSquare, targetSquare });
    },
    [makeMove, gameStatus, currentNode.children, isSpectator]
  );

  const handleFlipBoard = () => {
    setUserOrientation((prev) => {
      const current = prev || (myColor === "b" ? "black" : "white");
      return current === "white" ? "black" : "white";
    });
  };

  const getDisplayPlayer = (originalPlayer, side) => {
    if (!originalPlayer) return null;

    let currentRating = originalPlayer.rating;
    let diff = null;

    // The 'newRatings' object now comes directly from the 'gameOver' event payload.
    if (gameResult?.newRatings) {
      // Access the new rating for the correct side ('white' or 'black').
      const newRating = gameResult.newRatings[side];

      if (newRating !== undefined) {
        diff = newRating - originalPlayer.rating;
        currentRating = newRating;
      }
    }

    return {
      ...originalPlayer,
      rating: currentRating,
      ratingDiff: diff,
    };
  };

  const whitePlayerDisplay = getDisplayPlayer(gameData?.whitePlayer, "white");
  const blackPlayerDisplay = getDisplayPlayer(gameData?.blackPlayer, "black");

  let top, bottom;

  if (isSpectator) {
    top = { player: blackPlayerDisplay, side: "black" };
    bottom = { player: whitePlayerDisplay, side: "white" };
  } else {
    const layout = getPlayerLayout(
      boardOrientation,
      whitePlayerDisplay,
      blackPlayerDisplay
    );
    top = layout.top;
    bottom = layout.bottom;
  }

  const topClock = clocks[top.side === "white" ? "w" : "b"];
  const bottomClock = clocks[bottom.side === "white" ? "w" : "b"];

  return (
    <div className={clsx(styles.wrapper, "row", "gx-6")}>
      <div className={clsx("col-3", styles.playerInfoColumn)}>
        <div className={styles.playerBlock}>
          <PlayerInfoBox
            player={top.player}
            timeControl={topClock}
            variant="top"
            side={top.side}
            material={materialData[top.side]}
            isTurn={isGameActive && currentTurnColor === top.side}
            ratingDiff={top.player?.ratingDiff}
          />
        </div>

        <div
          style={{
            height: "1px",
            backgroundColor: "#3a3836",
            margin: "15px 0",
            width: "60%",
          }}
        />

        <div className={styles.playerBlock}>
          <PlayerInfoBox
            player={bottom.player}
            timeControl={bottomClock}
            variant="bottom"
            side={bottom.side}
            material={materialData[bottom.side]}
            isTurn={isGameActive && currentTurnColor === bottom.side}
            ratingDiff={bottom.player?.ratingDiff}
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
          <ChessBoardCustom
            position={fen}
            onPieceDrop={onPieceDrop}
            id="PlayVsPerson"
            boardOrientation={boardOrientation}
            arePiecesDraggable={!isSpectator && gameStatus === "playing"}
          />
        </div>
      </div>
      <div className={clsx("col-3", styles.panelArea, styles["col-height"])}>
        <FlipBoardButton
          onClick={handleFlipBoard}
          className={styles.gamePageFlipBtn}
        />
        <GameInfoPanel
          gameId={gameId}
          rootNode={rootNode}
          currentNode={currentNode}
          onNavigate={handleNavigation}
          showVariations={false}
          gameStatus={gameStatus}
          isSpectator={isSpectator}
          gameResult={gameResult}
          myColor={myColor}
          onNewGame={handleNewGame}
          drawStatus={drawStatus}
          rematchStatus={rematchStatus}
          {...handlers}
        />
      </div>
    </div>
  );
}

export default GamePage;
