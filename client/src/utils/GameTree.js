// client/src/utils/GameTree.js

export class MoveNode {
  constructor(san, fen, parent = null) {
    this.id = crypto.randomUUID(); // Tạo ID duy nhất
    this.san = san;     // Ký hiệu (e.g., "e4")
    this.fen = fen;     // FEN sau nước đi
    this.parent = parent; // Node cha
    this.children = [];   // Các biến thể (children[0] là nhánh chính/được chọn đầu tiên)
  }

  // Thêm nước đi con (nếu chưa có)
  addChild(san, fen) {
    const existingChild = this.children.find(c => c.san === san);
    if (existingChild) {
      return existingChild; // Trả về node cũ nếu nước đi đã tồn tại
    }
    const newChild = new MoveNode(san, fen, this);
    this.children.push(newChild);
    return newChild;
  }
}

// Hàm lấy danh sách nước đi từ Root đến Node hiện tại (Quá khứ)
export const getPathToNode = (node) => {
  const path = [];
  let current = node;
  while (current && current.parent) { // Bỏ qua Root (bàn cờ trống)
    path.unshift(current);
    current = current.parent;
  }
  return path;
};

// Hàm lấy nhánh "Main Line" tiếp theo từ một Node (Tương lai)
export const getMainLineFromNode = (node) => {
  const future = [];
  let current = node;
  // Luôn đi theo con đầu tiên (children[0]) - Đây là logic "nhánh chính/gần nhất"
  while (current.children.length > 0) {
    current = current.children[0];
    future.push(current);
  }
  return future;
};

// Hàm lấy danh sách đầy đủ để hiển thị lên MoveBoard
export const getDisplayList = (activeNode) => {
  // 1. Lấy quá khứ (từ đầu đến node đang chọn)
  const past = getPathToNode(activeNode);
  
  // 2. Lấy tương lai (từ node đang chọn đi tiếp theo nhánh chính)
  const future = getMainLineFromNode(activeNode);
  
  return [...past, ...future];
};