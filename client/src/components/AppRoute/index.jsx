import { BrowserRouter as Router, Routes, Route } from "react-router";
import { AuthProvider } from "@/context/AuthProvider";
import { SocketProvider } from "@/context/SocketProvider";
import { ToastProvider } from "@/context/ToastProvider";

// Import các trang thuộc Default Layout
import DefaultLayout from "@/layouts/DefaultLayout";
import Lobby from "@/pages/Lobby/Index";
import GamePage from "@/pages/GamePage";
import PlayAI from "@/pages/PlayAI";
import PlayFriend from "@/pages/PlayFriend";

// Import các trang thuộc Auth Layout
import AuthLayout from "@/layouts/AuthLayout";
import Login from "@/pages/Auth/Login";
import Register from "@/pages/Auth/Register";
import AuthCallback from "@/pages/Auth/AuthCallback";
import Profile from "@/pages/Profile";
import AnalysisPage from "@/pages/Analysis";
import ImportPage from "@/pages/Import";
import Puzzle from "@/pages/Puzzle";
import SetUsername from "@/pages/Auth/SetUsername";
import Settings from "@/pages/Settings";

// Import các trang thuộc Admin Layout
import AdminLayout from "@/layouts/AdminLayout";
import AdminDashboard from "@/pages/Admin/Dashboard";
import AdminUserManager from "@/pages/Admin/UserManager";
import AdminGameMonitor from "@/pages/Admin/GameMonitor";
import AdminGuard from "../guards/AdminGuard";
import ResetPassword from "@/pages/Auth/ResetPassword";
import ForgotPassword from "@/pages/Auth/ForgotPassword";

function AppRoute() {
  return (
    <Router>
      <ToastProvider>
        <AuthProvider>
          <SocketProvider>
            <Routes>
              {/* Default Layout */}
              <Route element={<DefaultLayout />}>
                <Route index element={<Lobby />} />
                <Route path="/play/ai" element={<PlayAI />} />
                <Route path="/play/friend" element={<PlayFriend />} />
                <Route path="/game/:gameId" element={<GamePage />} />
                <Route path="/profile/:username" element={<Profile />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/import" element={<ImportPage />} />
                <Route path="/puzzle" element={<Puzzle />} />
                <Route path="/analysis" element={<AnalysisPage />} />
                <Route path="/analysis/:id" element={<AnalysisPage />} />
              </Route>

              {/* MỚI: Route chơi game (layout riêng) */}

              <Route element={<AuthLayout />}>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/auth-callback" element={<AuthCallback />} />
                <Route path="/set-username" element={<SetUsername />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route
                  path="/reset-password/:token"
                  element={<ResetPassword />}
                />
              </Route>

              {/* Admin Layout */}
              <Route element={<AdminGuard />}>
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<AdminDashboard />} />
                  <Route path="dashboard" element={<AdminDashboard />} />
                  <Route path="users" element={<AdminUserManager />} />
                  <Route path="games" element={<AdminGameMonitor />} />
                </Route>
              </Route>

              {/* No Layout */}
            </Routes>
          </SocketProvider>
        </AuthProvider>
      </ToastProvider>
    </Router>
  );
}

export default AppRoute;
