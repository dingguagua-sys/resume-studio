import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth/AuthContext";
import Dashboard from "./pages/Dashboard";
import EditorPage from "./pages/EditorPage";
import Home from "./pages/Home";
import LoginPage from "./pages/LoginPage";
import SharePage from "./pages/SharePage";

function RequireAuth() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="center muted" style={{ padding: 48 }}>
        加载中…
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/share/:shareId" element={<SharePage />} />
        <Route element={<RequireAuth />}>
          <Route path="/app" element={<Dashboard />} />
          <Route path="/app/resume/:id" element={<EditorPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
