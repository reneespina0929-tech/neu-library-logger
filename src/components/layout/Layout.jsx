// src/components/layout/Layout.jsx
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import { useAuth } from '../../hooks/useAuth.jsx';
import { logoutUser } from "../../firebase/auth";
import toast from "react-hot-toast";

const LogoIcon = ({ size = 32 }) => (
  <img src="/neu-logo.png" width={size} height={size} alt="NEU Logo"
    style={{ objectFit: "contain", flexShrink: 0, display: "block" }} />
);

const icons = {
  dashboard: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  visit: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  logs: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  profile: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  admin: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>,
  reports: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
};

const pageTitles = {
  "/dashboard": "Dashboard", "/time-in": "Log Visit",
  "/logs": "Visitor Logs", "/reports": "Reports", "/profile": "My Profile", "/admin": "Manage Users",
};

const NavItem = ({ to, label, icon, gold = false }) => (
  <NavLink to={to} style={({ isActive }) => ({
    display: "flex", alignItems: "center", gap: 10,
    padding: "9px 12px", borderRadius: 8, marginBottom: 2,
    color: isActive ? (gold ? "var(--gold)" : "white") : (gold ? "rgba(201,151,43,0.65)" : "rgba(255,255,255,0.55)"),
    background: isActive ? (gold ? "rgba(201,151,43,0.15)" : "rgba(255,255,255,0.1)") : "transparent",
    fontWeight: isActive ? 600 : 400, fontSize: 14,
    transition: "all 0.15s ease", textDecoration: "none",
    borderLeft: isActive ? `3px solid ${gold ? "var(--gold)" : "white"}` : "3px solid transparent",
    paddingLeft: isActive ? 9 : 12,
  })}
    onMouseEnter={e => { if (!e.currentTarget.style.background.includes("0.1") && !e.currentTarget.style.background.includes("0.15")) e.currentTarget.style.background = gold ? "rgba(201,151,43,0.07)" : "rgba(255,255,255,0.06)"; }}
    onMouseLeave={e => { if (!e.currentTarget.className.includes("active")) e.currentTarget.style.background = "transparent"; }}
  >
    <span style={{ opacity: 0.85 }}>{icon}</span>
    {label}
  </NavLink>
);

export default function Layout() {
  const { user, userProfile, isHybrid, activeRole, switchRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isStaff = userProfile?.role === "admin" || userProfile?.role === "librarian";
  const isAdmin = userProfile?.role === "admin";

  const handleLogout = async () => {
    await logoutUser();
    toast.success("Logged out successfully");
    navigate("/login");
  };

  const initials = (user?.displayName || user?.email || "U")
    .split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  const navItems = [
    { to: "/dashboard", label: "Dashboard", shortLabel: "Dashboard", icon: icons.dashboard },
    { to: "/time-in", label: "Log Visit", shortLabel: "Log", icon: icons.visit },
    ...(isStaff ? [{ to: "/logs", label: "Logs", shortLabel: "Logs", icon: icons.logs }] : []),
    ...(isStaff ? [{ to: "/reports", label: "Reports", shortLabel: "Reports", icon: icons.reports }] : []),
    ...(isAdmin ? [{ to: "/admin", label: "Users", shortLabel: "Users", icon: icons.admin }] : []),
    { to: "/profile", label: "Profile", shortLabel: "Profile", icon: icons.profile },
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--gray-50)" }}>

      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 40 }} />
      )}

      {/* ── DESKTOP SIDEBAR ── */}
      <aside className="desktop-sidebar" style={{
        width: 248, background: "linear-gradient(180deg, #0a1a30 0%, #0d1f3c 40%, #0f2244 100%)",
        display: "flex", flexDirection: "column",
        position: "fixed", top: 0, left: 0, height: "100vh", zIndex: 50,
        borderRight: "1px solid rgba(255,255,255,0.06)",
        boxShadow: "4px 0 20px rgba(0,0,0,0.15)",
      }}>
        {/* Logo */}
        <div style={{ padding: "20px 18px 18px", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 42, height: 42, borderRadius: 10, background: "rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(255,255,255,0.1)", flexShrink: 0 }}>
            <LogoIcon size={30} />
          </div>
          <div>
            <div style={{ fontFamily: "'Poppins',sans-serif", color: "var(--gold)", fontSize: 17, fontWeight: 700, lineHeight: 1.2, letterSpacing: "-0.01em" }}>LibraLog</div>
            <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 1 }}>NEU Library</div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "14px 12px", overflowY: "auto" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.25)", letterSpacing: "0.12em", textTransform: "uppercase", padding: "6px 12px 8px", marginBottom: 2 }}>Menu</div>

          <NavItem to="/dashboard" label="Dashboard" icon={icons.dashboard} />
          <NavItem to="/time-in" label="Log Visit" icon={icons.visit} />
          <NavItem to="/profile" label="My Profile" icon={icons.profile} />

          {isStaff && (
            <>
              <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(201,151,43,0.4)", letterSpacing: "0.12em", textTransform: "uppercase", padding: "16px 12px 8px", marginBottom: 2 }}>Staff Only</div>
              <NavItem to="/logs" label="All Visitor Logs" icon={icons.logs} gold />
              <NavItem to="/reports" label="Reports" icon={icons.reports} gold />
              {isAdmin && <NavItem to="/admin" label="Manage Users" icon={icons.admin} gold />}
            </>
          )}
        </nav>

        {/* Bottom section */}
        <div style={{ padding: "12px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>

          {/* Role switcher */}
          {isHybrid && (
            <div style={{ marginBottom: 10, padding: "10px 12px", background: "rgba(201,151,43,0.07)", borderRadius: 10, border: "1px solid rgba(201,151,43,0.18)" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(201,151,43,0.6)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 7 }}>Switch Role</div>
              <div style={{ display: "flex", gap: 6 }}>
                {["student", "admin"].map(role => (
                  <button key={role} onClick={() => switchRole(role)} style={{
                    flex: 1, padding: "5px 0", borderRadius: 7, fontSize: 11, fontWeight: 600,
                    cursor: "pointer", textTransform: "capitalize", fontFamily: "'Poppins',sans-serif",
                    border: activeRole === role ? "none" : "1px solid rgba(255,255,255,0.12)",
                    background: activeRole === role ? "linear-gradient(135deg, #d4a032, #c9972b)" : "transparent",
                    color: activeRole === role ? "var(--navy)" : "rgba(255,255,255,0.45)",
                    transition: "all 0.15s",
                    boxShadow: activeRole === role ? "0 2px 8px rgba(201,151,43,0.3)" : "none",
                  }}>{role}</button>
                ))}
              </div>
            </div>
          )}

          {/* User card */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, background: "rgba(255,255,255,0.05)", marginBottom: 6, border: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{
              width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
              background: "linear-gradient(135deg, #d4a032, #c9972b)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "var(--navy)", fontWeight: 700, fontSize: 13,
              boxShadow: "0 2px 8px rgba(201,151,43,0.35)",
            }}>{initials}</div>
            <div style={{ overflow: "hidden", flex: 1 }}>
              <div style={{ color: "white", fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user?.displayName || "User"}</div>
              <div style={{ color: "var(--gold)", fontSize: 11, textTransform: "capitalize", opacity: 0.7, marginTop: 1 }}>{userProfile?.role || "student"}</div>
            </div>
          </div>

          <button onClick={handleLogout} style={{
            width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            padding: "8px 12px", borderRadius: 8, background: "transparent",
            color: "rgba(255,255,255,0.35)", fontSize: 13, transition: "all 0.15s", cursor: "pointer",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(217,57,43,0.1)"; e.currentTarget.style.color = "#ff8080"; e.currentTarget.style.borderColor = "rgba(217,57,43,0.2)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(255,255,255,0.35)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; }}
          >
            {icons.signout} Sign Out
          </button>
        </div>
      </aside>

      {/* ── MOBILE HEADER ── */}
      <header className="mobile-header" style={{
        display: "none", position: "fixed", top: 0, left: 0, right: 0,
        height: 56, background: "var(--navy)", zIndex: 50,
        alignItems: "center", justifyContent: "space-between",
        padding: "0 16px", borderBottom: "1px solid rgba(255,255,255,0.07)",
        boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <LogoIcon size={26} />
          <span style={{ color: "var(--gold)", fontWeight: 700, fontSize: 16, fontFamily: "'Poppins',sans-serif", letterSpacing: "-0.01em" }}>LibraLog</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, textTransform: "capitalize", background: "rgba(255,255,255,0.07)", padding: "3px 10px", borderRadius: 20 }}>{userProfile?.role || "student"}</span>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg, #d4a032, #c9972b)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--navy)", fontWeight: 700, fontSize: 12, boxShadow: "0 2px 6px rgba(201,151,43,0.35)" }}>{initials}</div>
        </div>
      </header>

      {/* ── MAIN CONTENT ── */}
      <main className="main-content" style={{ marginLeft: 248, flex: 1, minHeight: "100vh", padding: "28px 32px" }}>
        <Outlet />
      </main>

      {/* ── MOBILE BOTTOM NAV ── */}
      <nav className="mobile-bottom-nav" style={{
        display: "none", position: "fixed", bottom: 0, left: 0, right: 0,
        height: 64, background: "var(--navy)", zIndex: 50,
        borderTop: "1px solid rgba(255,255,255,0.07)",
        alignItems: "center", justifyContent: "space-around",
        boxShadow: "0 -4px 16px rgba(0,0,0,0.15)",
      }}>
        {navItems.map(({ to, shortLabel, label, icon }) => (
          <NavLink key={to} to={to} style={({ isActive }) => ({
            display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
            color: isActive ? "var(--gold)" : "rgba(255,255,255,0.4)",
            textDecoration: "none", fontSize: 10, fontWeight: isActive ? 700 : 400,
            padding: "6px 10px", borderRadius: 10,
            background: isActive ? "rgba(201,151,43,0.12)" : "transparent",
            transition: "all 0.15s", whiteSpace: "nowrap",
          })}>
            {icon}
            {shortLabel || label}
          </NavLink>
        ))}
        <button onClick={handleLogout} style={{
          display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
          color: "rgba(255,255,255,0.3)", background: "none",
          fontSize: 10, padding: "6px 10px", borderRadius: 10, cursor: "pointer",
        }}>
          {icons.signout}
          Sign Out
        </button>
      </nav>

      <style>{`
        @media (max-width: 768px) {
          .desktop-sidebar { display: none !important; }
          .mobile-header { display: flex !important; }
          .mobile-bottom-nav { display: flex !important; }
          .main-content { margin-left: 0 !important; padding: 68px 16px 76px !important; }
        }
      `}</style>
    </div>
  );
}