// client/src/hooks/useGameNavigation.js
import { useState, useCallback } from "react";

/**
 * Hook quản lý việc tua lại ván cờ
 * @param {Object} fenHistoryRef - Ref chứa mảng các FEN string
 * @param {Array} moveHistory - Mảng các nước đi (SAN)
 * @param {Function} setFen - Hàm update state FEN bàn cờ
 * @param {Function} setLastMove - Hàm update state nước đi cuối (để highlight)
 */
export const useGameNavigation = (
  fenHistoryRef,
  moveHistory,
  setFen,
  setLastMove
) => {
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0);

  const handleNavigation = useCallback(
    (action, index) => {
      const maxIndex = fenHistoryRef.current.length - 1;
      let newIndex = currentMoveIndex;

      if (action === "select") {
        newIndex = index;
      } else if (action === "start") {
        newIndex = 0;
      } else if (action === "back") {
        newIndex = Math.max(0, currentMoveIndex - 1);
      } else if (action === "next") {
        newIndex = Math.min(maxIndex, currentMoveIndex + 1);
      } else if (action === "end") {
        newIndex = maxIndex;
      }

      // Đảm bảo index hợp lệ
      newIndex = Math.max(0, Math.min(maxIndex, newIndex));

      // Cập nhật State
      setCurrentMoveIndex(newIndex);
      
      // Cập nhật Bàn cờ (FEN)
      if (fenHistoryRef.current[newIndex]) {
        setFen(fenHistoryRef.current[newIndex]);
      }
      
      // Cập nhật Highlight (Last Move)
      // moveHistory[newIndex - 1] là nước đi tại vị trí đó
      setLastMove(moveHistory[newIndex - 1] || null);
    },
    [currentMoveIndex, fenHistoryRef, moveHistory, setFen, setLastMove]
  );

  // Hàm helper để reset navigation về cuối (dùng khi có nước đi mới)
  const snapToEnd = useCallback(() => {
    const maxIndex = fenHistoryRef.current.length - 1;
    setCurrentMoveIndex(maxIndex);
    // setFen không cần gọi ở đây vì logic game chính thường đã setFen mới nhất rồi
  }, [fenHistoryRef]);

  return {
    currentMoveIndex,
    setCurrentMoveIndex,
    handleNavigation,
    snapToEnd
  };
};