// src/pages/LoginPage.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser, resetPassword, loginWithGoogle } from "../firebase/auth";
import toast from "react-hot-toast";

const LogoIcon = ({ size = 40 }) => (
  <img
    src="/neu-logo.png"
    width={size}
    height={size}
    alt="NEU Logo"
    style={{ objectFit: "contain", display: "block" }}
  />
);

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");

  // Forgot password state
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!email || !password) { setError("Please fill in all fields."); return; }
    setLoading(true);
    try {
      await loginUser(email, password);
      toast.success("Welcome to NEU Library!");
      navigate("/dashboard");
    } catch (err) {
      const code = err.code || "";
      if (code === "auth/invalid-credential" || code === "auth/wrong-password" || code === "auth/user-not-found" || code === "auth/invalid-email") {
        setError("Invalid email or password. Please try again.");
      } else if (code === "auth/too-many-requests") {
        setError("Too many failed attempts. Please wait a moment and try again.");
      } else if (code === "auth/network-request-failed") {
        setError("Network error. Please check your connection.");
      } else {
        setError("Login failed. Please try again. (" + code + ")");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (!resetEmail) { toast.error("Enter your email address."); return; }
    setResetLoading(true);
    try {
      await resetPassword(resetEmail);
      setResetSent(true);
    } catch (err) {
      const code = err.code || "";
      if (code === "auth/user-not-found" || code === "auth/invalid-email") {
        toast.error("No account found with that email.");
      } else {
        toast.error("Failed to send reset email. Try again.");
      }
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      justifyContent: "center",
      position: "relative",
      backgroundImage: "url('/login-bg.png?v=3')",
      backgroundSize: "cover",
      backgroundPosition: "center top",
      backgroundColor: "#0d1f3c",
    }}>
      {/* Dark overlay */}
      <div style={{ position: "absolute", inset: 0, background: "rgba(13,31,60,0.55)", zIndex: 0 }} />

      {/* Left panel — fixed width, vertically centered */}
      <div style={{
        width: "100%", maxWidth: 460,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "40px 32px",
        position: "relative", zIndex: 1,
        minHeight: "100vh",
        margin: "0 auto",
      }}>
        <div style={{ width: "100%", maxWidth: 380 }} className="fade-in">
          {/* Logo */}
          <div style={{ textAlign: "center", marginBottom: 36, display: "flex", flexDirection: "column", alignItems: "center" }}>
            <LogoIcon size={52} />
            <h1 style={{ color: "var(--gold)", fontFamily: "'Poppins', sans-serif", fontSize: 28, marginTop: 12, marginBottom: 4 }}>LibraLog</h1>
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 13 }}>New Era University Library System</p>
          </div>

          {/* Card */}
          <div style={{
            background: "rgba(255,255,255,0.04)", backdropFilter: "blur(12px)",
            border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 32,
          }}>
            {!showReset ? (
              <>
                <h2 style={{ color: "white", fontSize: 20, fontFamily: "'Poppins', sans-serif", marginBottom: 4 }}>Sign In</h2>
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, marginBottom: 24 }}>Enter your credentials to continue</p>

                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div>
                    <label style={labelStyle}>Email Address</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@neu.edu.ph" style={inputStyle}
                      onFocus={e => e.target.style.borderColor = "var(--gold)"} onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.12)"} />
                  </div>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <label style={labelStyle}>Password</label>
                      <button
                        onClick={() => { setShowReset(true); setResetEmail(email); setResetSent(false); }}
                        style={{ background: "none", color: "rgba(201,151,43,0.8)", fontSize: 12, fontWeight: 500, cursor: "pointer", padding: 0 }}
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div style={{ position: "relative" }}>
                      <input type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
                        placeholder="••••••••" onKeyDown={e => e.key === "Enter" && handleSubmit(e)}
                        style={{ ...inputStyle, paddingRight: 42 }}
                        onFocus={e => e.target.style.borderColor = "var(--gold)"} onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.12)"} />
                      <button type="button" onClick={() => setShowPw(v => !v)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", color: "rgba(255,255,255,0.4)", padding: 0, lineHeight: 1 }}>
                        {showPw
                          ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                          : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        }
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div style={{ background: "rgba(217,57,43,0.15)", border: "1px solid rgba(217,57,43,0.4)", borderRadius: 8, padding: "10px 14px", color: "#ff8a80", fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                      {error}
                    </div>
                  )}

                  <button onClick={handleSubmit} disabled={loading} style={{ width: "100%", padding: "12px", background: loading ? "rgba(201,151,43,0.5)" : "var(--gold)", color: "var(--navy)", fontWeight: 700, fontSize: 14, borderRadius: 8, marginTop: 4, cursor: loading ? "not-allowed" : "pointer" }}>
                    {loading ? "Signing in..." : "Sign In"}
                  </button>

                  {/* Divider */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "4px 0" }}>
                    <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.1)" }} />
                    <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 12 }}>or</span>
                    <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.1)" }} />
                  </div>

                  {/* Google Sign-In */}
                  <button onClick={async () => {
                    try {
                      await loginWithGoogle();
                      toast.success("Welcome to NEU Library!");
                      navigate("/dashboard");
                    } catch (err) {
                      if (err.code === "auth/popup-closed-by-user") return;
                      if (err.code === "auth/cancelled-popup-request") return;
                      toast.error("Google sign-in failed. Make sure you use your NEU email.");
                    }
                  }} style={{ width: "100%", padding: "11px", background: "white", color: "#3c4043", fontWeight: 600, fontSize: 14, borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, border: "none" }}>
                    <svg width="18" height="18" viewBox="0 0 48 48">
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                    </svg>
                    Continue with Google
                  </button>
                </div>

                <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 13, textAlign: "center", marginTop: 20 }}>
                  Don't have an account?{" "}
                  <Link to="/register" style={{ color: "var(--gold-light)", fontWeight: 500 }}>Register here</Link>
                </p>
              </>
            ) : (
              /* ── Forgot Password Panel ── */
              <>
                <button onClick={() => setShowReset(false)} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", color: "rgba(255,255,255,0.5)", fontSize: 13, cursor: "pointer", marginBottom: 20, padding: 0 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
                  Back to Sign In
                </button>

                {!resetSent ? (
                  <>
                    <h2 style={{ color: "white", fontSize: 20, fontFamily: "'Poppins', sans-serif", marginBottom: 4 }}>Reset Password</h2>
                    <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, marginBottom: 24 }}>Enter your email and we'll send you a reset link</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                      <div>
                        <label style={labelStyle}>Email Address</label>
                        <input type="email" value={resetEmail} onChange={e => setResetEmail(e.target.value)}
                          placeholder="you@neu.edu.ph" style={inputStyle}
                          onKeyDown={e => e.key === "Enter" && handleReset(e)}
                          onFocus={e => e.target.style.borderColor = "var(--gold)"} onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.12)"} />
                      </div>
                      <button onClick={handleReset} disabled={resetLoading} style={{ width: "100%", padding: "12px", background: resetLoading ? "rgba(201,151,43,0.5)" : "var(--gold)", color: "var(--navy)", fontWeight: 700, fontSize: 14, borderRadius: 8, cursor: resetLoading ? "not-allowed" : "pointer" }}>
                        {resetLoading ? "Sending..." : "Send Reset Link"}
                      </button>
                    </div>
                  </>
                ) : (
                  /* Success state */
                  <div style={{ textAlign: "center", padding: "8px 0" }}>
                    <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(26,154,92,0.15)", border: "1px solid rgba(26,154,92,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                    <h2 style={{ color: "white", fontSize: 18, fontFamily: "'Poppins', sans-serif", marginBottom: 8 }}>Check your email</h2>
                    <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, lineHeight: 1.6 }}>
                      We sent a password reset link to<br />
                      <span style={{ color: "var(--gold-light)", fontWeight: 500 }}>{resetEmail}</span>
                    </p>
                    <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, marginTop: 12 }}>
                      Didn't receive it? Check your spam folder.
                    </p>
                    <button onClick={() => { setShowReset(false); setResetSent(false); }} style={{ marginTop: 20, width: "100%", padding: "11px", background: "var(--gold)", color: "var(--navy)", fontWeight: 700, fontSize: 14, borderRadius: 8, cursor: "pointer" }}>
                      Back to Sign In
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          <p style={{ color: "rgba(255,255,255,0.2)", fontSize: 11, textAlign: "center", marginTop: 20 }}>
            © {new Date().getFullYear()} New Era University · All rights reserved
          </p>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) { .desktop-right { display: none !important; } }
      `}</style>
    </div>
  );
}

const labelStyle = { color: "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: 500, display: "block", marginBottom: 6 };
const inputStyle = { width: "100%", padding: "10px 14px", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 8, color: "white", fontSize: 14, outline: "none", transition: "border-color 0.15s" };