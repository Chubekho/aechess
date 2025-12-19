# AECheSS — Project Documentation & Context (Master Record)

> **Role of this file**: This is the **Long-term Memory** of the project. It contains architecture details, business logic, schema definitions, and technical decisions. Use this to restore context after a chat memory reset.

## 1. Project Identity & Stack

- **Name**: AECheSS (Realtime Chess Application).
- **Core Philosophy**: A robust, full-stack chess platform focusing on realtime performance, stability, and dark-mode aesthetics (inspired by Lichess/Chess.com).
- **Tech Stack**:
  - **Frontend**: React (Vite), SCSS Modules, Axios, Socket.IO-Client, Chart.js, React-Modal.
  - **Backend**: Node.js, Express, Socket.IO (Server), MongoDB (Mongoose), Passport.js (Google Auth).
  - **DevOps/Tools**: Git, Nodemon, Concurrently.

## 2. Directory Structure & Key Files (Verified)

### Client (`/client/src`)

- **`main.jsx`**: Entry point. Imports global styles (`styles/main.scss`).
- **`components/`**: Shared UI & Logic components.
  - **`guards/`**: Security Wrappers (`AdminGuard.jsx`).
  - **`AppRoute/`**: Centralized routing & Provider wrapping.
  - `GameInfoPanel/`, `MoveBoard/`, `CapturedPieces/`, `PlayerInfoBox/`: Core Gameplay UI.
  - `Modal/`, `ToastMessage/`: Feedback UI.
- **`context/`**: Barrel exported via hooks.
  - `AuthContext`, `SocketContext`, `ToastContext`.
- **`hooks/`**: Custom hooks (`useOnlineGame`, `useFullGameAnalysis`, etc.).
- **`layouts/`**:
  - `AdminLayout/`: **Dedicated Admin UI** (Sidebar + Outlet).
  - `AuthLayout/`: Clean UI for Login/Register.
  - `DefaultLayout/`: Main Player UI (Header + Nav).
- **`pages/`**:
  - **`Admin/`**: Administrative Modules.
    - `Dashboard/`: Stats Overview.
    - `GameMonitor/`: Real-time game supervision (`ActiveGameList`).
    - `UserManager/`: User management (`UserTable` component).
  - `GamePage/`: **Core Gameplay**.
  - `Analysis/`: Game review tool.
  - `Lobby/`, `PlayAI/`, `PlayFriend/`, `Profile/`, `Puzzle/`.
- **`styles/`**: Global SCSS.
  - `variables.scss`: Color tokens & mixins.
  - `main.scss`, `reset.scss`.
- **`utils/`**: Helper logic (`axiosConfig.js`, `chessAnalysis.js`, `chessUtils.js`, `validators.js`).

### Server (`/server`)

- **`index.js`**: App entry point. Connects DB, CORS, Routes, and Socket.IO.
- **`controllers/`**: `authController`, `adminController`, `gameController`, `userController`, etc.
- **`middleware/`**:
  - `authMiddleware.js`: Verify JWT.
  - `adminMiddleware.js`: **RBAC** (Verify `role === 'admin'`).
  - `socketAuth.js`: Socket handshake verification.
- **`models/`**: Mongoose Schemas (`User`, `Game`, `Puzzle`).
- **`routes/`**: `authRoutes`, `adminRoutes`, `gameRoutes`, etc.
- **`socket/`**: **Realtime Core Logic**.
  - `gameHandlers.js`: Move validation, Game creation (Active).
  - `gameEndHandler.js`: Game completion logic.
  - `matchmakingHandlers.js`, `roomHandlers.js`.

## 3. Database Schema (Detailed)

### User Model (`User.js`)

- `username`: String (Unique, Lowercase).
- `email`: String (Unique).
- `role`: String (Enum: `['user', 'admin']`, Default: `'user'`). **(New)**
- `isActive`: Boolean (Default: `true`). Used for Soft Ban. **(New)**
- `ratings`: Nested Object (`bullet`, `blitz`, `rapid`, `classical`).
- `authProvider`: 'google' | 'local'.

### Game Model (`Game.js`)

- `whitePlayer`, `blackPlayer`: ObjectId (Ref User).
- `status`: String (`"active"`, `"completed"`, `"aborted"`). Default: `"active"`. **(New)**
- `fen`: String (Real-time board state). **(New)**
- `result`: String (`"1-0"`, `"0-1"`, `"1/2-1/2"`, `"*"`). Default: `"*"` (Not required initially).
- `pgn`: String (Full move history).
- `endReason`: String (`"checkmate"`, `"resignation"`, `"admin_intervention"`, etc.).

## 4. Complex Business Logic & Flows

### A. Authentication & RBAC

1.  **Login**: User receives JWT.
2.  **Client State**: `/api/auth/me` returns `{ user, role, isActive }`.
3.  **Protection**:
    - **API**: `verifyAdmin` middleware blocks non-admins (403).
    - **UI**: `AdminGuard` redirects non-admins to Home.

### B. Active Game Persistence (Crash Recovery)

- **Old Flow**: Save to DB only when game ends.
- **New Flow (Refactored)**:
  1.  **Match Start**: Immediately `Game.create({ status: 'active', fen: startPos })`.
  2.  **During Game**: Server memory tracks state.
  3.  **Game End**: `Game.findByIdAndUpdate(...)` sets `status: 'completed'` and final PGN.
  4.  **Admin Abort**: Admin can force `status: 'aborted'` via Dashboard.

### C. Spectator Mode

- **Logic**: If `socket.user.id` is not White or Black player -> Role is **Spectator**.
- **UI**: Draggable pieces disabled, "Resign" hidden, "Watching" badge shown.

### D. Move Analysis System

- **Logic**: `useFullGameAnalysis` (Worker) -> `AnalysisPage` (Map Object by FEN) -> `MoveBoard` (O(1) Lookup).
- **Visualization**: Best Move (Green Star), Mistake (Orange ?), Blunder (Red ??).

## 5. Admin Module Implementation

> **Goal**: A dedicated Lichess-style portal for system management.

**1. Architecture**
- **Isolated Layout**: `AdminLayout` (Sidebar-based) vs `DefaultLayout` (Header-based).
- **Atomic Components**: `UserTable`, `ActiveGameList` are isolated in their respective pages.

**2. Features**
- **Dashboard**: Stats (Total Users, Active/Completed Games) via `Promise.all`.
- **User Manager**: List users, View Details, **Ban/Unban** (Toggle `isActive`).
- **Game Monitor**: View live games (populated from DB). **Force Abort** action for stuck games.

**3. Styling Strategy**
- **Variables**: Extends `variables.scss` with admin-specific tokens (`--color-admin-sidebar-bg`, `--color-status-active`).
- **SCSS Standards**: Strictly uses `@use "@/styles/variables.scss" as *;`.

## 6. Socket Event Reference

### Client -> Server

- `join_room`, `make_move`, `resign`, `offer_draw`, `accept_draw`, `decline_draw`.

### Server -> Client

- `room_joined`, `move_made`, `game_over`, `draw_offered`, `error`.

## 7. Development Protocols (Strict)

**A. Coding Environment Constraints**
- **NO SHELL COMMANDS**: AI must NOT run `npm`, `mkdir`, `touch`. Only generate code.
- **File Creation**: User handles file creation based on paths provided by AI.

**B. CSS/SCSS Standards**
- **Deprecation**: `@import` is BANNED.
- **Requirement**: MUST use `@use "@/styles/variables.scss" as *;` in every module needing variables.
- **Variable Usage**: Check `variables.scss` first. If a color is missing, prompt user to add it.

**C. Architecture Patterns**
- **Barrel Exports**: Import hooks from `hooks/index.js`, not directly from Context.
- **Component Isolation**: Admin components (`UserTable`) stay inside `pages/Admin/...` folder structure.

## 8. Environment Variables

```env
PORT=8080 (or 5000)
MONGO_URI=mongodb+srv://...
JWT_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
CLIENT_URL=http://localhost:5173
```
---

### Những điểm tôi đã tối ưu:###
1.  **Hợp nhất cấu trúc (Consolidation):**
    * Xóa bỏ các phần E, F, G, H ở cuối file cũ.
    * Logic Admin được đưa vào mục **5. Admin Module Implementation**.
    * Logic lưu game Active được đưa vào mục **4. Complex Business Logic (Section B)**.
    * Schema `User` và `Game` được cập nhật ngay tại mục **3. Database Schema**.
2.  **Cập nhật Directory Tree:** Phản ánh đúng cấu trúc thực tế từ ảnh bạn gửi (thêm `guards`, cấu trúc `pages/Admin`, `layouts/AdminLayout`).
3.  **Cập nhật Rules (Mục 7):** Thêm rule cứng về việc **Cấm dùng Shell Command** và **Bắt buộc dùng `@use` SCSS** để tránh lỗi lặp lại.
4.  **Loại bỏ rác:** Xóa các mục "Current Work Status" cũ kỹ không còn đúng (ví dụ: Mobile Responsiveness, Deploy... những thứ chưa làm hoặc đã cũ).
