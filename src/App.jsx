// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import LogsPage from "./pages/LogsPage";
import TimeInPage from "./pages/TimeInPage";
import ProfilePage from "./pages/ProfilePage";
import Layout from "./components/layout/Layout";

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
};

const LoadingScreen = () => (
  <div style={{
    minHeight: "100vh", display: "flex", alignItems: "center",
    justifyContent: "center", background: "var(--navy)"
  }}>
    <div style={{ textAlign: "center", color: "var(--gold)" }}>
      <LogoIcon size={48} />
      <p style={{ color: "rgba(255,255,255,0.5)", marginTop: 12, fontFamily: "'DM Sans', sans-serif" }}>
        Loading...
      </p>
    </div>
  </div>
);

const LogoIcon = ({ size = 32 }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
    <rect width="40" height="40" rx="10" fill="#c9972b" />
    <path d="M10 10h8v20h-8z" fill="white" opacity="0.9" />
    <path d="M20 10h10v2H20zm0 5h10v2H20zm0 5h10v2H20zm0 5h7v2h-7z" fill="white" opacity="0.7" />
    <path d="M8 30h24v2H8z" fill="white" opacity="0.5" />
  </svg>
);

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              fontFamily: "'DM Sans', sans-serif",
              borderRadius: "10px",
              fontSize: "14px",
            },
            success: { iconTheme: { primary: "#1a9a5c", secondary: "#fff" } },
            error: { iconTheme: { primary: "#d9392b", secondary: "#fff" } },
          }}
        />
        <Routes>
          <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="time-in" element={<TimeInPage />} />
            <Route path="logs" element={<LogsPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
