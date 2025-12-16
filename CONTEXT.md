# AECheSS — Project Context (AI prompt summary)

## Purpose

- Provide a concise, self-contained description of the repository so an AI can reason about architecture, run/develop steps, key files, and event shapes.
- **Current Status**: Implemented **Spectator Mode** and polished Game UI components.

## Repository Overview

- Full-stack realtime chess app with a React + Vite client and an Express + Socket.IO server.
- **Tech Stack**:
  - **Client**: React (Vite), SCSS (Modules), Chart.js (Statistics), Axios, React Modal.
  - **Server**: Node.js/Express, Socket.IO, MongoDB (Mongoose).

## Client (`client/`)

- **Entry**: `client/src/main.jsx`, `client/src/App.jsx`
- **Key Contexts**:
  - `AuthProvider.jsx`: REST auth & token handling.
  - `SocketProvider.jsx`: Socket connection with JWT token query.
- **Key Pages & Components**:
  - `Lobby/index.jsx`: Matchmaking hub with `useRef` based timer logic.
  - `GamePage`: Chessboard logic. Handles both Players and Spectators.
    - **Spectator Logic**: Disables board interaction (`arePiecesDraggable=false`), shows "Watching" badge, uses `FlipBoardButton` for manual orientation.
  - `AnalysisPage`: Game analysis tool. Now uses shared `FlipBoardButton`.
  - `Profile/index.jsx`: Main profile wrapper.
    - `StatsChart.jsx`: Renders Radar Chart (Skills) & Doughnut Chart (Win/Loss).
    - `GameHistory/index.jsx`: Uses `PlayerInfo` sub-component for safe navigation.
- **Shared Components**:
  - `FlipBoardButton`: **(New)** Reusable component for flipping board orientation (Used in GamePage, Analysis).
  - `GameInfoPanel`: Displays move list and game controls.
    - **Logic**: Accepts `isSpectator` prop to hide "Resign" and "Draw" buttons.
  - `PlayerInfoBox`: Displays avatar, name, rating, and timer.
- **Hooks**:
  - `useOnlineGame.js`: **(Updated)** Handles socket events for gameplay.
    - **Logic**: Identifies `role` ('player' vs 'spectator') from `joinRoom` response. If spectator, disables `makeMove` emission but listens to `movePlayed`.

## Server (`server/`)

- **Entry**: `server/index.js`
- **Auth**: JWT for REST/Socket; Google OAuth (`passport.js`).
- **Middleware**: `authMiddleware.js` (REST), `socketAuth.js` (Socket).
- **Controllers**:
  - `friendController.js`: Friend list logic.
  - `gameController.js`: History API returns populated usernames.
- **Socket Handlers**:
  - `roomHandlers.js`: **(Updated)** Handles `joinRoom` logic.
    - **Logic**: Checks if room is full (2 players). If full and user is not a reconnecting player -> returns `{ success: true, role: 'spectator' }`.
  - `gameHandlers.js`: Handles moves and game state.

## DB Schema Fields

### `User` (`server/models/User.js`)

- `_id`: ObjectId
- `username`: String (unique, lowercase)
- `email`: String (unique)
- `displayName`: String
- `avatarUrl`: String
- **`ratings`**: Object (`bullet`, `blitz`, `rapid`, `classical`) - Default 1200.
- **`puzzleStats`**: Object (`rating`, `rd`, `vol`).
- `googleId`: String.

### `Game` (`server/models/Game.js`)

- **Confirmed Structure**:
  - `_id`: ObjectId
  - `whitePlayer`: ObjectId (Ref `User`)
  - `blackPlayer`: ObjectId (Ref `User`)
  - `result`: String (`"1-0"`, `"0-1"`, `"1/2-1/2"`)
  - `isRated`: Boolean
  - `whiteRating`: Number (Rating snapshot)
  - `blackRating`: Number (Rating snapshot)
  - `pgn`: String
  - `timeControl`: String (e.g., "10+5")
  - `createdAt`, `updatedAt`: Date

### `Friendship` (`server/models/Friendship.js`)

- `requester`: ObjectId (Ref `User`)
- `recipient`: ObjectId (Ref `User`)
- `status`: String (`"pending"`, `"accepted"`).

## Key API Flows & Implementations

### 1. Spectator Mode Flow

- **Client**: Emits `joinRoom`.
- **Server**: Checks `activeGames`.
  - If `players.length < 2`: Adds as Player (role: 'player').
  - If `players.length >= 2` & not reconnecting: Adds to room but returns `role: 'spectator'`.
- **Client**:
  - Sets `isSpectator = true`.
  - Disables board inputs.
  - Hides Action Buttons (Resign/Draw).
  - Listens to `movePlayed` to update board state in real-time.

### 2. Lobby & Matchmaking

- **States**: `idle` -> `searching` (Modal/Panel) -> `found` -> `gameStart`.
- **Timer**: Uses `useRef` to track `startTime` for consistent countdowns.

### 3. Game History & Navigation

- **Endpoint**: `GET /games/history`.
- **Logic**: Returns populated players. Frontend links to `/profile/${username}`.

## Conventions & Notes

- **User Identification**: Always prefer `_id` for logic, `username` for URLs.
- **Frontend ID Check**: Convert to string (`id.toString()`) before comparing.
- **Styling**: SCSS Modules.

---

## Recent Work Log

1.  **Implemented Spectator Mode**:
    - Updated `roomHandlers.js` to support non-player connections.
    - Updated `useOnlineGame` hook to handle spectator state.
    - UI updates in `GamePage` (Badge, Board lock).
2.  **UI Refactoring**:
    - Created `FlipBoardButton` component and applied to `GamePage` & `AnalysisPage`.
    - Updated `GameInfoPanel` to handle spectator view (hidden controls).
3.  **Refactored GameHistory**: Optimized component with `PlayerInfo` sub-component and safer navigation.
