// src/pages/LoginPage.jsx
import { useNavigate } from "react-router-dom";
import { loginWithGoogle } from "../firebase/auth";
import { useAuth } from "../hooks/useAuth.jsx";
import toast from "react-hot-toast";

const LogoIcon = ({ size = 40 }) => (
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
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      position: "relative",
      backgroundImage: "url('/login-bg.png?v=3')",
      backgroundSize: "cover", backgroundPosition: "center top",
      backgroundColor: "#0d1f3c",
    }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(13,31,60,0.55)", zIndex: 0 }} />

      <div style={{ width: "100%", maxWidth: 400, position: "relative", zIndex: 1, padding: 20 }} className="fade-in">

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <LogoIcon size={56} />
          <h1 style={{ color: "var(--gold)", fontFamily: "'Poppins',sans-serif", fontSize: 28, marginTop: 14, marginBottom: 4, fontWeight: 700 }}>
            LibraLog
          </h1>
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 13 }}>New Era University Library System</p>
        </div>

        {/* Card */}
        <div style={{ background: "rgba(255,255,255,0.05)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: 32 }}>

          <h2 style={{ color: "white", fontFamily: "'Poppins',sans-serif", fontSize: 18, marginBottom: 6, fontWeight: 600 }}>
            Sign In
          </h2>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, marginBottom: 24 }}>
            Use your NEU Google account to continue
          </p>

          {/* Error message */}
          {errorMessage && (
            <div style={{ background: "rgba(217,57,43,0.15)", border: "1px solid rgba(217,57,43,0.4)", borderRadius: 8, padding: "10px 14px", color: "#ff8a80", fontSize: 13, display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {errorMessage}
            </div>
          )}

          {/* Google Sign-In */}
          <button onClick={handleGoogle} style={{
            width: "100%", padding: "13px",
            background: "white", color: "#3c4043",
            fontWeight: 700, fontSize: 15, borderRadius: 10,
            cursor: "pointer", display: "flex", alignItems: "center",
            justifyContent: "center", gap: 12, border: "none",
            boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
            fontFamily: "'Poppins',sans-serif",
            transition: "all 0.2s",
          }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.25)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.15)"; e.currentTarget.style.transform = "translateY(0)"; }}
          >
            <svg width="20" height="20" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            Continue with Google
          </button>

          <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 12, textAlign: "center", marginTop: 20, lineHeight: 1.6 }}>
            Use your <strong style={{ color: "rgba(255,255,255,0.4)" }}>@neu.edu.ph</strong> Google account
          </p>
        </div>

        <p style={{ color: "rgba(255,255,255,0.2)", fontSize: 11, textAlign: "center", marginTop: 20 }}>
          © {new Date().getFullYear()} New Era University · All rights reserved
        </p>
      </div>
    </div>
  );
}