import "./App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./lib/auth";
import { ThemeProvider } from "./lib/theme";
import Landing from "./pages/Landing";
import UserApp from "./pages/UserApp";
import AdminApp from "./pages/AdminApp";
import ProfilePage from "./pages/ProfilePage";
import { Toaster } from "./components/ui/sonner";

function Protected({ children, role }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 text-zinc-500">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium">Loading PitchPlay...</span>
        </div>
      </div>
    );
  }
  if (!user) return <Navigate to="/" replace />;
  if (role && user.role !== role) return <Navigate to={user.role === "admin" ? "/admin" : "/app"} replace />;
  return children;
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Toaster position="top-right" richColors />
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/app" element={<Protected role="user"><UserApp /></Protected>} />
            <Route path="/profile" element={<Protected role="user"><ProfilePage /></Protected>} />
            <Route path="/admin" element={<Protected role="admin"><AdminApp /></Protected>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
