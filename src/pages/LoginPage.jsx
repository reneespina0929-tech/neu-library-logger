// src/pages/LoginPage.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser } from "../firebase/auth";
import toast from "react-hot-toast";

const LogoIcon = ({ size = 40 }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
    <rect width="40" height="40" rx="10" fill="#c9972b" />
    <path d="M10 10h8v20h-8z" fill="white" opacity="0.9" />
    <path d="M20 10h10v2H20zm0 5h10v2H20zm0 5h10v2H20zm0 5h7v2h-7z" fill="white" opacity="0.7" />
    <path d="M8 30h24v2H8z" fill="white" opacity="0.5" />
  </svg>
);

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) { toast.error("Please fill in all fields"); return; }
    setLoading(true);
    try {
      await loginUser(email, password);
      toast.success("Welcome back!");
      navigate("/dashboard");
    } catch (err) {
      const msg = err.code === "auth/invalid-credential"
        ? "Invalid email or password"
        : "Login failed. Please try again.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex",
      background: "linear-gradient(135deg, var(--navy) 0%, #1a2f52 60%, #0d1f3c 100%)",
      position: "relative", zIndex: 9999,
    }}>
      {/* Left panel */}
      <div style={{
        flex: 1, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: 40, maxWidth: 480, margin: "0 auto",
      }}>
        <div style={{ width: "100%", maxWidth: 380 }} className="fade-in">
          {/* Logo */}
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <LogoIcon size={52} />
            <h1 style={{
              color: "var(--gold)", fontFamily: "'Poppins', sans-serif",
              fontSize: 28, marginTop: 12, marginBottom: 4,
            }}>LibraLog</h1>
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 13 }}>
              New Era University Library System
            </p>
          </div>

          {/* Card */}
          <div style={{
            background: "rgba(255,255,255,0.04)", backdropFilter: "blur(12px)",
            border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 32,
          }}>
            <h2 style={{
              color: "white", fontSize: 20, fontFamily: "'Poppins', sans-serif",
              marginBottom: 4,
            }}>Sign In</h2>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, marginBottom: 24 }}>
              Enter your credentials to continue
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: 500, display: "block", marginBottom: 6 }}>
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@neu.edu.ph"
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = "var(--gold)"}
                  onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.12)"}
                />
              </div>
              <div>
                <label style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: 500, display: "block", marginBottom: 6 }}>
                  Password
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    onKeyDown={e => e.key === "Enter" && handleSubmit(e)}
                    style={{ ...inputStyle, paddingRight: 42 }}
                    onFocus={e => e.target.style.borderColor = "var(--gold)"}
                    onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.12)"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(v => !v)}
                    style={{
                      position: "absolute", right: 12, top: "50%",
                      transform: "translateY(-50%)", background: "none",
                      color: "rgba(255,255,255,0.4)", padding: 0, lineHeight: 1,
                    }}
                  >
                    {showPw ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    )}
                  </button>
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={loading}
                style={{
                  width: "100%", padding: "12px",
                  background: loading ? "rgba(201,151,43,0.5)" : "var(--gold)",
                  color: "var(--navy)", fontWeight: 700, fontSize: 14,
                  borderRadius: 8, marginTop: 4, transition: "all 0.15s",
                  cursor: loading ? "not-allowed" : "pointer",
                }}
              >
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </div>

            <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 13, textAlign: "center", marginTop: 20 }}>
              Don't have an account?{" "}
              <Link to="/register" style={{ color: "var(--gold-light)", fontWeight: 500 }}>
                Register here
              </Link>
            </p>
          </div>

          <p style={{ color: "rgba(255,255,255,0.2)", fontSize: 11, textAlign: "center", marginTop: 20 }}>
            © {new Date().getFullYear()} New Era University · All rights reserved
          </p>
        </div>
      </div>

      {/* Right decorative panel */}
      <div style={{
        flex: 1, display: "none", background: "rgba(201,151,43,0.06)",
        borderLeft: "1px solid rgba(255,255,255,0.04)",
        alignItems: "center", justifyContent: "center", padding: 60,
      }} className="desktop-right">
        <div style={{ textAlign: "center", color: "rgba(255,255,255,0.6)" }}>
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="rgba(201,151,43,0.6)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 20 }}>
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
          </svg>
          <h2 style={{
            color: "var(--gold)", fontFamily: "'Poppins', sans-serif",
            fontSize: 26, marginBottom: 12,
          }}>NEU Library Visit Logger</h2>
          <p style={{ fontSize: 14, lineHeight: 1.7, maxWidth: 300, margin: "0 auto", opacity: 0.6 }}>
            Track student visits, manage library attendance, and generate reports — all in one place.
          </p>
        </div>
      </div>

      <style>{`
        @media (min-width: 900px) {
          .desktop-right { display: flex !important; }
        }
      `}</style>
    </div>
  );
}

const inputStyle = {
  width: "100%", padding: "10px 14px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 8, color: "white", fontSize: 14,
  outline: "none", transition: "border-color 0.15s",
};