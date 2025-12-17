# AECheSS — Project Documentation & Context (Master Record)

> **Role of this file**: This is the **Long-term Memory** of the project. It contains architecture details, business logic, schema definitions, and technical decisions. Use this to restore context after a chat memory reset.

## 1. Project Identity & Stack

- **Name**: AECheSS (Realtime Chess Application).
- **Core Philosophy**: A robust, full-stack chess platform focusing on realtime performance, stability, and dark-mode aesthetics (inspired by Lichess/Chess.com).
- **Tech Stack**:
  - **Frontend**: React (Vite), SCSS Modules, Axios, Socket.IO-Client, Chart.js, React-Modal.
  - **Backend**: Node.js, Express, Socket.IO (Server), MongoDB (Mongoose), Passport.js (Google Auth).
  - **DevOps/Tools**: Git, Nodemon, Concurrently.

## 2. Directory Structure & Key Files

### Client (`/client`)

- `src/main.jsx`: Bootstrapper, imports global styles.
- `src/context/`:
  - `AuthProvider.jsx`: Manages User State (`user`, `loading`), Login/Logout, Google Auth callback.
  - `SocketProvider.jsx`: Initializes Socket connection **only if** `user` exists. Passes `token` in `auth` query.
- `src/pages/`:
  - `GamePage/`: **CRITICAL**. Handles the chessboard logic.
    - `index.jsx`: Orchestrates `Chessboard`, `GameInfoPanel`, `PlayerInfoBox`.
    - `logic/`: (Implicit) Logic for legal moves, highlighting, and sound effects.
  - `Lobby/index.jsx`: Matchmaking UI. Uses `useRef` for visual timer to prevent re-renders.
  - `AnalysisPage/index.jsx`: Read-only board for reviewing games.
  - `Profile/`: `GameHistory`, `StatsChart` (Radar/Doughnut).
- `src/components/`:
  - `ChessBoard/`: The visual board component (likely wrapping `chessground` or custom).
  - `GameInfoPanel/`: **(Complex Logic)**. Contains Move List + Action Buttons (Resign, Draw).
  - `FlipBoardButton.jsx`: Shared component to toggle board orientation.

### Server (`/server`)

- `index.js`: Entry point. Connects DB, configures CORS, mounts Routes, attaches Socket.IO to HTTP server.
- `routes/`: REST API definitions (`auth.js`, `users.js`, `games.js`).
- `controllers/`: Logic for REST endpoints.
  - `gameController.js`: Fetches history, formatting PGN/FEN for API responses.
- `socket/`: **Realtime Core**.
  - `socketManager.js`: Main entry. Uses `socketAuth` middleware.
  - `handlers/`:
    - `roomHandlers.js`: Logic for `joinRoom` (Determines Player vs Spectator).
    - `gameHandlers.js`: Logic for `move`, `resign`, `draw` flows.
- `models/`: Mongoose Schemas (`User`, `Game`, `Friendship`).

## 3. Database Schema (Detailed)

### User Model (`User.js`)

- `username`: String (Unique, Lowercase, Trimmed). used for profile URLs.
- `email`: String (Unique).
- `ratings`: Nested Object. Keys: `bullet`, `blitz`, `rapid`, `classical`. Default value: `1200`.
- `puzzleStats`: `{ rating: Number, rd: Number }`.
- `authProvider`: 'google' | 'local'.

### Game Model (`Game.js`)

- `whitePlayer`: ObjectId (Ref User).
- `blackPlayer`: ObjectId (Ref User).
- `fen`: String (Current board state).
- `pgn`: String (Full move history).
- `timeControl`: Object or String (e.g., `{ limit: 600, increment: 5 }`).
- `status`: String (`"active"`, `"completed"`, `"aborted"`).
- `result`: String (`"1-0"`, `"0-1"`, `"1/2-1/2"`, `"*"`).
- `winner`: ObjectId (Ref User) or `null`.
- `endReason`: String (`"checkmate"`, `"resignation"`, `"timeout"`, `"draw_agreement"`, `"stalemate"`).
- `spectators`: Array of ObjectIds (Optional logging).

## 4. Complex Business Logic & Flows

### A. Authentication & Socket Handshake

1.  **Login**: User logs in via REST (returns JWT).
2.  **Socket Conn**: Client `SocketProvider` reads JWT from storage -> connects to `ws://...` with `query: { token }`.
3.  **Middleware**: Server `socketAuth.js` verifies JWT.
    - If valid: Attaches `socket.user = decodedUser`.
    - If invalid: Rejects connection (Client handles `connect_error`).

### B. Spectator Mode Implementation

- **Trigger**: User navigates to `/game/:id`.
- **Server Logic (`roomHandlers.js`)**:
  - Check active game memory/DB.
  - If `whitePlayer.id` == `socket.user.id` OR `blackPlayer.id` == `socket.user.id` -> **Role: Player**.
  - Else -> **Role: Spectator**.
- **Client Behavior**:
  - If `role === 'spectator'`:
    - `Chessboard` prop `arePiecesDraggable = false`.
    - `GameInfoPanel`: Hides "Resign/Draw" buttons.
    - UI shows "Watching" indicator.
    - Board orientation defaults to White (can be flipped).

### C. The Draw "Handshake" State Machine

Located in `GameInfoPanel` (Client) and `gameHandlers.js` (Server).

| State        | Action                       | UI (Sender)                  | UI (Receiver)                    | Server Memory                   |
| :----------- | :--------------------------- | :--------------------------- | :------------------------------- | :------------------------------ |
| **Idle**     | Player A clicks "Offer Draw" | Button: "Sent" (Disabled)    | -                                | -                               |
| **Offered**  | Socket: `offerDraw`          | Button: "Sent"               | Button: "Draw?" (Accept/Decline) | `game.drawOffer = 'w'` (or 'b') |
| **Accepted** | Player B clicks "Accept"     | -                            | -                                | Game End (1/2-1/2)              |
| **Declined** | Player B clicks "Decline"    | Button: "Offer Draw" (Reset) | Button: "Offer Draw" (Reset)     | `game.drawOffer = null`         |

### D. Timer Synchronization

- **Server**: Authoritative source. Calculates time delta between moves.
- **Client**: Uses `useEffect` and `setInterval` (or `requestAnimationFrame`) to decrease UI timer.
- **Sync**: On every `movePlayed` event, Server sends updated `{ whiteTime, blackTime }`. Client overrides local timer with server time to correct drift.

## 5. Socket Event Reference

### Client -> Server

- `join_room`: `{ gameId }`
- `make_move`: `{ gameId, from, to, promotion }`
- `resign`: `{ gameId }`
- `offer_draw`: `{ gameId }`
- `accept_draw`: `{ gameId }`
- `decline_draw`: `{ gameId }`

### Server -> Client

- `room_joined`: `{ gameId, role, fen, pgn, whiteID, blackID, timeControl }`
- `move_made`: `{ from, to, fen, timeWhite, timeBlack }`
- `game_over`: `{ result, winner, reason, newRating }`
- `draw_offered`: `{ byPlayerColor }`
- `draw_declined`: `null` (Signal to reset UI)
- `error`: `{ message }` (e.g., "Illegal move", "Not your turn")

## 6. Recent "Lessons Learned" & Fixes

1.  **Timer Re-renders**: Initially, the Lobby timer caused the whole component to re-render every second. **Fix**: Used `useRef` for the interval ID and raw DOM manipulation (or optimized state isolation) for the countdown.
2.  **Spectator Board Flip**: Spectators were confused by board orientation. **Fix**: Added `FlipBoardButton` that acts locally (does not affect game state) and remembers preference per session.
3.  **Code Organization**: Moved socket emitters (`resign`, `offer`) from `GamePage` (container) to `GameInfoPanel` (presentational). **Reason**: Clean code, the Panel owns the buttons, so it should own the handlers.

## 7. Current Work Status (The "Now")

- **Completed**:
  - Basic Gameplay (Move, History, Capture).
  - Win/Loss/Draw Logic (Checkmate, Resign, Draw Agreement).
  - Spectator Mode (View only).
  - Authentication (JWT + Google).
  - Profile Stats (Charts).
- **In Progress / Next Steps**:
  - **Chat System**: Realtime chat in the `GameInfoPanel`.
  - **Move Sounds**: "Click", "Capture", "Check" sounds.
  - **Deployment**: Configuring Docker/Nginx for production.
  - **Mobile Responsiveness**: Fixing `GameInfoPanel` layout on screens < 768px.

## 8. Environment Variables (.env)

```env
PORT=5000
MONGO_URI=mongodb+srv://...
JWT_SECRET=your_super_secret_key
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
CLIENT_URL=http://localhost:5173
```

***

### Những thay đổi chính trong bản mới này:

1.  **Directory Structure**: Liệt kê rõ các file quan trọng, giúp tôi hình dung được ngay kiến trúc dự án (Vite + Express).
2.  **Logic "Handshake"**: Mô tả chi tiết bảng trạng thái (State Machine) của tính năng Cầu hòa (Draw Offer). Đây là logic phức tạp dễ bị quên.
3.  **Socket Event Reference**: Liệt kê các event name chính xác (`join_room`, `make_move`,...). Rất quan trọng để debug khi client/server không hiểu nhau.
4.  **Database Schema**: Bổ sung chi tiết các trường trong Model, đặc biệt là `Game` và `User`.
5.  **Lessons Learned**: Ghi lại các bug đã sửa (như vụ Timer re-render) để tránh lặp lại sai lầm cũ.

Bây giờ bạn lưu file này lại nhé. Lần sau nếu cần code tiếp, tôi sẽ dựa vào đây để viết code chính xác ngay lập tức.