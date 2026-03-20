// src/pages/StudentCheckIn.jsx
import { useState, useEffect, useRef } from "react";
import { useAuth } from "../hooks/useAuth.jsx";
import { logoutUser } from "../firebase/auth";
import { timeIn } from "../firebase/logs";
import { purposeOptions } from "../utils/helpers";
import { DEPARTMENTS, DEPT_KEYS } from "../utils/departments";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import { format } from "date-fns";
import QRCode from "qrcode";
import toast from "react-hot-toast";

const LogoIcon = ({ size = 40 }) => (
  <img src="/neu-logo.png" width={size} height={size} alt="NEU Logo"
    style={{ objectFit: "contain", display: "block" }} />
);

export default function StudentCheckIn() {
  const { user, userProfile } = useAuth();

  const [purpose, setPurpose] = useState("Study / Review");
  const [dept, setDept] = useState(userProfile?.department || "");
  const [program, setProgram] = useState(userProfile?.program || "");
  const [studentId, setStudentId] = useState(userProfile?.studentId || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [checkedIn, setCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState(null);
  const [qrUrl, setQrUrl] = useState("");
  const [logId, setLogId] = useState(null);
  const [timingOut, setTimingOut] = useState(false);
  const qrCanvasRef = useRef(null);

  // Auto-format student ID as XX-XXXXX-XXXX
  const formatStudentId = (raw) => {
    const digits = raw.replace(/\D/g, "");
    if (digits.length <= 2) return digits;
    if (digits.length <= 7) return `${digits.slice(0, 2)}-${digits.slice(2)}`;
    return `${digits.slice(0, 2)}-${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
  };

  const handleStudentIdChange = (e) => {
    setStudentId(formatStudentId(e.target.value));
  };

  const handleStudentIdKeyDown = (e) => {
    if (e.key === "Backspace" && studentId.endsWith("-")) {
      e.preventDefault();
      setStudentId(studentId.slice(0, -1));
    }
  };

  const hasDept = !!(userProfile?.department);
  const programs = dept ? DEPARTMENTS[dept]?.programs || [] : [];

  const [logId, setLogId] = useState(null);
  const [timingOut, setTimingOut] = useState(false);

  const handleSubmit = async () => {
    setError("");
    if (!purpose) { setError("Please select your purpose of visit."); return; }
    if (!hasDept && !dept) { setError("Please select your department."); return; }
    if (!hasDept && dept && !program) { setError("Please select your program."); return; }
    if (!studentId.trim()) { setError("Please enter your Student ID."); return; }

    setLoading(true);
    try {
      // Save dept/program back to profile if it was missing
      if (!hasDept && dept && userProfile?.uid) {
        await updateDoc(doc(db, "users", user.uid), {
          department: dept,
          program: program,
          studentId: studentId.trim().toUpperCase(),
        });
      }

      const newLogId = await timeIn(
        studentId.trim().toUpperCase(),
        userProfile?.displayName || user?.displayName || user?.email,
        purpose,
        userProfile?.displayName || user?.email,
        user?.uid
      );
      setLogId(newLogId);
      setCheckInTime(new Date());
      setCheckedIn(true);

      // Generate QR code — encodes as "studentId|studentName"
      const qrData = `${studentId.trim().toUpperCase()}|${userProfile?.displayName || user?.displayName || ""}`;
      try {
        const url = await QRCode.toDataURL(qrData, { width: 200, margin: 1, color: { dark: "#0d1f3c", light: "#ffffff" } });
        setQrUrl(url);
      } catch { /* silently skip if QR fails */ }
    } catch (err) {
      setError("Failed to log visit. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Success Screen ──
  if (checkedIn) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        position: "relative",
        backgroundImage: "url('/login-bg.png?v=3')",
        backgroundSize: "cover", backgroundPosition: "center top",
        backgroundColor: "#0d1f3c", padding: 20,
      }}>
        <div style={{ position: "absolute", inset: 0, background: "rgba(13,31,60,0.7)", zIndex: 0 }} />
        <div style={{ position: "relative", zIndex: 1, textAlign: "center", maxWidth: 420, width: "100%" }} className="fade-in">
          {/* Success icon */}
          <div style={{ width: 80, height: 80, borderRadius: "50%", background: "rgba(26,154,92,0.15)", border: "2px solid rgba(26,154,92,0.4)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          </div>

          <h1 style={{ color: "var(--gold)", fontFamily: "'Poppins',sans-serif", fontSize: 28, fontWeight: 700, marginBottom: 8 }}>
            Welcome to NEU Library!
          </h1>
          <p style={{ color: "white", fontSize: 18, fontWeight: 500, marginBottom: 6 }}>
            {userProfile?.displayName || user?.displayName || "Student"}
          </p>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, marginBottom: 6 }}>
            {purpose}
          </p>
          {checkInTime && (
            <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 13, marginBottom: 24 }}>
              Checked in at {format(checkInTime, "hh:mm a")} · {format(checkInTime, "MMMM d, yyyy")}
            </p>
          )}

          {/* QR Code */}
          {qrUrl && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ background: "white", borderRadius: 16, padding: 16, display: "inline-block", boxShadow: "0 4px 20px rgba(0,0,0,0.3)" }}>
                <img src={qrUrl} alt="Your QR Code" width={160} height={160} style={{ display: "block" }} />
              </div>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginTop: 8 }}>
                Your personal QR code — show this to the librarian next visit
              </p>
              <button onClick={() => {
                const a = document.createElement("a");
                a.href = qrUrl;
                a.download = `neu-library-qr-${studentId}.png`;
                a.click();
              }} style={{
                marginTop: 10, display: "inline-flex", alignItems: "center", gap: 6,
                padding: "7px 16px", background: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,255,255,0.2)", borderRadius: 8,
                color: "white", fontSize: 12, fontWeight: 600, cursor: "pointer",
                fontFamily: "'Poppins',sans-serif",
              }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Save QR Code
              </button>
            </div>
          )}

          {/* Buttons */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
            <button onClick={async () => {
              if (!logId) { await logoutUser(); return; }
              setTimingOut(true);
              try {
                const { timeOut } = await import("../firebase/logs");
                await timeOut(logId);
                toast.success("You've been timed out. Goodbye!");
              } catch {
                toast.error("Failed to time out. Please ask the librarian.");
              } finally {
                setTimingOut(false);
                await logoutUser();
              }
            }} disabled={timingOut} style={{
              padding: "12px 36px", background: "linear-gradient(135deg, #1a9a5c, #16a34a)",
              color: "white", fontWeight: 700, fontSize: 15, borderRadius: 10,
              cursor: timingOut ? "not-allowed" : "pointer", border: "none",
              fontFamily: "'Poppins',sans-serif", opacity: timingOut ? 0.7 : 1,
              boxShadow: "0 4px 14px rgba(26,154,92,0.4)",
            }}>
              {timingOut ? "Timing out..." : "⏱ Time Out & Leave"}
            </button>
            <button onClick={() => logoutUser()} style={{
              padding: "9px 24px", background: "transparent",
              color: "rgba(255,255,255,0.45)", fontWeight: 500, fontSize: 13,
              borderRadius: 8, cursor: "pointer", border: "1px solid rgba(255,255,255,0.15)",
              fontFamily: "'Poppins',sans-serif",
            }}>
              Stay inside — sign out only
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Check-In Form ──
  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      position: "relative",
      backgroundImage: "url('/login-bg.png?v=3')",
      backgroundSize: "cover", backgroundPosition: "center top",
      backgroundColor: "#0d1f3c", padding: 20,
    }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(13,31,60,0.6)", zIndex: 0 }} />

      <div style={{ width: "100%", maxWidth: 420, position: "relative", zIndex: 1 }} className="fade-in">
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 28, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <LogoIcon size={52} />
          <h1 style={{ color: "var(--gold)", fontFamily: "'Poppins',sans-serif", fontSize: 24, marginTop: 12, marginBottom: 4, fontWeight: 700 }}>
            Library Check-In
          </h1>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13 }}>
            Welcome, <strong style={{ color: "white" }}>{userProfile?.displayName || user?.displayName || user?.email}</strong>
          </p>
        </div>

        <div style={{ background: "rgba(255,255,255,0.05)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: 28 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            {/* Student ID */}
            <div>
              <label style={labelStyle}>Student ID <span style={{ color: "#ff8080" }}>*</span></label>
              <input
                type="text"
                inputMode="numeric"
                value={studentId}
                onChange={handleStudentIdChange}
                onKeyDown={handleStudentIdKeyDown}
                placeholder="24-12781-942"
                maxLength={12}
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = "var(--gold)"}
                onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.15)"}
              />
            </div>

            {/* Dept + Program — only if not set in profile */}
            {!hasDept && (
              <>
                <div>
                  <label style={labelStyle}>Department / College <span style={{ color: "#ff8080" }}>*</span></label>
                  <select value={dept} onChange={e => { setDept(e.target.value); setProgram(""); }} style={selectStyle}
                    onFocus={e => e.target.style.borderColor = "var(--gold)"}
                    onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.15)"}>
                    <option value="" disabled>Select your department...</option>
                    {DEPT_KEYS.map(k => <option key={k} value={k}>{k} — {DEPARTMENTS[k].label}</option>)}
                  </select>
                </div>
                {dept && (
                  <div>
                    <label style={labelStyle}>Program <span style={{ color: "#ff8080" }}>*</span></label>
                    <select value={program} onChange={e => setProgram(e.target.value)} style={selectStyle}
                      onFocus={e => e.target.style.borderColor = "var(--gold)"}
                      onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.15)"}>
                      <option value="" disabled>Select your program...</option>
                      {programs.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                )}
              </>
            )}

            {/* Purpose */}
            <div>
              <label style={labelStyle}>Purpose of Visit <span style={{ color: "#ff8080" }}>*</span></label>
              <select value={purpose} onChange={e => setPurpose(e.target.value)} style={selectStyle}
                onFocus={e => e.target.style.borderColor = "var(--gold)"}
                onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.15)"}>
                <option value="" disabled>Select purpose...</option>
                {purposeOptions.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            {/* Error */}
            {error && (
              <div style={{ background: "rgba(217,57,43,0.15)", border: "1px solid rgba(217,57,43,0.4)", borderRadius: 8, padding: "10px 14px", color: "#ff8a80", fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                {error}
              </div>
            )}

            {/* Submit */}
            <button onClick={handleSubmit} disabled={loading} style={{
              width: "100%", padding: "13px",
              background: loading ? "rgba(201,151,43,0.5)" : "linear-gradient(135deg, #d4a032, #c9972b)",
              color: "var(--navy)", fontWeight: 700, fontSize: 15,
              borderRadius: 10, cursor: loading ? "not-allowed" : "pointer",
              border: "none", fontFamily: "'Poppins',sans-serif",
              boxShadow: loading ? "none" : "0 4px 14px rgba(201,151,43,0.35)",
              transition: "all 0.2s",
            }}>
              {loading ? "Logging in..." : "Log My Visit"}
            </button>
          </div>
        </div>

        {/* Sign out link */}
        <p style={{ textAlign: "center", marginTop: 16 }}>
          <button onClick={() => logoutUser()} style={{ background: "none", color: "rgba(255,255,255,0.35)", fontSize: 12, cursor: "pointer", fontFamily: "'Poppins',sans-serif" }}>
            Not you? Sign out
          </button>
        </p>
      </div>
    </div>
  );
}

const labelStyle = { color: "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6 };
const inputStyle = {
  width: "100%", padding: "10px 14px",
  background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)",
  borderRadius: 8, color: "white", fontSize: 14, outline: "none",
  transition: "border-color 0.15s", fontFamily: "'Poppins',sans-serif",
};
const selectStyle = { ...inputStyle, cursor: "pointer" };