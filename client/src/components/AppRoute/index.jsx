import { BrowserRouter as Router, Routes, Route } from "react-router";
import { AuthProvider } from "@/context/AuthProvider";
import DefaultLayout from "@/layouts/DefaultLayout";
import Lobby from "@/pages/Lobby/Index";
import GamePage from "@/pages/GamePage";
import PlayAI from "@/pages/PlayAI";

// Import các trang Login/Register
import AuthLayout from "@/layouts/AuthLayout";
import Login from "@/pages/Auth/Login";
import Register from "@/pages/Auth/Register";
import AuthCallback from "@/pages/Auth/AuthCallback";

function AppRoute() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Default Layout */}
          <Route element={<DefaultLayout />}>
            <Route index element={<Lobby />} />
            <Route path="/play/ai" element={<PlayAI />} />
          </Route>

          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/auth-callback" element={<AuthCallback />} />
          </Route>
          {/* No Layout */}
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default AppRoute;
