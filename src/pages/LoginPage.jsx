// src/pages/LoginPage.jsx
import { useNavigate } from "react-router-dom";
import { loginWithGoogle } from "../firebase/auth";
import toast from "react-hot-toast";

const LogoIcon = ({ size = 32 }) => (
  <img src="/neu-logo.png" width={size} height={size} alt="NEU Logo"
    style={{ objectFit: "contain", display: "block" }} />
);

export default function LoginPage({ deletedAccount = false, blockedAccount = false }) {
  const navigate = useNavigate();

  const handleGoogle = async () => {
    try {
      await loginWithGoogle();
      navigate("/checkin");
    } catch (err) {
      if (err.code === "auth/popup-closed-by-user") return;
      if (err.code === "auth/cancelled-popup-request") return;
      toast.error("Sign-in failed. Make sure you use your NEU email (@neu.edu.ph).");
    }
  };

  const errorMessage = blockedAccount
    ? "Your account has been blocked. Please contact the library administrator to regain access."
    : deletedAccount
    ? "Your account has been removed. Please contact the library administrator."
    : null;

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0a1628", padding: 20 }}>
      <div className="login-split fade-in" style={{ width: "100%", maxWidth: 820, display: "flex", borderRadius: 20, overflow: "hidden", boxShadow: "0 24px 60px rgba(0,0,0,0.4)" }}>

        {/* ── Left: Form ── */}
        <div style={{ flex: 1, background: "white", padding: "48px 40px", display: "flex", flexDirection: "column", justifyContent: "center", minWidth: 0 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "#c9972b", letterSpacing: "0.12em", textTransform: "uppercase", margin: "0 0 10px", fontFamily: "'Poppins',sans-serif" }}>
            NEU Library
          </p>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: "#0d1f3c", margin: "0 0 6px", fontFamily: "'Poppins',sans-serif" }}>
            Welcome back
          </h1>
          <p style={{ fontSize: 13, color: "#888", margin: "0 0 28px", fontFamily: "'Poppins',sans-serif" }}>
            Sign in to access LibraLog
          </p>

          {errorMessage && (
            <div style={{ background: "rgba(217,57,43,0.08)", border: "1px solid rgba(217,57,43,0.3)", borderRadius: 8, padding: "10px 14px", color: "#c0392b", fontSize: 13, display: "flex", alignItems: "center", gap: 8, marginBottom: 20, fontFamily: "'Poppins',sans-serif" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {errorMessage}
            </div>
          )}

          <button onClick={handleGoogle} style={{
            width: "100%", padding: "12px 16px",
            background: "white", color: "#3c4043",
            fontWeight: 600, fontSize: 14, borderRadius: 10,
            cursor: "pointer", display: "flex", alignItems: "center",
            justifyContent: "center", gap: 12,
            border: "1px solid #e0e0e0",
            fontFamily: "'Poppins',sans-serif",
            transition: "all 0.2s",
            boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
          }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.12)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.08)"; e.currentTarget.style.transform = "translateY(0)"; }}
          >
            <svg width="18" height="18" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            Continue with Google
          </button>

          <p style={{ fontSize: 11, color: "#bbb", margin: "14px 0 0", fontFamily: "'Poppins',sans-serif" }}>
            @neu.edu.ph accounts only
          </p>

          <p style={{ fontSize: 11, color: "#ccc", margin: "48px 0 0", fontFamily: "'Poppins',sans-serif" }}>
            © {new Date().getFullYear()} New Era University
          </p>
        </div>

        {/* ── Right: Quote panel with background image ── */}
        <div className="login-quote" style={{
          flex: 1, position: "relative", overflow: "hidden", minWidth: 0,
          backgroundImage: "url('/login-bg.png')",
          backgroundSize: "cover", backgroundPosition: "center top",
        }}>
          {/* Dark overlay */}
          <div style={{ position: "absolute", inset: 0, background: "rgba(13,31,60,0.78)" }} />
          {/* Content */}
          <div style={{ position: "relative", zIndex: 1, height: "100%", padding: "48px 40px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 80, lineHeight: 1, color: "#c9972b", fontFamily: "Georgia,serif", marginBottom: 4 }}>"</div>
              <p style={{ color: "white", fontSize: 19, fontWeight: 600, lineHeight: 1.55, margin: "0 0 18px", fontFamily: "'Poppins',sans-serif" }}>
                A library is not a luxury but one of the necessities of life.
              </p>
              <div style={{ width: 36, height: 2, background: "#c9972b", borderRadius: 2, marginBottom: 12 }} />
              <p style={{ color: "rgba(201,151,43,0.75)", fontSize: 13, margin: 0, fontFamily: "'Poppins',sans-serif" }}>
                — Henry Ward Beecher
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: "rgba(201,151,43,0.12)", border: "1px solid rgba(201,151,43,0.25)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <LogoIcon size={22} />
              </div>
              <div>
                <p style={{ color: "#c9972b", fontSize: 14, fontWeight: 700, margin: 0, fontFamily: "'Poppins',sans-serif" }}>LibraLog</p>
                <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, margin: 0, fontFamily: "'Poppins',sans-serif" }}>New Era University</p>
              </div>
            </div>
          </div>
        </div>

      </div>

      <style>{`
        @media (max-width: 640px) {
          .login-split { flex-direction: column !important; max-width: 400px !important; }
          .login-quote { min-height: 180px; }
        }
      `}</style>
    </div>
  );
}