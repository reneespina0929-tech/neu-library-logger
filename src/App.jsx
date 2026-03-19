// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from './hooks/useAuth.jsx';
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import LogsPage from "./pages/LogsPage";
import ReportsPage from "./pages/ReportsPage";
import TimeInPage from "./pages/TimeInPage";
import AdminPage from "./pages/AdminPage";
import StudentCheckIn from "./pages/StudentCheckIn";
import Layout from "./components/layout/Layout";

// Students go to check-in, staff/admin go to dashboard
const RoleBasedRedirect = () => {
  const { userProfile } = useAuth();
  const role = userProfile?.role || "student";
  if (role === "student" || role === "faculty") return <Navigate to="/checkin" replace />;
  return <Navigate to="/dashboard" replace />;
};

const ProtectedRoute = ({ children, staffOnly = false }) => {
  const { user, userProfile, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (staffOnly) {
    const role = userProfile?.role;
    if (role === "student" || role === "faculty") return <Navigate to="/checkin" replace />;
  }
  return children;
};

const StudentRoute = ({ children }) => {
  const { user, userProfile, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  const role = userProfile?.role;
  // If role switched to admin/librarian, send to dashboard
  if (role === "admin" || role === "librarian") return <Navigate to="/dashboard" replace />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { user, userProfile, loading, deleted, blocked } = useAuth();
  if (loading) return <LoadingScreen />;
  if (deleted) return <LoginPage deletedAccount />;
  if (blocked) return <LoginPage blockedAccount />;
  if (user) {
    const role = userProfile?.role;
    if (role === "student" || role === "faculty") return <Navigate to="/checkin" replace />;
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

const LoadingScreen = () => (
  <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--navy)" }}>
    <div style={{ textAlign: "center" }}>
      <LogoIcon size={48} />
      <p style={{ color: "rgba(255,255,255,0.5)", marginTop: 12, fontFamily: "'Poppins',sans-serif" }}>Loading...</p>
    </div>
  </div>
);

const LogoIcon = ({ size = 32 }) => (
  <img src="/neu-logo.png" width={size} height={size} alt="NEU Logo"
    style={{ objectFit: "contain", flexShrink: 0 }} />
);

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{
          style: { fontFamily: "'Poppins',sans-serif", borderRadius: "10px", fontSize: "14px" },
          success: { iconTheme: { primary: "#1a9a5c", secondary: "#fff" } },
          error: { iconTheme: { primary: "#d9392b", secondary: "#fff" } },
        }} />
        <Routes>
          {/* Public */}
          <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

          {/* Student check-in flow — no sidebar */}
          <Route path="/checkin" element={<StudentRoute><StudentCheckIn /></StudentRoute>} />

          {/* Staff/Admin — full layout */}
          <Route path="/" element={<ProtectedRoute staffOnly><Layout /></ProtectedRoute>}>
            <Route index element={<RoleBasedRedirect />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="time-in" element={<TimeInPage />} />
            <Route path="logs" element={<LogsPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="admin" element={<AdminPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;