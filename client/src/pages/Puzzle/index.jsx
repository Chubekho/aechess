import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useAuth } from "@/hooks/index";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";

import axios from "axios";
import clsx from "clsx";
import { BOARD_THEMES } from "@/utils/themeConfig";
import styles from "./Puzzle.module.scss";

const START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

function PuzzlePage() {
  const { token, user } = useAuth();
  const gameRef = useRef(new Chess());

  // --- STATE ---
  const [fen, setFen] = useState(START_FEN);
  const [puzzleData, setPuzzleData] = useState(null);
  const [moveIndex, setMoveIndex] = useState(0);
  const [status, setStatus] = useState("loading");
  const [userRating, setUserRating] = useState(
    Math.floor(user?.puzzleStats?.rating) || 1500
  );
  const [ratingChange, setRatingChange] = useState(0);
  const [orientation, setOrientation] = useState("white");
  const [message, setMessage] = useState("");

  // State Visuals
  const [hintSquares, setHintSquares] = useState({});
  const [arrows, setArrows] = useState([]);

  const [hasFailed, setHasFailed] = useState(false);
  const [isReplay, setIsReplay] = useState(false);
  const [history, setHistory] = useState([]);

  // --- Theme ---
  const savedTheme = localStorage.getItem("boardTheme") || "brown";
  const themeColors = BOARD_THEMES[savedTheme] || BOARD_THEMES.brown;

  const loadPuzzleState = useCallback((puzzle) => {
    if (!puzzle || !puzzle.fen || !puzzle.moves.length) return;

    // 1. Khởi tạo trạng thái ban đầu (Chưa đi nước nào)
    const newGame = new Chess(puzzle.fen);
    gameRef.current = newGame;

    // Hiển thị thế cờ gốc trước
    setFen(newGame.fen());
    setPuzzleData(puzzle);

    // Reset visual & state
    setHintSquares({});
    setArrows([]);
    setMessage("");
    setRatingChange(0);
    setHasFailed(false);

    const playerColor = newGame.turn() === "w" ? "black" : "white";
    setOrientation(playerColor);

    // 3. ANIMATION NƯỚC ĐẦU TIÊN (Delay 800ms)
    setTimeout(() => {
      // Lấy instance hiện tại (đề phòng user click nhanh quá)
      const currentGame = gameRef.current;
      const firstMoveUCI = puzzle.moves[0];

      if (firstMoveUCI) {
        const from = firstMoveUCI.substring(0, 2);
        const to = firstMoveUCI.substring(2, 4);
        const promotion = firstMoveUCI.length > 4 ? firstMoveUCI[4] : undefined;

        try {
          // Thực hiện nước đi trên logic
          const moveResult = currentGame.move({ from, to, promotion });

          // Nếu đi thành công thì cập nhật UI để bàn cờ chạy animation
          if (moveResult) {
            setFen(currentGame.fen());
            setMoveIndex(1); // Chuyển lượt sang người chơi (Index lẻ)
          }
        } catch (e) {
          console.error("Lỗi đi nước đầu:", e);
        }
      }
    }, 800); // 800ms là khoảng thời gian đẹp để quan sát
  }, []);

  // --- API: Lấy bài tập mới ---
  const fetchNextPuzzle = useCallback(async () => {
    if (!token) return;

    try {
      setStatus("loading");

      // 1. KIỂM TRA HISTORY: Có bài nào chưa giải (current) không?
      const pendingPuzzle = history.find((item) => item.result === "current");

      if (pendingPuzzle) {
        // --- CASE A: Load lại bài chưa giải ---
        console.log("Resume pending puzzle:", pendingPuzzle.id);

        loadPuzzleState(pendingPuzzle.data);
        setStatus("playing");
        setIsReplay(false); // Quan trọng: Cho phép tính điểm
        // Không thêm vào history nữa vì nó đã có ở đó rồi
      } else {
        // --- CASE B: Gọi API lấy bài mới ---
        const res = await axios.get("http://localhost:8080/api/puzzle/next", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const puzzle = res.data;

        if (puzzle && puzzle.fen) {
          loadPuzzleState(puzzle);
          setStatus("playing");
          setIsReplay(false);

          // Thêm vào history
          setHistory((prev) => [
            ...prev,
            {
              id: puzzle.puzzleId,
              result: "current",
              ratingChange: 0,
              data: puzzle,
              initialFen: puzzle.fen,
            },
          ]);
        }
      }
    } catch (error) {
      console.error("Lỗi lấy puzzle:", error);
      setMessage("Lỗi tải bài tập.");
    }
  }, [token, history, loadPuzzleState]);

  // Gọi lần đầu
  useEffect(() => {
    fetchNextPuzzle();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- API: Gửi kết quả ---
  const submitResult = useCallback(
    async (isCorrect) => {
      if (!puzzleData) return;

      // Chặn nếu đang replay hoặc đã fail trước đó (trừ khi fail lần đầu để trừ điểm)
      if (isReplay || (isCorrect && hasFailed)) return;

      try {
        const res = await axios.post(
          "http://localhost:8080/api/puzzle/solve",
          {
            puzzleId: puzzleData.puzzleId,
            isCorrect: isCorrect,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (res.data.success) {
          setUserRating(res.data.newRating);

          // Logic update UI nếu chưa fail
          if (!hasFailed) {
            const change = res.data.ratingChange;
            setRatingChange(change);

            // CẬP NHẬT HISTORY (Tìm theo ID thay vì lấy cái cuối)
            setHistory((prev) =>
              prev.map((item) =>
                item.id === puzzleData.puzzleId
                  ? {
                      ...item,
                      result: isCorrect ? "success" : "failed",
                      ratingChange: change,
                    }
                  : item
              )
            );
          }
        }
      } catch (error) {
        console.error("Lỗi submit:", error);
      }
    },
    [puzzleData, token, hasFailed, isReplay]
  );

  // --- LOGIC MÁY ĐI (Cho các nước sau này - index 2, 4, 6...) ---
  const makeComputerMove = useCallback(
    (index) => {
      if (!puzzleData) return;

      const game = gameRef.current;
      const computerMoveUCI = puzzleData.moves[index];

      if (!computerMoveUCI) return; // Hết nước

      const from = computerMoveUCI.substring(0, 2);
      const to = computerMoveUCI.substring(2, 4);
      const promotion =
        computerMoveUCI.length > 4 ? computerMoveUCI[4] : undefined;

      game.move({ from, to, promotion });
      setFen(game.fen());
      setMoveIndex(index + 1);
    },
    [puzzleData]
  );

  // --- LOGIC: Xử lý nước đi người chơi ---
  // --- LOGIC NGƯỜI CHƠI ĐI ---
  const onPieceDrop = useCallback(
    ({ sourceSquare, targetSquare }) => {
      if (status !== "playing") return false;

      const game = gameRef.current;
      const move = game.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: "q",
      });

      if (move === null) return false;

      const userMoveUCI = move.from + move.to + (move.promotion || "");
      const correctMoveUCI = puzzleData.moves[moveIndex];

      if (userMoveUCI === correctMoveUCI) {
        // ĐÚNG
        setFen(game.fen());
        setHintSquares({});
        setArrows([]);

        const nextMoveIndex = moveIndex + 1;

        if (nextMoveIndex >= puzzleData.moves.length) {
          setStatus("success");
          setMessage(hasFailed ? "Hoàn thành (Không cộng điểm)" : "Chính xác!");
          submitResult(true);
        } else {
          setMoveIndex(nextMoveIndex);
          setTimeout(() => makeComputerMove(nextMoveIndex), 500);
        }
        return true;
      } else {
        // SAI
        game.undo();
        if (!hasFailed && !isReplay) {
          setHasFailed(true);
          submitResult(false);
          // Cập nhật history thành màu đỏ ngay lập tức (theo ID)
          setHistory((prev) =>
            prev.map((item) =>
              item.id === puzzleData.puzzleId
                ? { ...item, result: "failed" }
                : item
            )
          );
        }
        setMessage("Sai rồi! Thử lại xem.");
        return false;
      }
    },
    [
      status,
      puzzleData,
      moveIndex,
      makeComputerMove,
      submitResult,
      hasFailed,
      isReplay,
    ]
  );

  // --- ACTIONS ---
  const handleHint = () => {
    if (!puzzleData || status !== "playing") return;
    if (!hasFailed && !isReplay) {
      setHasFailed(true);
      submitResult(false);
      // Update history fail
      setHistory((prev) =>
        prev.map((item) =>
          item.id === puzzleData.puzzleId ? { ...item, result: "failed" } : item
        )
      );
    }
    const currentMoveUCI = puzzleData.moves[moveIndex];
    if (currentMoveUCI) {
      const source = currentMoveUCI.substring(0, 2);
      setHintSquares({
        [source]: { backgroundColor: "rgba(255, 255, 0, 0.4)" },
      });
    }
  };

  const handleSolution = () => {
    if (!puzzleData || status !== "playing") return;
    if (!hasFailed && !isReplay) {
      setHasFailed(true);
      submitResult(false);
      setHistory((prev) =>
        prev.map((item) =>
          item.id === puzzleData.puzzleId ? { ...item, result: "failed" } : item
        )
      );
    }
    const currentMoveUCI = puzzleData.moves[moveIndex];
    if (currentMoveUCI) {
      const source = currentMoveUCI.substring(0, 2);
      const target = currentMoveUCI.substring(2, 4);
      setArrows([
        { startSquare: source, endSquare: target, color: "rgb(0, 128, 0)" },
      ]);
    }
  };

  const handleRetry = () => {
    if (!puzzleData) return;
    setIsReplay(true); // Retry luôn set replay = true (ko tính điểm lại)
    loadPuzzleState(puzzleData);
    setStatus("playing");
  };

  // --- LOGIC REVIEW (Click vào thanh history) ---
  const handleReviewPuzzle = (histItem) => {
    if (!histItem || !histItem.data) return;

    // Check xem bài này là bài đang dang dở (current) hay bài đã xong
    const isPending = histItem.result === "current";

    // Load state
    loadPuzzleState(histItem.data);

    if (isPending) {
      // Nếu là bài chưa xong -> Cho phép tính điểm
      setIsReplay(false);
      setHasFailed(false); // Reset fail để tính điểm
    } else {
      // Nếu bài đã xong -> Chế độ Replay
      setIsReplay(true);
      setRatingChange(histItem.ratingChange); // Hiện lại điểm cũ
    }

    setStatus("playing");
  };

  // --- OPTIONS ---
  const chessboardOptions = useMemo(() => {
    return {
      position: fen,
      onPieceDrop: onPieceDrop,
      id: "PuzzleBoard",
      boardOrientation: orientation,
      animationDuration: 250,
      squareStyles: hintSquares,
      arrows,
      lightSquareStyle: { backgroundColor: themeColors.white },
      darkSquareStyle: { backgroundColor: themeColors.black },
    };
  }, [fen, onPieceDrop, orientation, hintSquares, arrows, themeColors]);

  return (
    <div className={clsx(styles.wrapper, "row", "gx-0")}>
      {/* CỘT 1 (TRÁI): THÔNG TIN */}
      <div className={clsx("col-12 col-md-3", styles.infoPanel)}>
        <div className={styles.infoContent}>
          <div className={styles.ratingBox}>
            <span className={styles.label}>Your Rating</span>
            <div className={styles.score}>
              {userRating}
              {ratingChange !== 0 && !isReplay && (
                <span className={ratingChange > 0 ? styles.gain : styles.loss}>
                  {ratingChange > 0 ? `+${ratingChange}` : ratingChange}
                </span>
              )}
            </div>
          </div>

          {/* --- KHỐI HISTORY BAR (MỚI) --- */}
          <div className={styles.historyBar}>
            {history.map((item, index) => (
              <div
                key={index}
                className={clsx(
                  styles.historyItem,
                  styles[item.result], // class: success, failed, hoặc current
                  { [styles.active]: puzzleData?.puzzleId === item.id } // Highlight bài đang chọn
                )}
                onClick={() => handleReviewPuzzle(item)}
                title={
                  item.ratingChange > 0
                    ? `+${item.ratingChange}`
                    : item.ratingChange
                }
              >
                {item.ratingChange > 0
                  ? `+${item.ratingChange}`
                  : item.ratingChange}
              </div>
            ))}
          </div>
          {/* ----------------------------- */}

          <div className={styles.puzzleMeta}>
            <div className={styles.metaItem}>
              <i className="fa-solid fa-trophy"></i>
              <span>
                Puzzle Rating:{" "}
                <strong>
                  {puzzleData?.rating ? Math.floor(puzzleData.rating) : "..."}
                </strong>
              </span>
            </div>
            <div className={styles.metaItem}>
              <i className="fa-solid fa-tags"></i>
              <span className={styles.themes}>
                {puzzleData?.themes?.slice(0, 3).join(", ").replace(/_/g, " ")}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* CỘT 2 (GIỮA): BÀN CỜ */}
      <div className={clsx("col-12 col-md-6", styles.boardArea)}>
        <div className={styles.boardWrapper}>
          <Chessboard options={chessboardOptions} />
        </div>
      </div>

      {/* CỘT 3 (PHẢI): ACTION */}
      <div className={clsx("col-12 col-md-3", styles.actionPanel)}>
        <div className={styles.actionContent}>
          <div
            className={clsx(
              styles.turnIndicator,
              status === "success" ? styles.success : styles.playing
            )}
          >
            {status === "loading" && "Đang tải..."}
            {status === "playing" && (
              <>
                <i
                  className={`fa-solid fa-circle ${
                    orientation === "white"
                      ? styles.iconWhite
                      : styles.iconBlack
                  }`}
                ></i>
                <span>
                  Lượt bạn đi ({orientation === "white" ? "Trắng" : "Đen"})
                </span>
              </>
            )}
            {status === "success" && (
              <span>
                <i className="fa-solid fa-check"></i> Hoàn thành!
              </span>
            )}
          </div>

          <div className={styles.messageBox}>
            {message && (
              <p className={hasFailed ? styles.textWarn : styles.textInfo}>
                {message}
              </p>
            )}
          </div>

          <div className={styles.btnGroup}>
            {status === "playing" ? (
              <>
                <button
                  className={styles.hintBtn}
                  onClick={handleHint}
                  title="- Điểm"
                >
                  <i className="fa-solid fa-lightbulb"></i> Gợi ý
                </button>
                <button
                  className={styles.solutionBtn}
                  onClick={handleSolution}
                  title="- Điểm"
                >
                  <i className="fa-solid fa-eye"></i> Đáp án
                </button>
              </>
            ) : (
              <>
                <button className={styles.retryBtn} onClick={handleRetry}>
                  <i className="fa-solid fa-rotate-left"></i> Giải lại
                </button>
                <button className={styles.nextBtn} onClick={fetchNextPuzzle}>
                  Puzzle Mới <i className="fa-solid fa-arrow-right"></i>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PuzzlePage;
