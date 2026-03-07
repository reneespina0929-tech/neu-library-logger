// src/components/layout/Layout.jsx
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from '../../hooks/useAuth.jsx';
import { logoutUser } from "../../firebase/auth";
import toast from "react-hot-toast";

const LogoIcon = ({ size = 32 }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
    <rect width="40" height="40" rx="10" fill="#c9972b" />
    <path d="M10 10h8v20h-8z" fill="white" opacity="0.9" />
    <path d="M20 10h10v2H20zm0 5h10v2H20zm0 5h10v2H20zm0 5h7v2h-7z" fill="white" opacity="0.7" />
    <path d="M8 30h24v2H8z" fill="white" opacity="0.5" />
  </svg>
);

const navItems = [
  {
    to: "/dashboard", label: "Dashboard",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    to: "/time-in", label: "Log Visit",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
  {
    to: "/logs", label: "Visit Logs",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" />
        <line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" />
        <line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
      </svg>
    ),
  },
  {
    to: "/profile", label: "My Profile",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
];

export default function Layout() {
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logoutUser();
    toast.success("Logged out successfully");
    navigate("/login");
  };

  const initials = (user?.displayName || user?.email || "U")
    .split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--gray-50)" }}>
      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
            zIndex: 40, display: "none"
          }}
          className="mobile-overlay"
        />
      )}

      {/* Sidebar */}
      <aside style={{
        width: 240, background: "var(--navy)", display: "flex",
        flexDirection: "column", position: "fixed", top: 0, left: 0,
        height: "100vh", zIndex: 50, transition: "transform 0.25s ease",
      }}>
        {/* Logo */}
        <div style={{
          padding: "24px 20px", borderBottom: "1px solid rgba(255,255,255,0.07)",
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <LogoIcon size={36} />
          <div>
            <div style={{
              fontFamily: "'Poppins', sans-serif",
              color: "var(--gold)", fontSize: 18, fontWeight: 700, lineHeight: 1.1,
            }}>LibraLog</div>
            <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase" }}>
              NEU Library
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "12px 10px", overflowY: "auto" }}>
          <p style={{
            color: "rgba(255,255,255,0.3)", fontSize: 11, fontWeight: 600,
            letterSpacing: "0.1em", textTransform: "uppercase",
            padding: "8px 10px 4px",
          }}>Menu</p>
          {navItems.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              style={({ isActive }) => ({
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 12px", borderRadius: 8, marginBottom: 2,
                color: isActive ? "var(--gold)" : "rgba(255,255,255,0.65)",
                background: isActive ? "rgba(201,151,43,0.12)" : "transparent",
                fontWeight: isActive ? 600 : 400, fontSize: 15,
                transition: "all 0.15s ease",
                textDecoration: "none",
              })}
              onClick={() => setSidebarOpen(false)}
            >
              {icon}
              {label}
            </NavLink>
          ))}

          {/* Admin / Librarian only section */}
          {(userProfile?.role === "admin" || userProfile?.role === "librarian") && (
            <>
              <p style={{
                color: "rgba(201,151,43,0.5)", fontSize: 11, fontWeight: 600,
                letterSpacing: "0.1em", textTransform: "uppercase",
                padding: "16px 10px 4px",
              }}>Staff Only</p>
              <NavLink
                to="/logs"
                style={({ isActive }) => ({
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "10px 12px", borderRadius: 8, marginBottom: 2,
                  color: isActive ? "var(--gold)" : "rgba(201,151,43,0.75)",
                  background: isActive ? "rgba(201,151,43,0.12)" : "rgba(201,151,43,0.06)",
                  fontWeight: isActive ? 600 : 400, fontSize: 15,
                  transition: "all 0.15s ease",
                  textDecoration: "none",
                  border: "1px solid rgba(201,151,43,0.15)",
                })}
                onClick={() => setSidebarOpen(false)}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
                All Visitor Logs
              </NavLink>
            </>
          )}
        </nav>

        {/* User info + logout */}
        <div style={{
          padding: "12px 10px", borderTop: "1px solid rgba(255,255,255,0.07)",
        }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "10px 12px", borderRadius: 8,
            background: "rgba(255,255,255,0.05)", marginBottom: 8,
          }}>
            <div style={{
              width: 34, height: 34, borderRadius: "50%",
              background: "var(--gold)", display: "flex",
              alignItems: "center", justifyContent: "center",
              color: "var(--navy)", fontWeight: 700, fontSize: 15, flexShrink: 0,
            }}>{initials}</div>
            <div style={{ overflow: "hidden" }}>
              <div style={{
                color: "white", fontSize: 15, fontWeight: 500,
                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
              }}>{user?.displayName || "User"}</div>
              <div style={{
                color: "rgba(255,255,255,0.35)", fontSize: 15,
                textTransform: "capitalize",
              }}>{userProfile?.role || "student"}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            style={{
              width: "100%", display: "flex", alignItems: "center", gap: 8,
              padding: "8px 12px", borderRadius: 8, background: "transparent",
              color: "rgba(255,255,255,0.4)", fontSize: 15,
              transition: "all 0.15s", cursor: "pointer",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = "rgba(217,57,43,0.12)";
              e.currentTarget.style.color = "#ff6b6b";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "rgba(255,255,255,0.4)";
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ marginLeft: 240, flex: 1, minHeight: "100vh", padding: "28px 32px" }}>
        <Outlet />
      </main>

      <style>{`
        @media (max-width: 768px) {
          aside { transform: ${sidebarOpen ? "translateX(0)" : "translateX(-100%)"}; }
          main { margin-left: 0 !important; padding: 16px !important; }
          .mobile-overlay { display: block !important; }
        }
      `}</style>
    </div>
  );
}