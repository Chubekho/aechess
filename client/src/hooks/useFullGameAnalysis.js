// client/src/hooks/useFullGameAnalysis.js
import { useState, useRef, useCallback, useEffect } from 'react';
import { Chess } from 'chess.js';
import { getWinChance, classifyMove } from '@/utils/chessAnalysis';

export const useFullGameAnalysis = () => {
  const [progress, setProgress] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [report, setReport] = useState(null);
  const workerRef = useRef(null);

  // Cleanup worker khi component unmount
  useEffect(() => {
    return () => {
      if (workerRef.current) workerRef.current.terminate();
    };
  }, []);

  const runAnalysis = useCallback(async (pgnString) => {
    if (!pgnString) return;

    setIsAnalyzing(true);
    setProgress(0);
    setReport(null);

    // 1. Load Game
    const game = new Chess();
    try {
        game.loadPgn(pgnString);
    } catch(e) {
        console.error("PGN Error", e);
        setIsAnalyzing(false);
        return;
    }

    const history = game.history({ verbose: true });
    const totalMoves = history.length;
    const analyzedMoves = [];

    // 2. Khởi tạo Worker
    if (workerRef.current) workerRef.current.terminate();
    workerRef.current = new Worker("/stockfish.js");
    
    // Gửi lệnh khởi động chuẩn
    workerRef.current.postMessage("uci");
    workerRef.current.postMessage("isready");
    workerRef.current.postMessage("ucinewgame"); // Quan trọng: Reset engine state

    // Đợi 1 chút cho engine khởi động
    await new Promise(r => setTimeout(r, 200));

    // --- HÀM PHÂN TÍCH CÓ TIMEOUT (QUAN TRỌNG) ---
    const analyzeFen = (fen, lastKnownScore) => {
      return new Promise((resolve) => {
        let bestScore = lastKnownScore; // Mặc định lấy điểm cũ nếu fail
        let resolved = false;

        const handler = (e) => {
            if (resolved) return; // Nếu đã timeout/resolve rồi thì bỏ qua
            const msg = e.data;
            
            // Cập nhật điểm
            if (msg.startsWith('info') && msg.includes('score')) {
                const turn = fen.split(" ")[1];
                const scoreMultiplier = turn === "w" ? 1 : -1;
                const cpMatch = msg.match(/score cp (-?\d+)/);
                const mateMatch = msg.match(/score mate (-?\d+)/);

                if (mateMatch) {
                    bestScore = parseInt(mateMatch[1]) * scoreMultiplier * 2000;
                } else if (cpMatch) {
                    bestScore = parseInt(cpMatch[1]) * scoreMultiplier;
                }
            }

            // Tín hiệu kết thúc chuẩn
            if (msg.startsWith('bestmove')) {
                cleanup();
                resolve(bestScore);
            }
        };

        const cleanup = () => {
            resolved = true;
            clearTimeout(timeoutId);
            workerRef.current.removeEventListener('message', handler);
        };

        // Gắn listener
        workerRef.current.addEventListener('message', handler);
        
        // Gửi lệnh
        workerRef.current.postMessage(`position fen ${fen}`);
        workerRef.current.postMessage("go depth 10");

        // --- TIMEOUT SAFETY NET ---
        // Nếu sau 3 giây engine câm nín -> Ép buộc đi tiếp
        const timeoutId = setTimeout(() => {
            if (!resolved) {
                // console.warn("Engine timeout at fen:", fen);
                cleanup();
                resolve(bestScore); // Trả về điểm cập nhật mới nhất (hoặc điểm cũ)
            }
        }, 3000); 
      });
    };

    // --- LOOP ---
    let prevScore = 30; // Start CP

    for (let i = 0; i < totalMoves; i++) {
        // Nếu user thoát hoặc component unmount -> Dừng ngay
        if (!workerRef.current) break;

        const move = history[i];

        // Truyền prevScore vào để nếu timeout thì dùng lại nó
        const currentScore = await analyzeFen(move.after, prevScore);

        // Tính toán Logic (Giữ nguyên)
        const playerSign = move.color === 'w' ? 1 : -1;
        const scoreBefore = prevScore * playerSign;
        const scoreAfter = currentScore * playerSign;
        
        const winChanceBefore = getWinChance(scoreBefore);
        const winChanceAfter = getWinChance(scoreAfter);
        
        const type = classifyMove(winChanceBefore, winChanceAfter);
        const diff = winChanceBefore - winChanceAfter;
        const accuracyScore = diff <= 0 ? 100 : Math.max(0, 100 - diff * 2.5);

        analyzedMoves.push({
            moveStr: move.san,
            color: move.color,
            fen: move.after,
            score: currentScore,
            type,
            accuracyScore
        });

        prevScore = currentScore;
        
        // Update UI
        setProgress(Math.round(((i + 1) / totalMoves) * 100));
    }

    // Kết thúc
    if (workerRef.current) workerRef.current.terminate();

    // Stats Calculation
    const stats = {
        w: { best: 0, good: 0, mistake: 0, blunder: 0, totalAcc: 0, count: 0 },
        b: { best: 0, good: 0, mistake: 0, blunder: 0, totalAcc: 0, count: 0 }
    };

    analyzedMoves.forEach(m => {
        const s = stats[m.color];
        s.totalAcc += m.accuracyScore;
        s.count++;
        if (['best', 'excellent'].includes(m.type)) s.best++;
        else if (m.type === 'good') s.good++;
        else if (m.type === 'mistake') s.mistake++;
        else if (m.type === 'blunder') s.blunder++;
    });

    setReport({
        moves: analyzedMoves,
        white: { ...stats.w, accuracy: stats.w.count ? Math.round(stats.w.totalAcc / stats.w.count) : 0 },
        black: { ...stats.b, accuracy: stats.b.count ? Math.round(stats.b.totalAcc / stats.b.count) : 0 }
    });

    setIsAnalyzing(false);

  }, []);

  return { runAnalysis, progress, isAnalyzing, report };
};