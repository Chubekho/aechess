# AECheSS — Project Documentation & Context (Master Record)

> **Role of this file**: This is the **Long-term Memory** of the project. It contains architecture details, business logic, schema definitions, and technical decisions. Use this to restore context after a chat memory reset.

## 1. Project Identity & Stack

- **Name**: AECheSS (Realtime Chess Application).
- **Core Philosophy**: A robust, full-stack chess platform focusing on realtime performance, stability, and dark-mode aesthetics (inspired by Lichess/Chess.com).
- **Tech Stack**:
  - **Frontend**: React (Vite), SCSS Modules, Axios, Socket.IO-Client, Chart.js, React-Modal.
  - **Backend**: Node.js, Express, Socket.IO (Server), MongoDB (Mongoose), Passport.js (Google Auth).
  - **DevOps/Tools**: Git, Nodemon, Concurrently.

## 2. Directory Structure & Key Files (Updated)

### Client (`/client/src`)

- **`main.jsx`**: Entry point, renders App and imports global styles (`styles/main.scss`).
- **`components/`**: Shared UI components.
  - `AppRoute/`: Centralized routing logic (Protected Routes, Layout wrapping).
  - `CapturedPieces/`: Visualizes captured material and advantage score.
  - `FlipBoardButton/`: Toggles board orientation locally.
  - `GameHistory/`: Displays move list or PGN.
  - `GameInfoPanel/`: Main control panel (Moves, Chat, Actions).
  - `guards/`: **Security Barriers**.
    - `AdminGuard.jsx`: Protects routes requiring `role: 'admin'`.
  - `Modal/`: Reusable modal for game ends/prompts.
  - `MoveBoard/`: Visual move list with evaluation icons.
  - `PlayerInfoBox/`: Player avatar, timer, rating, and captured pieces.
  - `ToastMessage/`: Global notification UI.
- **`context/`**: Strict Separation of Definition vs Implementation.
  - `AuthContext.js` / `AuthProvider.jsx`: User state & Google Auth.
  - `SocketContext.js` / `SocketProvider.jsx`: Real-time connection management.
  - `ToastContext.js` / `ToastProvider.jsx`: Notification system logic.
- **`hooks/`**: Custom hooks (Barrel exported via `index.js`).
  - `useFullGameAnalysis.js`: Stockfish worker integration.
  - `useGameNavigation.js`: Logic for traversing move history.
  - `useOnlineGame.js`: Core socket event handlers for gameplay.
  - `useStockfish.js`: Engine evaluation logic.
- **`layouts/`**:
  - `AdminLayout/`: **Dedicated Admin Interface**.
    - `components/SideBar/`: Navigation specific to admin tasks.
    - `index.jsx`: Layout shell (Sidebar + Outlet).
  - `AuthLayout/`: For Login/Register pages (Clean UI).
  - `DefaultLayout/`: For main app (Header, Footer, Navigation, User dropdown).
- **`pages/`**:
  - `Admin/`: **Administrative Modules**.
    - `Dashboard/`: Overview stats.
    - `GameMonitor/`: Real-time game supervision.
      - `ActiveGameList/`: Component to list live games.
    - `UserManager/`: User administration.
      - `components/UserTable/`: Atomic component for user data rows & actions.
  - `Analysis/`: Game review tool (`AnalysisSettings`, `EngineOutput`, `EvaluationBar`, `PlayerReportCard`).
  - `Auth/`: `Login`, `Register`, `AuthCallback`, `SetUsername`.
  - `GamePage/`: **Core Gameplay**. Orchestrates Board + InfoPanel.
  - `Lobby/`: Matchmaking and room creation.
  - `PlayAI/`: PvE mode.
  - `PlayFriend/`: Custom room mode.
  - `Profile/`: User stats and history.
  - `Puzzle/`: Tactics trainer.
- **`styles/`**: Global SCSS (`main.scss`, `reset.scss`, `variables.scss`).
- **`utils/`**:
  - `axiosConfig.js`: API interceptors.
  - `chessAnalysis.js`: Win chance & Move classification logic.
  - `chessUtils.js`: Board layout & Material calculation.
  - `gameHelpers.js`: Time formatting & misc helpers.
  - `GameTree.js`: Data structure for move variations.
  - `validators.js`: Form validation.

### Server (`/server`)

- **`index.js`**: App entry point. Connects DB, CORS, Routes, and Socket.IO attachment.
- **`config/`**:
  - `passport.js`: Google OAuth strategy configuration.
- **`controllers/`**: Logic for REST endpoints.
  - `authController.js`: Login/Register logic.
  - `friendController.js`: Friend request logic.
  - `gameController.js`: Game history, PGN retrieval.
  - `puzzleController.js`: Logic for tactics trainer.
  - `userController.js`: User profile & stats management.
- **`middleware/`**:
  - `authMiddleware.js`: JWT verification for HTTP routes.
  - `logger.js`: Request logging.
  - `socketAuth.js`: JWT verification for Socket connection handshake.
- **`models/`**: Mongoose Schemas.
  - `Friendship.js`, `Game.js`, `Puzzle.js`, `User.js`.
- **`routes/`**: API Route definitions.
  - `authRoutes.js`, `friendRoutes.js`, `gameRoutes.js`, `puzzleRoutes.js`, `userRoutes.js`.
- **`socket/`**: **Realtime Core Logic**.
  - `socketHandler.js`: Main socket entry point.
  - `matchmakingHandlers.js`: Queue logic & pairing.
  - `roomHandlers.js`: Joining rooms, determining Player vs Spectator.
  - `gameHandlers.js`: Moves, validation, time sync.
  - `gameEndHandler.js`: Checkmate/Resign/Draw processing.
  - `helpers.js`: Shared socket utilities.
- **`utils/`**:
  - `eloCalculator.js`: Logic for rating updates after game end.
  - `pgnFormatter.js`: Converts game state to PGN string.
  - `seedPuzzles.js`: Database seeding script.
  - `validators.js`: Input validation helpers.
  - `CreateShortId.js`: Utility for generating room IDs.

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

## 5.1 Detailed Sub-Systems & Implementations (New Modules)

### A. System Architecture Standards (Strict Patterns)

- **Core Philosophy**: Maintainability via Separation of Concerns and Barrel Exports.

**1. Context Separation Pattern**
We strictly separate the **Definition** from the **Implementation** to avoid circular dependencies and keep logic clean.

- **Definition (`Context.jsx`)**: Only creates the `Context` object and exports the `useHook`. _No state, no logic._
- **Provider (`Provider.jsx`)**: Imports the Context. Handles `useState`, `useEffect`, side-effects, and renders the `<Context.Provider>`.

**2. The "Barrel" Export Pattern (`hooks/index.js`)**

- **Rule**: Components must **NEVER** import directly from `../context/XProvider`.
- **Standard**: Always import from the central hook registry.
- **Structure**:
  ```javascript
  // client/src/hooks/index.js
  export { useAuth } from "@/context/AuthContext";
  export { useSocket } from "@/context/SocketContext";
  export { useToast } from "@/context/ToastContext"; // Logic + UI Feedback
  // ... other custom hooks
  ```

**3. Provider Hierarchy (`AppRoute.jsx`)**
Crucial for Error Handling. The UI Feedback provider must wrap others to catch their errors.

```jsx
<Router>
  <ToastProvider>
    <AuthProvider>
      <SocketProvider>
        <Routes>...</Routes>
      </SocketProvider>
    </AuthProvider>
  </ToastProvider>
</Router>
```

### B. Game Analysis & Move Evaluation System

> **Goal**: Visualize move quality (Best, Mistake, Blunder) directly on the `MoveBoard` without impacting render performance.

**1. Architecture & Data Flow**

- **Source**: `useFullGameAnalysis.js` (Stockfish Worker) returns `report.moves` (Array).
- **Transformation (Critical Optimization)**:
  - In `AnalysisPage.jsx`, the Array is converted to a **Map Object** keyed by **FEN string**.
  - _Why?_: `MoveBoard` renders recursively. Using `Array.find()` inside every node creates O(N²) complexity. `Map.get(fen)` ensures **O(1)** lookup performance.
- **Display**: `MoveBoard` receives `analysisData` (Map) as a prop.

**2. Classification Logic (`utils/chessAnalysis.js`)**
Moves are classified based on **Win Chance Difference** (Sigmoid conversion of Centipawns).

| Classification      | Threshold (Diff) | UI Representation            | Color              |
| :------------------ | :--------------- | :--------------------------- | :----------------- |
| **Best**            | $\le$ 0.5%       | Icon: `fa-star`              | Green (`#96bc4b`)  |
| **Excellent**       | $\le$ 3%         | Icon: `thumbs-up`            | Green (`#96bc4b`)  |
| **Good/Inaccuracy** | < 15%            | **Hidden** (Reduced Clutter) | Default            |
| **Mistake**         | < 25%            | Text: **?** (Bold)           | Orange (`#ff9800`) |
| **Blunder**         | $\ge$ 25%        | Text: **??** (Bold)          | Red (`#cc3333`)    |

**3. Component Implementation (`MoveBoard/index.jsx`)**

- **Logic**: Checks `analysisData[node.fen]` during render.
- **Filtering**: Logic strictly checks against a whitelist `VISIBLE_TYPES` (Best, Mistake, Blunder) to prevent rendering unwanted icons.
- **Styling**: Uses CSS Modules (`.type-blunder`, `.type-mistake`) in `MoveBoard.module.scss` to override text colors and inject evaluation symbols.

### C. Captured Pieces & Material System

> **Goal**: Display captured pieces and material advantage (+1, +3) dynamically based on the board state.

**1. Architecture & Data Flow**

- **Logic Source**: `utils/chessUtils.js` -> `calculateMaterial(fen)`.
  - Parses FEN string to count current pieces.
  - Compares with Initial Set (1Q, 2R, 2B, 2N, 8P).
  - Returns `{ white: { score, captured: [] }, black: { ... } }`.
- **Component**: `components/CapturedPieces/index.jsx`.
  - Standalone component designed for reusability (GamePage, PlayAI, Analysis).
  - **Visuals**: Uses FontAwesome icons. Flex-wrap handles overflow (pawns wrap to next line).
- **Integration**: `PlayerInfoBox.jsx` wraps this component.
  - **Layout Logic**:
    - Opponent (Top): Captured pieces displayed _above_ Player Name.
    - Self (Bottom): Captured pieces displayed _below_ Player Name.

**2. Styling Strategy**

- **Dynamic Coloring**: Pieces are styled based on the _viewer's perspective_ vs. _piece color_.
  - `.pieceWhite`: Light gray text with shadow.
  - `.pieceBlack`: Dark gray text.
- **Responsive Layout**: The container uses `flex-wrap: wrap` so if many pieces are captured, low-value pieces (Pawns) naturally flow to the second row.

### D. Rating Change & End-Game Visualization
> **Goal**: Provide immediate visual feedback on Rating gain/loss when a match concludes.

**1. Logic & Data Flow**
- **Trigger**: Socket event `game_over` returns `gameResult` containing `newRating: { white: number, black: number }`.
- **Calculation (`GamePage.jsx`)**:
  - `currentRating` = `gameResult.newRating[side]` (if exists) OR `player.rating`.
  - `diff` = `newRating` - `initialRating`.
- **Prop Drilling**: `ratingDiff` passed from `GamePage` -> `PlayerInfoBox`.

**2. Visual Implementation (`PlayerInfoBox`)**
- **Condition**: Only renders if `ratingDiff !== null`.
- **Styles**:
  - **Positive**: Green (`#629924`) with `+` prefix.
  - **Negative**: Red (`#cc3333`).
  - **Animation**: Uses `@keyframes slideFadeIn` to delay appearance (0.2s) and slide up, drawing attention after the game ends.

### E. Admin Module (RBAC & Management System)
> **Goal**: A secure, isolated portal for system administration, styled independently (Lichess Dark Theme) and protected by Role-Based Access Control (RBAC).

**1. Security Architecture (Full-Stack RBAC)**

- **Database**: `User` model includes `role: 'user' | 'admin'` and `isActive: boolean`.
- **API Security**:
  - Endpoint `/api/auth/me` updated to return `{ ..., role, isActive }` for initial client state.
  - Middleware `verifyAdmin` (Server) blocks unauthorized API requests (403 Forbidden).
- **Client Security (`components/guards/AdminGuard.jsx`)**:
  - Wraps all `/admin` routes.
  - Checks `user.role === 'admin'`. If false, redirects to `/` immediately.

**2. Component Architecture (Atomic Design)**
The Admin module follows a strict component hierarchy to maintain scalability:

- **Layout**: `layouts/AdminLayout` is completely separate from `DefaultLayout`. It uses a dedicated `SideBar` component.
- **Pages as Containers**:
  - `UserManager/index.jsx`: Handles Data Fetching (`GET /users`) and State Management (Optimistic UI updates for Ban/Unban).
  - `UserManager/components/UserTable/`: **Pure Presentational Component**. Receives `users` array and renders the Lichess-style table. Isolated styles in `UserTable.module.scss`.
- **Game Monitor**:
  - `GameMonitor/ActiveGameList/`: Specialized component to list live matches with Force End/Draw controls.

**3. Styling Strategy**

- **Variables**: Extends `variables.scss` with admin-specific tokens (`--color-admin-sidebar-bg`, `--color-table-header-bg`).
- **Scoping**: Each module (`Dashboard`, `UserTable`) uses strict CSS Modules to prevent style leakage into the main game app.

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

## 9. AI Instructions & Workflow Protocols

**CRITICAL INSTRUCTION FOR AI:**
Whenever you complete a significant coding task (New Feature, Refactor, or Logic Change), you must **AUTOMATICALLY** generate a "Context Update Block" at the end of your response without being asked.

1.  **Format**: Markdown block matching the style of Section 5.1.
2.  **Content**: Architecture details, Data Flow, Key Files, and Logic Decisions.
3.  **Goal**: The user will copy-paste this block into this file to maintain long-term memory.

### Hướng dẫn tiếp theo:

**Quy trình làm việc (Workflow):** Lần tới, khi yêu cầu AI code xong một tính năng (ví dụ: Chat System), hãy nhắc AI: _"Gen code update context cho tính năng Chat"_. AI sẽ xuất ra block Markdown tương tự để bạn lưu trữ.
