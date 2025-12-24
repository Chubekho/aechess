import { useEffect, useRef } from "react";
import clsx from "clsx";
import styles from "./MoveBoard.module.scss";

const VISIBLE_TYPES = ["best", "mistake", "blunder"];

const getEvalIcon = (type) => {
  switch (type) {
    case "best":
      return <i className="fa-solid fa-star" title="Best Move"></i>;
    case "mistake":
      return <i className="fa-solid fa-question" title="Mistake"></i>;
    case "blunder":
      return (
        <span
          style={{ fontSize: "1.6rem", fontWeight: 800, letterSpacing: "-1px", marginLeft: "5px" }}
        >
          ??
        </span>
      );
    default:
      return null;
  }
};

// --- Component Navigator ---
const MoveNavigator = ({ onNavigate }) => {
  return (
    <div className={styles.navigator}>
      <button onClick={() => onNavigate("start")}>
        <i className="fa-solid fa-backward-fast"></i>
      </button>
      <button onClick={() => onNavigate("back")}>
        <i className="fa-solid fa-backward-step"></i>
      </button>
      <button onClick={() => onNavigate("next")}>
        <i className="fa-solid fa-forward-step"></i>
      </button>
      <button onClick={() => onNavigate("end")}>
        <i className="fa-solid fa-forward-fast"></i>
      </button>
    </div>
  );
};

// --- Component Chính ---
function MoveBoard({
  rootNode,
  currentNode,
  onNavigate,
  showVariations = false,
  analysisData = {},
}) {
  const scrollRef = useRef(null);
  const activeMoveRef = useRef(null);
  const movesEndRef = useRef(null);

  // Auto-scroll to the active move when navigating history
  useEffect(() => {
    if (activeMoveRef.current) {
      activeMoveRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [currentNode]);

  // Auto-scroll to the end of the moves list for the latest move
  useEffect(() => {
    // Only scroll to the end if the user is viewing the latest move
    if (currentNode && currentNode.children.length === 0) {
      movesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [currentNode]);

  //logic điều hướng bằng mũi tên
  useEffect(() => {
    if (!onNavigate) return;
    const handleKeyDown = (e) => {
      if (["INPUT", "TEXTAREA"].includes(document.activeElement.tagName))
        return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        onNavigate("back");
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        onNavigate("next");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onNavigate]);

  // Helper: Lấy số thứ tự từ FEN
  const getMoveInfo = (node) => {
    const fenParts = node.fen.split(" ");
    const turn = fenParts[1];
    const fullMove = parseInt(fenParts[5]);
    const isWhiteMove = turn === "b";

    return { isWhiteMove, moveNumber: fullMove };
  };

  // --- Component con: Render 1 ô nước đi ---
  const MoveBox = ({ node }) => {
    if (!node) return <div className={styles.moveBoxEmpty}>...</div>;

    const isActive = currentNode && currentNode.id === node.id;
    const analysisInfo = analysisData[node.fen];
    let moveType = analysisInfo?.type || "";

    if (!VISIBLE_TYPES.includes(moveType)) {
      moveType = "";
    }

    return (
      <div
        ref={isActive ? activeMoveRef : null}
        className={clsx(
          styles.moveBox,
          { [styles.active]: isActive },
          moveType && styles[`type-${moveType}`] // Chỉ thêm class màu nếu đúng type
        )}
        onClick={(e) => {
          e.stopPropagation();
          onNavigate("select", node);
        }}
      >
        <span>{node.san}</span>

        {/* Chỉ hiển thị Icon nếu có moveType hợp lệ */}
        {moveType && (
          <span className={clsx(styles.evalIcon, styles[`icon-${moveType}`])}>
            {getEvalIcon(moveType)}
          </span>
        )}
      </div>
    );
  };

  const renderRows = (startNode, depth = 0) => {
    if (!startNode) return null;

    const rows = [];
    let current = startNode;

    while (current) {
      const { isWhiteMove, moveNumber } = getMoveInfo(current);

      let whiteNode = null;
      let blackNode = null;

      // (Biến thể của Trắng HOẶC biến thể của Đen)
      const variationsToRender = [];

      // --- TRƯỜNG HỢP 1: Bắt đầu bằng nước Trắng ---
      if (isWhiteMove) {
        whiteNode = current;

        // 2. Lấy nước Đen (con chính của Trắng)
        if (whiteNode.children.length > 0) {
          blackNode = whiteNode.children[0]; // Nhánh chính

          // 3. Kiểm tra điều kiện show variations các biến thể của Đen (các con khác của Trắng)
          if (showVariations && whiteNode.children.length > 1) {
            // children[1...n] là các nước Đen khác
            whiteNode.children.slice(1).forEach((varNode) => {
              variationsToRender.push(varNode);
            });
          }
        }
      }
      // --- TRƯỜNG HỢP 2: Bắt đầu bằng nước Đen (Biến thể từ giữa) ---
      else {
        blackNode = current;
      }

      // --- RENDER HÀNG (ROW) ---
      rows.push(
        <div key={`row-${current.id}`} className={styles.rowWrapper}>
          <div
            className={styles.moveRow}
            style={{ paddingLeft: `${depth * 15}px` }} // Thụt lề theo depth
          >
            {/* Số thứ tự (chỉ hiện nếu có nước Trắng hoặc bắt đầu dòng biến thể) */}
            <div className={styles.moveIndex}>
              {whiteNode ? `${moveNumber}.` : ``}
            </div>

            {/* Ô Trắng */}
            {whiteNode ? (
              <MoveBox node={whiteNode} />
            ) : (
              <div className={styles.moveBoxEmpty}>...</div>
            )}

            {/* Ô Đen */}
            {blackNode ? (
              <MoveBox node={blackNode} showNumber={!whiteNode} />
            ) : (
              <div className={styles.moveBoxEmpty}></div>
            )}
          </div>

          {/* --- RENDER CÁC BIẾN THỂ CON (NẾU CÓ) --- */}
          {showVariations && variationsToRender.length > 0 && (
            <div className={styles.variationsBlock}>
              {variationsToRender.map((vNode) => (
                <div key={vNode.id} className={styles.variationItem}>
                  {/* GỌI ĐỆ QUY VỚI DEPTH TĂNG LÊN */}
                  {renderRows(vNode, depth + 1)}
                </div>
              ))}
            </div>
          )}
        </div>
      );

      // --- TIẾP TỤC VÒNG LẶP (Main Line của nhánh này) ---

      // Nếu vừa render xong cặp Trắng-Đen
      if (blackNode && blackNode.children.length > 0) {
        current = blackNode.children[0];

        if (showVariations && blackNode.children.length > 1) {
          const nextWhiteVars = blackNode.children.slice(1);
          rows.push(
            <div
              key={`vars-next-${blackNode.id}`}
              className={styles.variationsBlock}
            >
              {nextWhiteVars.map((v) => (
                <div key={v.id} className={styles.variationItem}>
                  {renderRows(v, depth + 1)}
                </div>
              ))}
            </div>
          );
        }
      } else if (whiteNode && !blackNode && whiteNode.children.length > 0) {
        current = whiteNode.children[0];
      } else {
        // Hết nhánh
        current = null;
      }
    }

    return rows;
  };

  return (
    <div className={styles.moveBoardWrapper}>
      <MoveNavigator onNavigate={onNavigate} />
      <div className={styles.moveList} ref={scrollRef}>
        {/* Bắt đầu render từ con đầu tiên của Root */}
        {rootNode && rootNode.children.length > 0 ? (
          renderRows(rootNode.children[0])
        ) : (
          <div className={styles.emptyText}>Chưa có nước đi</div>
        )}
        <div ref={movesEndRef} />
      </div>
    </div>
  );
}

export default MoveBoard;
