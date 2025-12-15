# AECheSS — Project Context (AI prompt summary)

## Purpose
- Provide a concise, self-contained description of the repository so an AI can reason about architecture, run/develop steps, key files, and event shapes.
- **Current Status**: Refining "Lobby" (Matchmaking UX, Timer Logic) and "Profile" features.

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
  - `Lobby/index.jsx`: **(Updated)** Matchmaking hub.
    - Features: Time control selection, "Searching" state management (Modal vs Panel), Game History integration.
    - **Logic**: Uses `useRef` for accurate matchmaking timer (independent of re-renders).
  - `GamePage`: Chessboard logic.
  - `Profile/index.jsx`: Main profile wrapper. Handles tabs (Overview, Friends, Clubs).
    - `StatsChart.jsx`: Renders Radar Chart (Skills) & Doughnut Chart (Win/Loss) using `chart.js`.
    - `FriendsTab.jsx`: Displays friend list with "All/Requests/Sent" sub-tabs.
    - `GameHistory/index.jsx`: Table of recent games.
- **Utilities**: `client/src/utils/axiosConfig.js` (Interceptor setup).

## Server (`server/`)
- **Entry**: `server/index.js`
- **Auth**: JWT for REST/Socket; Google OAuth (`passport.js`).
- **Middleware**: `authMiddleware.js` (REST), `socketAuth.js` (Socket).
- **Controllers**:
  - `friendController.js`: Handles friend requests, accept/deny, and listing friends.
  - `gameController.js`: Fetch game history (`/games/history`).
- **Socket Handlers**: `socketHandler.js`, `roomHandlers.js`, `gameHandlers.js`.

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
- `_id`: ObjectId
- **`whitePlayer`**, **`blackPlayer`**: ObjectId (Ref `User`).
- **`result`**: String (`"1-0"`, `"0-1"`, `"1/2-1/2"`).
- `isRated`: Boolean.
- `pgn`: String.
- `timeControl`: String (e.g., "10+5").
- `createdAt`: Date.

### `Friendship` (`server/models/Friendship.js`)
- `requester`: ObjectId (Ref `User`).
- `recipient`: ObjectId (Ref `User`).
- `status`: String (`"pending"`, `"accepted"`).

## Key API Flows & Implementations

### 1. Lobby & Matchmaking (UX Logic)
- **States**: `idle` -> `searching_modal` (Overlay) <-> `searching_panel` (Minimized) -> `found_modal` -> `accepted_modal` -> `gameStart`.
- **Timer Logic**:
  - Problem: Timer resets when switching between Modal and Panel views due to component re-render.
  - Solution: Use `useRef` to store `startTime` timestamp. The timer interval calculates `Date.now() - startTime` instead of incrementing a counter.
- **Events**:
  - Client emits `findMatch`.
  - Server emits `matchFound` -> Client shows "Match Found" modal.
  - Client emits `acceptMatch`.
  - Server emits `gameStart` (when both accept) -> Redirect to `/game/:id`.

### 2. Profile Statistics
- **Endpoint**: `GET /games/history?limit=100&userId={targetId}`
- **Logic**: Frontend calculates Win/Loss/Draw stats by iterating through recent games and comparing `whitePlayer._id` with current `user.id`.

### 3. Friend List Logic
- **Endpoint**: `GET /friends/list?userId={targetId}`
- **Logic**: Supports viewing other users' friends via `userId` query param. Backend filters `Friendship` docs to return the *other* user in the pair.

## Realtime Flow (Socket.IO)
- **Matchmaking**: `findMatch` -> `matchFound` -> `acceptMatch` -> `gameStart`.
- **Moves**: `makeMove({ gameId, move })` -> Server validates -> `movePlayed`.

## Conventions & Notes
- **User Identification**: Always prefer `_id`.
- **Frontend ID Check**: Convert to string (`id.toString()`) before comparing.
- **Styling**: SCSS Modules (`Component.module.scss`).

---

## Recent Work Log
1.  **Lobby UX Optimization**:
    - Implemented `useRef` based timer to prevent reset when minimizing search modal.
    - Consolidated searching states (`searching_modal`, `searching_panel`) for better UX flow.
    - Integrated `GameHistory` into Lobby.
2.  **Fixed Friend Controller**: Updated `getFriendsList` for "View Friends of Friend".
3.  **Implemented Profile UI**: Stats Charts (Radar/Doughnut) & Tabs.