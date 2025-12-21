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
- **`hooks/`**: Custom hooks (`useOnlineGame`, `useFullGameAnalysis`, `useThemeSync`, etc.).
- **`layouts/`**:
  - `AdminLayout/`: **Dedicated Admin UI** (Sidebar + Outlet).
  - `AuthLayout/`: Clean UI for Login/Register.
  - `DefaultLayout/`: Main Player UI (Header + Nav).
- **`pages/`**:
  - **`Admin/`**: Administrative Modules.
    - `Dashboard/`: Stats Overview.
    - `GameMonitor/`: Real-time game supervision (`ActiveGameList`).
    - `UserManager/`: User management (`UserTable` component).
  - **`Settings/`**: User Preferences & Account Management.
    - `ProfileSettings/`: Bio & Avatar management.
    - `AccountSettings/`: Password & Security.
    - `BoardSettings/`: Board/Piece Theme customization.
  - `GamePage/`: **Core Gameplay**.
  - `Analysis/`: Game review tool.
  - `Lobby/`, `PlayAI/`, `PlayFriend/`, `Profile/`, `Puzzle/`.
- **`styles/`**: Global SCSS.
  - `variables.scss`: Color tokens & mixins.
  - `main.scss`, `reset.scss`.
- **`utils/`**: Helper logic.
  - **`axiosConfig.js`**: **CRITICAL**. Custom axios instance with Auth Interceptors.
  - `avatarConfig.js`: Configuration for static avatar assets.
  - `chessAnalysis.js`, `chessUtils.js`, `validators.js`.

### Server (`/server`)

- **`index.js`**: App entry point. Connects DB, CORS, Routes, and Socket.IO.
- **`controllers/`**: `authController`, `adminController`, `gameController`, `userController`, etc.
- **`middleware/`**:
  - `authMiddleware.js`: Verify JWT.
  - `adminMiddleware.js`: **RBAC** (Verify `role === 'admin'`).
  - `socketAuth.js`: Socket handshake verification.
- **`models/`**: Mongoose Schemas (`User`, `Game`, `Puzzle`).
- **`routes/`**: `authRoutes`, `adminRoutes`, `gameRoutes`, `userRoutes`.
- **`socket/`**: **Realtime Core Logic**.
  - `gameHandlers.js`: Move validation, Game creation (Active).
  - `gameEndHandler.js`: Game completion logic.
  - `matchmakingHandlers.js`, `roomHandlers.js`.

## 3. Database Schema (Detailed)

### User Model (`User.js`)

- **`_id`**: ObjectId (Standard identifier).
- `username`: String (Unique, Lowercase).
- `email`: String (Unique).
- `role`: String (Enum: `['user', 'admin']`, Default: `'user'`).
- `isActive`: Boolean (Default: `true`). Used for Soft Ban.
- `passwordHash`: String (Optional/Not Required). Allows Google-only accounts.
- `authProvider`: String (Enum: `['local', 'google', 'hybrid']`).
- **`preferences`**: Nested Object. Stores UI settings.
  - `boardTheme`: String (e.g., `'brown'`, `'green'`).
  - `pieceTheme`: String.
- **`bio`**: String (Max 200 chars).
- **`avatar`**: String (Path to static asset, e.g., `"/avatars/1.png"`).
- `ratings`: Nested Object (`bullet`, `blitz`, `rapid`, `classical`).

### Game Model (`Game.js`)

- **`_id`**: ObjectId.
- `whitePlayer`, `blackPlayer`: ObjectId (Ref User).
- `status`: String (`"active"`, `"completed"`, `"aborted"`). Default: `"active"`.
- `fen`: String (Real-time board state).
- `result`: String (`"1-0"`, `"0-1"`, `"1/2-1/2"`, `"*"`). Default: `"*"` (Not required initially).
- `pgn`: String (Full move history).
- `endReason`: String (`"checkmate"`, `"resignation"`, `"admin_intervention"`, etc.).

## 4. Complex Business Logic & Flows

### A. Authentication & RBAC

1.  **Login**: User receives JWT.
2.  **Client State**: `/api/auth/me` returns `{ user, role, isActive, preferences, hasPassword }`.
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

- **Logic**: If `socket.user._id` is not White or Black player -> Role is **Spectator**.
- **UI**: Draggable pieces disabled, "Resign" hidden, "Watching" badge shown.

### D. Move Analysis System

- **Logic**: `useFullGameAnalysis` (Worker) -> `AnalysisPage` (Map Object by FEN) -> `MoveBoard` (O(1) Lookup).
- **Visualization**: Best Move (Green Star), Mistake (Orange ?), Blunder (Red ??).

### E. User Settings & Personalization Module

> **Goal**: Provide a seamless, cross-device experience for user preferences and account management.

**1. Hybrid Storage Strategy (Theme Sync)**

- **Local-First Read**: App loads theme from `localStorage` immediately upon boot.
- **Network Sync**: Upon login (`/me`), Client compares `localStorage` vs `user.preferences` (DB).
- **Write**: Changing settings updates both `localStorage` and DB.

**2. Hybrid Authentication (Password Management)**

- **Logic**:
  - API `/me` returns virtual field `hasPassword: boolean`.
  - **Frontend**:
    - If `!hasPassword`: Shows "Set Password" form.
    - If `hasPassword`: Shows "Change Password" form.

**3. Profile Management (Static Assets)**

- **Avatar Strategy**: DB stores _relative path_ (e.g., `"/avatars/luffy.png"`). Frontend renders `<img src={user.avatar} />`.
- **Bio**: Simple text update via `PATCH /profile`.

## 5. Admin Module Implementation

> **Goal**: A dedicated Lichess-style portal for system management.

- **Architecture**: `AdminLayout` (Sidebar-based).
- **Features**: Dashboard Stats, User Manager (Ban/Unban), Game Monitor (Force Abort).

## 6. Socket Event Reference

### Client -> Server

- `join_room`, `make_move`, `resign`, `offer_draw`, `accept_draw`, `decline_draw`.

### Server -> Client

- `room_joined`, `move_made`, `game_over`, `draw_offered`, `error`.

## 7. Development Protocols (STRICT RULES)

**A. Network Requests (Axios Client)**

- **CRITICAL RULE**: **NEVER** use raw `import axios from 'axios'`.
- **REQUIREMENT**: You MUST import and use the custom instance: `import axiosClient from "@/utils/axiosConfig";`.

**B. Styling (CSS/SCSS Standards)**

- **STRICT FORBIDDEN**: Do NOT use SCSS variables (e.g., `$border-color`).
- **REQUIRED**: Use CSS Custom Properties defined in `client/src/styles/variables.scss` (e.g., `var(--color-border)`).
- **IMPORT**: Always add `@use "@/styles/variables.scss" as *;`.

**C. Environment Constraints**

- **NO SHELL COMMANDS**: AI must NOT run npm, mkdir, touch. Only generate code.

**D. Data Structure Standards (MongoDB ID) [NEW]**

- **UNIFIED ID**: We STRICTLY use **`_id`** (underscore id) across the entire stack (Database -> API -> Frontend).
- **NO MAPPING**: Do **NOT** manually map `_id` to `id` in Controllers. Return the raw Mongoose object or `toObject()`.
- **FRONTEND**: Client components must access `user._id` or `game._id`. Do NOT assume `.id` exists.

## 8. Environment Variables

```env
PORT=8080
MONGO_URI=mongodb+srv://...
JWT_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
CLIENT_URL=http://localhost:5173
```
