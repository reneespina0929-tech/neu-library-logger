// src/components/layout/Layout.jsx
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import { useAuth } from '../../hooks/useAuth.jsx';
import { logoutUser } from "../../firebase/auth";
import toast from "react-hot-toast";
import neuLogo from "../../assets/NeuLogo.js";

const LogoIcon = ({ size = 32 }) => (
  <img src={neuLogo} width={size} height={size} alt="NEU Logo"
    style={{ objectFit: "contain", flexShrink: 0, display: "block" }} />
);

const icons = {
  dashboard: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
      <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
    </svg>
  ),
  visit: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  logs: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  profile: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  admin: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      <line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/>
    </svg>
  ),
};

const pageTitles = {
  "/dashboard": "Dashboard",
  "/time-in": "Log Visit",
  "/logs": "Visitor Logs",
  "/profile": "My Profile",
  "/admin": "Manage Users",
};

export default function Layout() {
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isStaff = userProfile?.role === "admin" || userProfile?.role === "librarian";
  const isAdmin = userProfile?.role === "admin";
  const pageTitle = pageTitles[location.pathname] || "LibraLog";

  const handleLogout = async () => {
    await logoutUser();
    toast.success("Logged out successfully");
    navigate("/login");
  };

  const initials = (user?.displayName || user?.email || "U")
    .split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  const navItems = [
    { to: "/dashboard", label: "Dashboard", icon: icons.dashboard },
    { to: "/time-in", label: "Log Visit", icon: icons.visit },
    ...(isStaff ? [{ to: "/logs", label: "Logs", icon: icons.logs }] : []),
    ...(isAdmin ? [{ to: "/admin", label: "Users", icon: icons.admin }] : []),
    { to: "/profile", label: "Profile", icon: icons.profile },
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--gray-50)" }}>

      {/* ── MOBILE OVERLAY ── */}
      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} className="mobile-overlay" style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
          zIndex: 40, display: "none",
        }} />
      )}

      {/* ── DESKTOP SIDEBAR ── */}
      <aside className="desktop-sidebar" style={{
        width: 240, background: "var(--navy)", display: "flex",
        flexDirection: "column", position: "fixed", top: 0, left: 0,
        height: "100vh", zIndex: 50,
      }}>
        {/* Logo */}
        <div style={{
          padding: "24px 20px", borderBottom: "1px solid rgba(255,255,255,0.07)",
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <LogoIcon size={48} />
          <div>
            <div style={{ fontFamily: "'Poppins', sans-serif", color: "var(--gold)", fontSize: 18, fontWeight: 700, lineHeight: 1.1 }}>LibraLog</div>
            <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase" }}>NEU Library</div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "12px 10px", overflowY: "auto" }}>
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", padding: "8px 10px 4px" }}>Menu</p>
          {[
            { to: "/dashboard", label: "Dashboard", icon: icons.dashboard },
            { to: "/time-in", label: "Log Visit", icon: icons.visit },
            { to: "/profile", label: "My Profile", icon: icons.profile },
          ].map(({ to, label, icon }) => (
            <NavLink key={to} to={to} style={({ isActive }) => ({
              display: "flex", alignItems: "center", gap: 10,
              padding: "10px 12px", borderRadius: 8, marginBottom: 2,
              color: isActive ? "var(--gold)" : "rgba(255,255,255,0.65)",
              background: isActive ? "rgba(201,151,43,0.12)" : "transparent",
              fontWeight: isActive ? 600 : 400, fontSize: 15,
              transition: "all 0.15s ease", textDecoration: "none",
            })}>
              {icon}{label}
            </NavLink>
          ))}

          {isStaff && (
            <>
              <p style={{ color: "rgba(201,151,43,0.5)", fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", padding: "16px 10px 4px" }}>Staff Only</p>
              <NavLink to="/logs" style={({ isActive }) => ({
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 12px", borderRadius: 8, marginBottom: 2,
                color: isActive ? "var(--gold)" : "rgba(201,151,43,0.75)",
                background: isActive ? "rgba(201,151,43,0.12)" : "rgba(201,151,43,0.06)",
                fontWeight: isActive ? 600 : 400, fontSize: 15,
                transition: "all 0.15s ease", textDecoration: "none",
                border: "1px solid rgba(201,151,43,0.15)",
              })}>
                {icons.logs} All Visitor Logs
              </NavLink>
              {isAdmin && (
                <NavLink to="/admin" style={({ isActive }) => ({
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "10px 12px", borderRadius: 8, marginBottom: 2, marginTop: 4,
                  color: isActive ? "var(--gold)" : "rgba(201,151,43,0.75)",
                  background: isActive ? "rgba(201,151,43,0.12)" : "rgba(201,151,43,0.06)",
                  fontWeight: isActive ? 600 : 400, fontSize: 15,
                  transition: "all 0.15s ease", textDecoration: "none",
                  border: "1px solid rgba(201,151,43,0.15)",
                })}>
                  {icons.admin} Manage Users
                </NavLink>
              )}
            </>
          )}
        </nav>

        {/* User + logout */}
        <div style={{ padding: "12px 10px", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 8, background: "rgba(255,255,255,0.05)", marginBottom: 8 }}>
            <div style={{ width: 34, height: 34, borderRadius: "50%", background: "var(--gold)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--navy)", fontWeight: 700, fontSize: 15, flexShrink: 0 }}>{initials}</div>
            <div style={{ overflow: "hidden" }}>
              <div style={{ color: "white", fontSize: 15, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user?.displayName || "User"}</div>
              <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 15, textTransform: "capitalize" }}>{userProfile?.role || "student"}</div>
            </div>
          </div>
          <button onClick={handleLogout} style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 8, background: "transparent", color: "rgba(255,255,255,0.4)", fontSize: 15, transition: "all 0.15s", cursor: "pointer" }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(217,57,43,0.12)"; e.currentTarget.style.color = "#ff6b6b"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(255,255,255,0.4)"; }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── MOBILE TOP HEADER ── */}
      <header className="mobile-header" style={{
        display: "none", position: "fixed", top: 0, left: 0, right: 0,
        height: 56, background: "var(--navy)", zIndex: 50,
        alignItems: "center", justifyContent: "space-between",
        padding: "0 16px", borderBottom: "1px solid rgba(255,255,255,0.07)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <LogoIcon size={28} />
          <span style={{ color: "var(--gold)", fontWeight: 700, fontSize: 16, fontFamily: "'Poppins', sans-serif" }}>LibraLog</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, textTransform: "capitalize" }}>{userProfile?.role || "student"}</span>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--gold)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--navy)", fontWeight: 700, fontSize: 13 }}>{initials}</div>
        </div>
      </header>

      {/* ── MAIN CONTENT ── */}
      <main className="main-content" style={{ marginLeft: 240, flex: 1, minHeight: "100vh", padding: "28px 32px" }}>
        <Outlet />
      </main>

      {/* ── MOBILE BOTTOM NAV ── */}
      <nav className="mobile-bottom-nav" style={{
        display: "none", position: "fixed", bottom: 0, left: 0, right: 0,
        height: 64, background: "var(--navy)", zIndex: 50,
        borderTop: "1px solid rgba(255,255,255,0.07)",
        alignItems: "center", justifyContent: "space-around",
      }}>
        {navItems.map(({ to, label, icon }) => (
          <NavLink key={to} to={to} style={({ isActive }) => ({
            display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
            color: isActive ? "var(--gold)" : "rgba(255,255,255,0.45)",
            textDecoration: "none", fontSize: 10, fontWeight: isActive ? 600 : 400,
            padding: "6px 12px", borderRadius: 8,
            transition: "color 0.15s",
          })}>
            {icon}
            {label}
          </NavLink>
        ))}
        {/* Sign out button in bottom nav */}
        <button onClick={handleLogout} style={{
          display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
          color: "rgba(255,255,255,0.35)", background: "none",
          fontSize: 10, padding: "6px 12px", borderRadius: 8, cursor: "pointer",
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          Sign Out
        </button>
      </nav>

      <style>{`
        @media (max-width: 768px) {
          .desktop-sidebar { display: none !important; }
          .mobile-header { display: flex !important; }
          .mobile-bottom-nav { display: flex !important; }
          .main-content {
            margin-left: 0 !important;
            padding: 72px 16px 80px !important;
          }
        }
      `}</style>
    </div>
  );
}