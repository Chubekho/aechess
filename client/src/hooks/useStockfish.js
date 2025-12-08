import { useEffect, useState, useRef, useCallback } from "react";

/**
 * Hook Stockfish Nâng Cao (Hỗ trợ MultiPV)
 * @param {string} fen - FEN hiện tại
 * @param {object} options - Cấu hình { depth, multiPV }
 */
export const useStockfish = (fen, { depth = 18, multiPV = 1, isAnalyzing = true } = {}) => {
  const engine = useRef(null);

  // State lưu trữ danh sách các dòng phân tích
  const [lines, setLines] = useState([]);

  // State trạng thái engine (Đã export để dùng ở UI -> Fix lỗi unused var)
  const [isEngineReady, setIsEngineReady] = useState(false);

  // 1. Khởi tạo Engine
  useEffect(() => {
    engine.current = new Worker("/stockfish.js");
    engine.current.postMessage("uci");

    engine.current.onmessage = (event) => {
      if (event.data === "readyok") {
        setIsEngineReady(true);
      }
    };

    // Cấu hình mặc định ban đầu
    engine.current.postMessage("isready");

    return () => {
      if (engine.current) engine.current.terminate();
    };
  }, []);

  // 2. Hàm parse output (CẦN SỬA LOGIC TÍNH ĐIỂM Ở ĐÂY)
  const handleEngineMessage = useCallback(
    (event) => {
      const msg = event.data;

      if (
        msg.startsWith("info") &&
        msg.includes("multipv") &&
        msg.includes("score")
      ) {
        const multipvMatch = msg.match(/multipv (\d+)/);
        const lineIndex = multipvMatch ? parseInt(multipvMatch[1]) - 1 : 0;

        // 1. Xác định lượt đi từ FEN hiện tại
        const turn = fen.split(" ")[1]; // 'w' hoặc 'b'

        // 2. Hệ số nhân: Nếu là Đen, đảo ngược dấu của điểm số
        // Stockfish nói: "Tôi (Đen) đang thua 5 điểm (-500)" -> UI cần hiểu: "Trắng đang thắng 5 điểm (+500)"
        // Nên: -500 * -1 = +500 (Đúng ý UI)
        const scoreMultiplier = turn === "w" ? 1 : -1;

        let score = 0;
        let mate = null;
        const scoreCpMatch = msg.match(/score cp (-?\d+)/);
        const scoreMateMatch = msg.match(/score mate (-?\d+)/);

        if (scoreMateMatch) {
          // Mate cũng cần đảo dấu
          mate = parseInt(scoreMateMatch[1]) * scoreMultiplier;
        } else if (scoreCpMatch) {
          // Centipawn cũng cần đảo dấu
          score = parseInt(scoreCpMatch[1]) * scoreMultiplier;
        }
        // ------------------------------------------

        let pvString = "";
        let bestMoveSan = "";

        const pvIndex = msg.indexOf(" pv ");
        if (pvIndex !== -1) {
          pvString = msg.substring(pvIndex + 4).trim();
          bestMoveSan = pvString.split(" ")[0];
        }

        const bestMoveObj = bestMoveSan
          ? {
              from: bestMoveSan.slice(0, 2),
              to: bestMoveSan.slice(2, 4),
              promotion: bestMoveSan.length > 4 ? bestMoveSan[4] : null,
            }
          : null;

        setLines((prevLines) => {
          const newLines = [...prevLines];
          while (newLines.length <= lineIndex) newLines.push({});

          newLines[lineIndex] = {
            id: lineIndex + 1,
            score, 
            mate, 
            pv: pvString,
            bestMove: bestMoveObj,
            turn: turn
          };
          return newLines;
        });
      }
    },
    [fen]
  ); 

  // 3. Gửi lệnh phân tích
  useEffect(() => {
    if (!engine.current || !fen || !isEngineReady) return;

    if (!isAnalyzing) {
      engine.current.postMessage("stop"); // Dừng tính toán ngay lập tức
      return; // Không gửi lệnh 'go' mới
    }

    // Reset kết quả cũ khi FEN đổi
    setLines([]);

    // Gắn listener
    engine.current.onmessage = handleEngineMessage;

    // Gửi chuỗi lệnh UCI
    engine.current.postMessage("stop"); // Dừng việc cũ

    // Thiết lập số luồng (MultiPV)
    engine.current.postMessage(`setoption name MultiPV value ${multiPV}`);

    // Thiết lập vị trí và bắt đầu
    engine.current.postMessage(`position fen ${fen}`);
    engine.current.postMessage(`go depth ${depth}`);
  }, [fen, depth, multiPV, isAnalyzing, handleEngineMessage, isEngineReady]);

  // Export cả isEngineReady để UI sử dụng
  return { lines, isEngineReady };
};
