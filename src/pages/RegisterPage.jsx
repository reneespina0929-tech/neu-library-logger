// src/pages/RegisterPage.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../firebase/auth";
import toast from "react-hot-toast";

const LogoIcon = ({ size = 40 }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
    <rect width="40" height="40" rx="10" fill="#c9972b" />
    <path d="M10 10h8v20h-8z" fill="white" opacity="0.9" />
    <path d="M20 10h10v2H20zm0 5h10v2H20zm0 5h10v2H20zm0 5h7v2h-7z" fill="white" opacity="0.7" />
    <path d="M8 30h24v2H8z" fill="white" opacity="0.5" />
  </svg>
);

export default function RegisterPage() {
  const [form, setForm] = useState({ displayName: "", email: "", password: "", confirm: "" });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.displayName || !form.email || !form.password) {
      toast.error("Please fill in all fields"); return;
    }
    if (!form.email.toLowerCase().endsWith("@neu.edu.ph")) {
      toast.error("Please use your NEU email (@neu.edu.ph)"); return;
    }
    if (form.password.length < 6) {
      toast.error("Password must be at least 6 characters"); return;
    }
    if (form.password !== form.confirm) {
      toast.error("Passwords do not match"); return;
    }
    setLoading(true);
    try {
      await registerUser(form.email, form.password, form.displayName, "student");
      toast.success("Account created! Welcome.");
      navigate("/dashboard");
    } catch (err) {
      const msg = err.code === "auth/email-already-in-use"
        ? "This email is already registered"
        : "Registration failed. Please try again.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "linear-gradient(135deg, var(--navy) 0%, #1a2f52 60%, #0d1f3c 100%)",
      padding: 20,
    }}>
      <div style={{ width: "100%", maxWidth: 400 }} className="fade-in">
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <LogoIcon size={48} />
          <h1 style={{
            color: "var(--gold)", fontFamily: "'Poppins', sans-serif",
            fontSize: 24, marginTop: 10, marginBottom: 3,
          }}>LibraLog</h1>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>New Era University Library</p>
        </div>

        <div style={{
          background: "rgba(255,255,255,0.04)", backdropFilter: "blur(12px)",
          border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 28,
        }}>
          <h2 style={{ color: "white", fontFamily: "'Poppins', sans-serif", fontSize: 18, marginBottom: 4 }}>
            Create Account
          </h2>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, marginBottom: 22 }}>
            Register to access the library system
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Field label="Full Name" value={form.displayName} onChange={set("displayName")} placeholder="Juan Dela Cruz" />
            <div>
              <label style={labelStyle}>Email Address</label>
              <input
                type="email" value={form.email} onChange={set("email")}
                placeholder="yourname@neu.edu.ph"
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = "var(--gold)"}
                onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.12)"}
              />
              <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, marginTop: 5 }}>
                Must be a valid NEU email (@neu.edu.ph)
              </p>
            </div>
            <Field label="Password" type="password" value={form.password} onChange={set("password")} placeholder="At least 6 characters" />
            <Field label="Confirm Password" type="password" value={form.confirm} onChange={set("confirm")} placeholder="Repeat password"
              onKeyDown={e => e.key === "Enter" && handleSubmit(e)}
            />

            <button
              onClick={handleSubmit}
              disabled={loading}
              style={{
                width: "100%", padding: "12px",
                background: loading ? "rgba(201,151,43,0.5)" : "var(--gold)",
                color: "var(--navy)", fontWeight: 700, fontSize: 14,
                borderRadius: 8, marginTop: 6, transition: "all 0.15s",
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </div>

          <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 13, textAlign: "center", marginTop: 18 }}>
            Already have an account?{" "}
            <Link to="/login" style={{ color: "var(--gold-light)", fontWeight: 500 }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

const labelStyle = { color: "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: 500, display: "block", marginBottom: 6 };
const inputStyle = {
  width: "100%", padding: "10px 14px",
  background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 8, color: "white", fontSize: 14, outline: "none", transition: "border-color 0.15s",
};

const Field = ({ label, type = "text", value, onChange, placeholder, onKeyDown }) => (
  <div>
    <label style={labelStyle}>{label}</label>
    <input
      type={type} value={value} onChange={onChange} placeholder={placeholder}
      onKeyDown={onKeyDown}
      style={inputStyle}
      onFocus={e => e.target.style.borderColor = "var(--gold)"}
      onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.12)"}
    />
  </div>
);