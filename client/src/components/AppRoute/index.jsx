import { BrowserRouter as Router, Routes, Route } from "react-router";
import { AuthProvider } from "@/context/AuthProvider";
import { SocketProvider } from "@/context/SocketProvider";

// Import các trang thuộc Default Layout
import DefaultLayout from "@/layouts/DefaultLayout";
import Lobby from "@/pages/Lobby/Index";
import GamePage from "@/pages/GamePage";
import PlayAI from "@/pages/PlayAI";
import PlayFriend from "../../pages/PlayFriend";

// Import các trang thuộc Auth Layout
import AuthLayout from "@/layouts/AuthLayout";
import Login from "@/pages/Auth/Login";
import Register from "@/pages/Auth/Register";
import AuthCallback from "@/pages/Auth/AuthCallback";

function AppRoute() {
  return (
    <Router>
      <AuthProvider>
        <SocketProvider>
          <Routes>
            {/* Default Layout */}
            <Route element={<DefaultLayout />}>
              <Route index element={<Lobby />} />
              <Route path="/play/ai" element={<PlayAI />} />
              <Route path="/play/friend" element={<PlayFriend />} />
              <Route path="/game/:gameId" element={<GamePage />} />
            </Route>

            {/* MỚI: Route chơi game (layout riêng) */}

            <Route element={<AuthLayout />}>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/auth-callback" element={<AuthCallback />} />
            </Route>
            {/* No Layout */}
          </Routes>
        </SocketProvider>
      </AuthProvider>
    </Router>
  );
}

export default AppRoute;
