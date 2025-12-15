# AECheSS — Project Context (AI prompt summary)

## Purpose

- Provide a concise, self-contained description of the repository so an AI can reason about architecture, run/develop steps, key files, and event shapes.
- **Current Status**: Polishing "Profile" UX (Navigation, History) and "Lobby" features.

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
  - `GamePage`: Chessboard logic.
  - `Profile/index.jsx`: Main profile wrapper. Handles `username` param validation.
    - `StatsChart.jsx`: Renders Radar Chart (Skills) & Doughnut Chart (Win/Loss).
    - `FriendsTab.jsx`: Friend list management.
    - `GameHistory/index.jsx`: **(Updated)** Table of recent games.
      - **Logic**: Uses `PlayerInfo` sub-component to handle safe navigation. Links to `/profile/:username`. Handles anonymous/undefined users gracefully.
- **Utilities**: `client/src/utils/axiosConfig.js` (Interceptor setup).

## Server (`server/`)

- **Entry**: `server/index.js`
- **Auth**: JWT for REST/Socket; Google OAuth (`passport.js`).
- **Middleware**: `authMiddleware.js` (REST), `socketAuth.js` (Socket).
- **Controllers**:
  - `friendController.js`: Friend list logic.
  - `gameController.js`: **(Updated)** `getGameHistory` now ensures `whitePlayer` and `blackPlayer` populate the `username` field for frontend navigation.
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

- **Confirmed Structure** (Ref: `image_0b3820.png`):
  - `_id`: ObjectId
  - `whitePlayer`: ObjectId (Ref `User`)
  - `blackPlayer`: ObjectId (Ref `User`)
  - `result`: String (`"1-0"`, `"0-1"`, `"1/2-1/2"`)
  - `isRated`: Boolean
  - `whiteRating`: Number (Rating snapshot)
  - `blackRating`: Number (Rating snapshot)
  - `pgn`: String (Contains tags like `[Event]`, `[Site]`, `[Date]`)
  - `timeControl`: String (e.g., "10+5")
  - `createdAt`, `updatedAt`: Date

### `Friendship` (`server/models/Friendship.js`)

- `requester`: ObjectId (Ref `User`)
- `recipient`: ObjectId (Ref `User`)
- `status`: String (`"pending"`, `"accepted"`).

## Key API Flows & Implementations

### 1. Game History & Navigation

- **Endpoint**: `GET /games/history`
- **Logic**:
  - Backend returns game list with populated players (`username`, `displayName`).
  - Frontend (`GameHistory`) renders links pointing to `/profile/${username}`.
  - **Null Safety**: If a user is missing or username is undefined (e.g., deleted account), the link is disabled to prevent routing errors (`/profile/undefined`).

### 2. Lobby & Matchmaking

- **States**: `idle` -> `searching` (Modal/Panel) -> `found` -> `gameStart`.
- **Timer**: Uses `useRef` to track `startTime` for consistent countdowns across re-renders.

### 3. Profile Statistics

- **Logic**: Frontend fetches last 100 games to calculate Win/Loss/Draw rates dynamically using Chart.js.

## Conventions & Notes

- **User Identification**: Always prefer `_id` for logic, `username` for URLs/Navigation.
- **Frontend ID Check**: Convert to string (`id.toString()`) before comparing.
- **Styling**: SCSS Modules.

---

## Recent Work Log

1.  **Refactored GameHistory**:
    - Optimized component by creating `PlayerInfo` sub-component.
    - Updated navigation to use `username` in URL instead of `id`.
    - Added safety checks for anonymous/undefined users.
2.  **API Update**: Updated `gameController` to ensure usernames are sent in history response.
3.  **Lobby UX**: Optimized matchmaking timer and state management.
4.  **Profile Page**: Fixed potential crash when navigating to invalid/undefined profiles.
