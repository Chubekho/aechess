// client/src/hooks/useGameNavigation.js
import { useState, useRef, useCallback, useMemo } from "react";
import { MoveNode, getDisplayList } from "@/utils/GameTree";

const START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

export const useGameNavigation = (setFen) => {
  const rootNodeRef = useRef(new MoveNode(null, START_FEN));
  const [currentNode, setCurrentNode] = useState(rootNodeRef.current);

  const addMove = useCallback((san, fen) => {
    setCurrentNode((prevNode) => {
      const nextNode = prevNode.addChild(san, fen);
      return nextNode;
    });
  }, []);

  // const currentNodeRef = useRef(rootNodeRef.current);

  const displayHistory = useMemo(() => {
      return getDisplayList(currentNode);
  }, [currentNode]);

  const handleNavigation = useCallback(
    (action, targetNode = null) => {
      let nextNode = currentNode;
      switch (action) {
        case "start": {
          let temp = currentNode;
          while (temp.parent) temp = temp.parent;
          nextNode = temp;
          break;
        }

        case "back":
          if (currentNode.parent) nextNode = currentNode.parent;
          break;

        case "next":
          if (currentNode.children.length > 0)
            nextNode = currentNode.children[0];
          break;

        case "end": {
          let end = currentNode;
          while (end.children.length > 0) end = end.children[0];
          nextNode = end;
          break;
        }

        case "select":
          if (targetNode) nextNode = targetNode;
          break;

        default:
          break;
      }

      if (nextNode !== currentNode) {
        setCurrentNode(nextNode);
        setFen(nextNode.fen);
      }
    },
    [currentNode, setFen]
  );

  const resetNavigation = useCallback((startFen = START_FEN) => {
    rootNodeRef.current = new MoveNode(null, startFen);
    setCurrentNode(rootNodeRef.current);
  }, []);

  // Hàm nạp lại toàn bộ lịch sử (Sync)
  const loadHistory = useCallback((historyVerbose) => {
      let tempNode = rootNodeRef.current;
      for (const move of historyVerbose) {
          tempNode = tempNode.addChild(move.san, move.after);
      }
      setCurrentNode(tempNode); // Cập nhật state 1 lần cuối cùng
  }, []);


  return {
    currentNode,
    rootNode: rootNodeRef.current,
    handleNavigation,
    addMove,
    resetNavigation,
    displayHistory,
    loadHistory
  };
};
