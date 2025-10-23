import { useEffect, useRef, useState } from "react";

import { Chessboard } from "react-chessboard";

import { Chess } from "chess.js";

function App() {
  // create a chess game using a ref to always have access to the latest game state within closures and maintain the game state across renders
  const chessGameRef = useRef(new Chess());

  const chessGame = chessGameRef.current;
  // track the current position of the chess game in state to trigger a re-render of the chessboard
  const [chessPosition, setChessPosition] = useState(chessGame.fen());

  const engine = useRef(null);

  useEffect(() => {
    engine.current = new Worker("/stockfish.js");
    engine.current.postMessage("uci");
    engine.current.postMessage("isready");

    return () => engine.current.terminate();
  }, []);

  async function makeAiMove() {
    if (!engine.current) return;

    const fen = chessGame.fen();

    return new Promise((resolve) => {
      engine.current.onmessage = (event) => {
        const message = event.data;

        if (message.startsWith("bestmove")) {
          const bestMove = message.split(" ")[1];

          chessGame.move({
            from: bestMove.slice(0, 2),
            to: bestMove.slice(2, 4),
            promotion: "q",
          });

          setChessPosition(chessGame.fen());
          resolve(bestMove);
        }
      };

      engine.current.postMessage("ucinewgame");
      engine.current.postMessage(`position fen ${fen}`);
      engine.current.postMessage("go depth 5"); // có thể thay depth thấp hơn như 5 nếu muốn AI yếu hơn
    });
  }

  function onPieceDrop({ sourceSquare, targetSquare }) {
    // type narrow targetSquare potentially being null (e.g. if dropped off board)
    if (!targetSquare) {
      return false;
    }

    console.log([sourceSquare, targetSquare]);

    // try to make the move according to chess.js logic
    try {
      chessGame.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: "q", // always promote to a queen for example simplicity
      });

      // update the position state upon successful move to trigger a re-render of the chessboard
      setChessPosition(chessGame.fen());

      // return true as the move was successful
      return true;
    } catch {
      // return false as the move was not successful
      return false;
    }
  }
  // set the chessboard options
  const chessboardOptions = {
    position: chessPosition,
    onPieceDrop,
    id: "play-vs-random",
  };

  return (
    <div style={{ width: "400px", margin: "auto" }}>
      <Chessboard options={chessboardOptions} />

      {/* reset board butotn */}
      <button
        onClick={() => {
          chessGame.reset();
          setChessPosition(chessGame.fen());
        }}
      >
        Reset board
      </button>

      {/* get move ? */}
      <button onClick={() => {makeAiMove()}}>get AI move</button>

      {/* Thông tin trạng thái game */}

      <h3>Lượt của: {chessGame.turn() === "w" ? "Trắng" : "Đen"}</h3>

      {chessGame.isCheckmate() && (
        <div>
          <h2>
            Chiếu hết! {chessGame.turn() === "w" ? "Đen" : "Trắng"} thắng!
          </h2>
          <p>{chessGame.pgn()}</p>
        </div>
      )}

      {chessGame.isStalemate() && <h2>Hòa cờ (Stalemate)!</h2>}

      {chessGame.isThreefoldRepetition() && <h2>Hòa cờ (Lặp 3 lần)!</h2>}

      {chessGame.isDraw() &&
        !chessGame.isCheckmate() &&
        !chessGame.isStalemate() && <h2>Hòa cờ!</h2>}
    </div>
  );
}

export default App;
