# AECheSS — Project Context (AI prompt summary)

## Purpose
- Provide a concise, self-contained description of the repository so an AI can reason about architecture, run/develop steps, key files, and event shapes.
- **Current Status**: Developing "Profile" features (Statistics, Friend Lists, Match History).

## Repository Overview
- Full-stack realtime chess app with a React + Vite client and an Express + Socket.IO server.
- **Tech Stack**:
  - **Client**: React (Vite), SCSS (Modules), Chart.js (Statistics), Axios.
  - **Server**: Node.js/Express, Socket.IO, MongoDB (Mongoose).

## Client (`client/`)
- **Entry**: `client/src/main.jsx`, `client/src/App.jsx`
- **Key Contexts**:
  - `AuthProvider.jsx`: REST auth & token handling.
  - `SocketProvider.jsx`: Socket connection with JWT token query.
- **Key Pages & Components**:
  - `GamePage`: Chessboard logic.
  - `Profile/index.jsx`: Main profile wrapper. Handles tabs (Overview, Friends, Clubs).
    - `OverviewTab.jsx`: Shows ratings and charts.
    - `StatsChart.jsx`: **(New)** Renders Radar Chart (Skills) & Doughnut Chart (Win/Loss) using `chart.js`.
    - `FriendsTab.jsx`: **(New)** Displays friend list with "All/Requests/Sent" sub-tabs. Supports viewing other users' friends.
    - `GameHistory/index.jsx`: Table of recent games.
- **Utilities**: `client/src/utils/axiosConfig.js` (Interceptor setup).

## Server (`server/`)
- **Entry**: `server/index.js`
- **Auth**: JWT for REST/Socket; Google OAuth (`passport.js`).
- **Middleware**: `authMiddleware.js` (REST), `socketAuth.js` (Socket).
- **Controllers**:
  - `friendController.js`: **(Updated)** Handles friend requests, accept/deny, and listing friends (supports `req.query.userId` to view others' friends).
  - `gameController.js`: Fetch game history (`/games/history`).
- **Socket Handlers**: `socketHandler.js`, `roomHandlers.js`, `gameHandlers.js`.

## DB Schema Fields (Updated)

### `User` (`server/models/User.js`)
- `_id`: ObjectId
- `username`: String (unique, lowercase)
- `email`: String (unique)
- `displayName`: String
- `avatarUrl`: String
- **`ratings`**: Object (Crucial for Stats)
  - `bullet`, `blitz`, `rapid`, `classical`: Number (Default 1200)
- **`puzzleStats`**: Object (`rating`, `rd`, `vol`)
- `googleId`: String (sparse)
- `createdAt`, `updatedAt`: Date

### `Game` (`server/models/Game.js`)
- `_id`: ObjectId
- **`whitePlayer`**: ObjectId (Ref `User`, indexed)
- **`blackPlayer`**: ObjectId (Ref `User`, indexed)
- **`result`**: String (`"1-0"`, `"0-1"`, `"1/2-1/2"`)
- `isRated`: Boolean
- `whiteRating`: Number (Snapshot at game time)
- `blackRating`: Number (Snapshot at game time)
- `pgn`: String
- `timeControl`: String (e.g., "10+5")
- `createdAt`: Date

### `Friendship` (`server/models/Friendship.js`)
- `requester`: ObjectId (Ref `User`)
- `recipient`: ObjectId (Ref `User`)
- `status`: String (`"pending"`, `"accepted"`)

## Key API Flows & Implementations

### 1. Profile Statistics (Frontend-Calculated)
- **Endpoint**: `GET /games/history?limit=100&userId={targetId}`
- **Logic**:
  - Backend does NOT store aggregated Win/Loss stats yet.
  - **Frontend (`StatsChart.jsx`)** fetches the last 50-100 games.
  - Iterates through games to calculate Win/Loss/Draw based on `game.result` and checking if `game.whitePlayer._id === user.id`.
  - Visualizes data using `react-chartjs-2`.

### 2. Friend List Logic
- **Endpoint**: `GET /friends/list?userId={targetId}`
- **Logic**:
  - If `userId` query param is present, Server returns friends of that user.
  - If missing, Server returns friends of `req.user.id`.
  - **Mapping**: Server finds `Friendship` docs where status is `accepted`, then filters out the `targetId` to return only the *other* person's details.
- **Security**: Current implementation allows Public viewing of friend lists (intended behavior). Frontend hides "Requests" and "Sent" tabs when viewing others.

### 3. Game History
- **Endpoint**: `GET /games/history`
- **Params**: `limit` (number), `userId` (optional).
- **Display**: Shows Time Control, Players (White/Black), Result (1-0, etc.), Move Count, Date.

## Realtime Flow (Socket.IO)
- **Connection**: `io(url, { query: { token } })`.
- **Matchmaking**: `findMatch` -> `matchFound` -> `acceptMatch` -> `gameStart`.
- **Moves**: `makeMove({ gameId, move })` -> Server validates -> `movePlayed`.
- **Game End**: Server persists `Game` doc -> emits `gameOver`.

## Conventions & Notes
- **User Identification**: Always prefer `_id` (Mongo ID) over `username` for API logic.
- **Frontend ID Check**: When comparing IDs (e.g., for determining Win/Loss), convert to string: `id.toString()`.
- **Styling**: SCSS Modules (`Component.module.scss`).
- **Imports**: Use aliases `@/components`, `@/utils`, `@/hooks`.

---

## Recent Work Log (For Context Restoration)
1.  **Fixed Friend Controller**: Updated `getFriendsList` to accept `userId` query param, enabling "View Friends of Friend" feature.
2.  **Implemented Profile UI**:
    - Created `Profile/index.jsx` with tabs navigation.
    - Built `StatsChart.jsx` to visualize Ratings (Radar) and Win Rates (Doughnut).
    - Integrated `GameHistory` into the Overview tab.