<!-- .github/copilot-instructions.md - Guidance for AI coding agents working on aechess -->
# AECheSS — Copilot instructions (concise)

Purpose: give an AI coding agent the immediate, actionable knowledge to be productive in this repo.

1) Big picture
- **Client**: React + Vite app in `client/` (ES modules). Main entry: `client/src/main.jsx` and `client/src/App.jsx`.
- **Server**: Express + Socket.IO + MongoDB in `server/`. Entrypoint: `server/index.js`.
- **Realtime flow**: Socket.IO manages matchmaking, room creation and in-game events. Key server socket code lives in `server/socket/` (`socketHandler.js`, `roomHandlers.js`, `gameHandlers.js`, `matchmakingHandlers.js`).
- **Auth**: JWT for REST/Socket auth. Google OAuth via Passport is in `server/config/passport.js`.

2) How to run (local dev)
- Environment: server expects `.env` (see `server/.env`) with `MONGO_URI`, `JWT_SECRET`, `CLIENT_URL`, `GOOGLE_*` values.
- Start both sides (root): `npm run dev` (uses `concurrently`).
- Or individually: `npm run dev --prefix server` and `npm run dev --prefix client`.
- Server dev script uses `nodemon -r dotenv/config index.js` (hot reload).

3) Key integration points & patterns
- REST API base: server exposes `/api/*`. Client `AuthProvider` uses `http://localhost:8080/api` (see `client/src/context/AuthProvider.jsx`).
- Socket auth: client attaches `token` in the socket query (`io("http://localhost:8080", { query: { token } })`). Server verifies JWT in `server/middleware/socketAuth.js` and attaches `socket.user`.
- Server maintains in-memory state:
  - `activeGames` (Map) — authoritative runtime game state (in `socketHandler.js`).
  - `matchmakingQueue` (array) and `pendingMatches` (Map) for matchmaking.
- Game lifecycle:
  - Create room: client triggers `createRoom(roomConfig)` → server `roomHandlers.createRoom` sets up `activeGames.set(gameId, {...})` and `socket.join(gameId)`.
  - Join room: `joinRoom({gameId})` → server updates player `socketId` and emits `gameStart` with `{ gameId, fen, whitePlayer, blackPlayer, config, clocks }`.
  - Moves: `makeMove({ gameId, move })` → server validates turn and clocks, applies `chess.js` move and emits `movePlayed` with `{ newFen, lastMove, clocks, moverSocketId, pgn }`.
  - Matchmaking events: `findMatch`, `matchFound` (server creates `pendingMatches`), `acceptMatch` / `declineMatch` manage match acceptance and eventual `gameStart`.

4) Useful file references (examples)
- Socket flow: `server/socket/socketHandler.js`, `server/socket/roomHandlers.js`, `server/socket/gameHandlers.js`, `server/socket/matchmakingHandlers.js`.
- Auth: `server/config/passport.js`, `server/middleware/socketAuth.js`, `server/middleware/authMiddleware.js`, `server/controllers/authController.js`.
- Client context: `client/src/context/AuthProvider.jsx`, `client/src/context/SocketProvider.jsx` (shows how sockets are connected and how token is attached).
- Game UI bits: `client/src/pages/GamePage/index.jsx`, `client/src/components/MoveBoard/index.jsx`, `client/src/components/GameInfoPanel/index.jsx`.

5) Project-specific conventions & gotchas
- The server uses ES modules (`"type":"module"`) — use `import` / `export`.
- Persistent identity uses `user.id` (Mongo _id) inside `activeGames.players[]`; `socketId` is temporary and is updated on reconnects (see `joinRoom` logic). Prefer `id` checks for player identity.
- Clocks are tracked in seconds in `activeGames.clocks` and updated based on `lastMoveTimestamp` in handlers.
- The server keeps runtime game state in-memory; it is not persisted automatically. `server/controllers/gameController.js` contains logic to persist results (see `server/socket/gameEndHandler.js`). Be careful when editing game-end logic.
- Socket events are stringly-typed; use exact event names in code (e.g., `createRoom`, `joinRoom`, `makeMove`, `movePlayed`, `gameStart`, `matchFound`, `acceptMatch`, `resign`, `offerDraw`, `acceptDraw`).

6) Debugging tips
- Watch both server and client consoles: server prints helpful logs on connections, match events and room creation (`console.log` in socket handlers).
- Reconnection: when a client refreshes and calls `joinRoom`, server updates `socketId` for the existing player object — use this to reproduce reconnect flow.
- To reproduce timeouts: adjust `lastMoveTimestamp` and clocks, or set short base times when creating rooms.

7) Quick code-edit guidance for AI agents
- Small changes: preserve ES module syntax and consistent export shapes.
- When modifying socket logic, update both emission and consumer sites (server event names ↔ client listeners). Search for event name across repo before renaming.
- If adding new env variables, document them in `server/.env` and update `client` config if needed.

8) Example snippets (use these exact payload shapes)
- makeMove payload: `{ gameId, move: { from: 'e2', to: 'e4' } }` → emits `movePlayed` with `{ newFen, lastMove, clocks, moverSocketId, pgn }`.
- createRoom callback: `callback({ gameId, assignedColor })`.
- matchFound payload: `{ matchId, opponent: { displayName, rating } }`.

If anything here is unclear or you want more depth on a specific area (matchmaking, game-end persistence, or auth flows), tell me which part and I will expand or tighten the guidance.
