# AECheSS — Project Documentation & Context (Master Record)

> **Role of this file**: This is the **Long-term Memory** of the project. It contains architecture details, business logic, schema definitions, and technical decisions. Use this to restore context after a chat memory reset.

## 🚨 AI AGENT SYSTEM INSTRUCTIONS (CRITICAL)

**Before generating any code, you MUST validate your response against these 3 constraints:**

1.  **NO SHELL COMMANDS**: Do NOT generate bash/terminal commands (e.g., `npm install`, `mkdir`, `touch`). Only generate the code/text content.
2.  **NETWORK STANDARD**: NEVER use `import axios from 'axios'`. You MUST use `import axiosClient from "@/utils/axiosConfig";`.
3.  **STYLING STANDARD**: NEVER use SCSS variables (e.g., `$color`). MUST use CSS Variables (`var(--color-...)`) and import `@use "@/styles/variables.scss" as *;`.

---

## 1. Project Identity & Stack

- **Name**: AECheSS (Realtime Chess Application).
- **Core Philosophy**: A robust, full-stack chess platform focusing on realtime performance, stability, and dark-mode aesthetics (inspired by Lichess/Chess.com).
- **Tech Stack**:
  - **Frontend**: React (Vite), SCSS Modules, Axios, Socket.IO-Client, Chart.js, React-Modal. React Icons
  - **Backend**: Node.js, Express, Socket.IO (Server), MongoDB (Mongoose), Passport.js (Google Auth).
  - **DevOps/Tools**: Git, Nodemon, Concurrently.

## 2. Directory Structure & Key Files (Verified)

### Client (`/client/src`)

- **`main.jsx`**: Entry point. Imports global styles (`styles/main.scss`).
- **`components/`**: Shared UI & Logic components.
  - **`guards/`**: Security Wrappers (`AdminGuard.jsx`).
  - **`AppRoute/`**: Centralized routing & Provider wrapping.
  - **`ChessBoardCustom/`**: **Standardized Board Wrapper**. Encapsulates `react-chessboard` + Theme logic.
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
  - `chessAnalysis.js`: Engine analysis worker helpers.
  - `chessUtils.js`: **Unified Utils**. Merged `gameHelpers.js`. Contains Board Layout, PGN Parsing, Material Calculation, and Formatters.
  - `validators.js`: Form validation logic.

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

### F. Game End Sequence & Rating Sync (Race Condition Handling) [NEW]

> **Problem**: Previous flow emitted `gameOver` before calculating Elo, causing Frontend to render the result modal without updated ratings (race condition).

- **Revised Flow (Strict Ordering)**:
  1.  **Calculate (In-Memory)**: Determine new Elo ratings immediately using `eloCalculator`.
  2.  **Emit (Realtime)**: Send `gameOver` event **including** the `newRatings` object (`{ white: number, black: number }`) in the payload.
  3.  **Persist (Async)**: Save updated User ratings and Game result to MongoDB via `await`.
- **Frontend Handling**:
  - `getDisplayPlayer` checks for `gameResult.newRatings` payload immediately instead of waiting for a separate `ratingUpdate` event (though the separate event is still sent for other listeners).

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

**B. Styling & Assets Standards**

- **SCSS**: Do NOT use SCSS variables (e.g., `$border-color`). Use CSS Variables defined in `client/src/styles/variables.scss` (e.g., `var(--color-border)`). Always add `@use "@/styles/variables.scss" as *;`.
- **Icons (NEW)**:
  - **Standard**: Use **`react-icons`** library (e.g., `import { FaUser } from "react-icons/fa"`).
  - **Legacy**: Do NOT use FontAwesome classes (`<i class="fa...">`) for NEW features. Existing usages will be refactored gradually.

**C. Import Standards (Centralized Hooks)**

- **Single Source of Truth**: Always import hooks from the barrel file **`@/hooks`**.
- **Available Hooks**:
  - _Context Consumers_: `useAuth`, `useSocket`, `useToast`.
  - _Logic Hooks_: `useGameNavigation`, `useStockfish`, `useFullGameAnalysis`, `useOnlineGame`.
- **Syntax Example**:
  - _Good_: `import { useAuth, useOnlineGame } from "@/hooks";`
  - _Bad_: `import { useAuth } from "@/context/AuthContext";` (Do not bypass the barrel file).

**D. Environment Constraints**

- **NO SHELL COMMANDS**: AI must NOT run npm, mkdir, touch. Only generate code.

**E. Data Structure Standards (MongoDB ID)**

- **UNIFIED ID**: We STRICTLY use **`_id`** (underscore id) across the entire stack (Database -> API -> Frontend).
- **NO MAPPING**: Do **NOT** manually map `_id` to `id` in Controllers. Return the raw Mongoose object or `toObject()`.
- **FRONTEND**: Client components must access `user._id` or `game._id`. Do NOT assume `.id` exists.

**F. UI/UX & Layout Standards (Game Views)**

- **Layout Philosophy**: "Desktop First", Viewport-Constrained (`100vh`). The main page body must **NEVER** have a scrollbar on Desktop; scrolling is restricted to internal panels only.
- **Grid System (Desktop)**:
  - **Strictly remove Bootstrap Grid** (`row`, `col-`).
  - **Standard Game/Play Layout**: Use CSS Grid Template Areas.
    - _Structure_: `minmax(200px, 1fr) auto minmax(280px, 1fr)`.
    - _Areas_: `"playerTop board panel" "playerBottom board panel"` (Aligns players vertically with board).
  - **Analysis/Puzzle Layout**: Use 3-Column Grid.
    - _Structure_: `minmax(260px, 1fr) auto minmax(320px, 1fr)`.
    - _Areas_: `"left board right"`.
- **Responsive Strategy (Mobile < 1024px)**:
  - **Flatten JSX**: Wrapper must contain direct children (Players, Board, Panel) without deep intermediate `divs` to enable Flexbox Ordering.
  - **Flex Column**: Switch `display: grid` -> `display: flex; flex-direction: column`.
  - **Ordering Standard**:
    1.  **Top Player** (or Board for Puzzles).
    2.  **Board Area** (Must be `order: 2` or `1`, crucial for UX).
    3.  **Bottom Player** / **Tools**.
    4.  **Info Panel** (Last).
  - **Viewport**: Use `height: auto` on mobile wrapper to allow natural scrolling.
- **Component Standards**:
  - **ChessBoardCustom**: Must be the standard wrapper.
    - _Sizing_: `aspect-ratio: 1/1`. Height is the limiting factor (`max-height: calc(100vh - header - padding)`).
  - **FlipBoardButton**: Must be positioned **Absolute** inside the `.boardContainer` (Top-Right corner), NOT inside side panels, to prevent layout overlap.
  - **Panels**: Must implement **Custom Scrollbars** (thin, dark theme) and `overflow-y: auto`.

## 8. Environment Variables

```env
PORT=8080
MONGO_URI=mongodb+srv://...
JWT_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
CLIENT_URL=http://localhost:5173
```
