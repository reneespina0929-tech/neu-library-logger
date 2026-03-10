// src/App.jsx
import neuLogo from "../assets/neuLogo";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from './hooks/useAuth.jsx';
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import LogsPage from "./pages/LogsPage";
import TimeInPage from "./pages/TimeInPage";
import ProfilePage from "./pages/ProfilePage";
import AdminPage from "./pages/AdminPage";
import Layout from "./components/layout/Layout";

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  console.log("ProtectedRoute:", { user: !!user, loading });
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  console.log("PublicRoute:", { user: !!user, loading });
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
      <p style={{ color: "rgba(255,255,255,0.5)", marginTop: 12, fontFamily: "'Poppins', sans-serif" }}>
        Loading...
      </p>
    </div>
  </div>
);

const LogoIcon = ({ size = 32 }) => (
  <img src={neuLogo} width={size} height={size} alt="NEU Logo"
    style={{ objectFit: "contain", display: "block" }} />
);

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              fontFamily: "'Poppins', sans-serif",
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
            <Route path="admin" element={<AdminPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;