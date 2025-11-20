import { useEffect, useState, useRef, useCallback } from "react";

/**
 * Hook Stockfish Nâng Cao (Hỗ trợ MultiPV)
 * @param {string} fen - FEN hiện tại
 * @param {object} options - Cấu hình { depth, multiPV }
 */
export const useStockfish = (fen, { depth = 18, multiPV = 1 } = {}) => {
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

  // 2. Hàm parse output phức tạp hơn để hỗ trợ MultiPV
  const handleEngineMessage = useCallback((event) => {
    const msg = event.data;

    // Chỉ quan tâm đến dòng 'info' có chứa 'multipv' (dữ liệu phân tích)
    if (msg.startsWith("info") && msg.includes("multipv") && msg.includes("score")) {
      
      // A. Lấy ID của dòng (MultiPV index: 1, 2, 3...)
      const multipvMatch = msg.match(/multipv (\d+)/);
      const lineIndex = multipvMatch ? parseInt(multipvMatch[1]) - 1 : 0;

      // B. Lấy điểm số
      let score = 0;
      let mate = null;
      const scoreCpMatch = msg.match(/score cp (-?\d+)/);
      const scoreMateMatch = msg.match(/score mate (-?\d+)/);

      if (scoreMateMatch) {
        mate = parseInt(scoreMateMatch[1]);
      } else if (scoreCpMatch) {
        score = parseInt(scoreCpMatch[1]);
      }

      // C. Lấy chuỗi nước đi (pv)
      let pvString = "";
      let bestMoveSan = "";
      
      const pvIndex = msg.indexOf(" pv ");
      if (pvIndex !== -1) {
        pvString = msg.substring(pvIndex + 4).trim(); // Lấy hết phần sau " pv "
        bestMoveSan = pvString.split(" ")[0]; // Nước đi đầu tiên
      }
      
      // Chuẩn hóa cho việc vẽ mũi tên: 'e2e4' -> { from: 'e2', to: 'e4' }
      const bestMoveObj = bestMoveSan ? {
        from: bestMoveSan.slice(0, 2),
        to: bestMoveSan.slice(2, 4),
        promotion: bestMoveSan.length > 4 ? bestMoveSan[4] : null
      } : null;

      // D. Cập nhật vào State mảng Lines
      setLines(prevLines => {
        const newLines = [...prevLines];
        // Đảm bảo mảng đủ dài nếu engine trả về line thứ 3 mà mảng chưa có
        while (newLines.length <= lineIndex) newLines.push({});
        
        newLines[lineIndex] = {
          id: lineIndex + 1,
          score,      // Điểm Centipawn (ví dụ: 150)
          mate,       // Điểm Mate (ví dụ: 3)
          pv: pvString, // Chuỗi biến thể ("e2e4 e7e5...")
          bestMove: bestMoveObj // Object để vẽ mũi tên
        };
        return newLines;
      });
    }
  }, []);

  // 3. Gửi lệnh phân tích
  useEffect(() => {
    if (!engine.current || !fen || !isEngineReady) return;

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

  }, [fen, depth, multiPV, handleEngineMessage, isEngineReady]);

  // Export cả isEngineReady để UI sử dụng
  return { lines, isEngineReady };
};