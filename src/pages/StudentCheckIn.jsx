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

  const [dept, setDept] = useState(userProfile?.department || "");
  const [program, setProgram] = useState(userProfile?.program || "");
  const [studentId, setStudentId] = useState(userProfile?.studentId || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Persist check-in state across refreshes using localStorage
  const getSaved = () => { try { return JSON.parse(localStorage.getItem("neu_checkin") || "null"); } catch { return null; } };
  const saved = getSaved();

  const [purpose, setPurpose] = useState(saved?.purpose || "Study / Review");
  const [checkedIn, setCheckedIn] = useState(saved?.checkedIn || false);
  const [checkInTime, setCheckInTime] = useState(saved?.checkInTime ? new Date(saved.checkInTime) : null);
  const [qrUrl, setQrUrl] = useState(saved?.qrUrl || "");
  const [logId, setLogId] = useState(saved?.logId || null);
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

      // Persist to localStorage so refresh keeps the success screen
      localStorage.setItem("neu_checkin", JSON.stringify({
        checkedIn: true,
        logId: newLogId,
        checkInTime: new Date().toISOString(),
        purpose,
        qrUrl: "",
      }));

      // Generate QR code — encodes as "studentId|studentName"
      const qrData = `${studentId.trim().toUpperCase()}|${userProfile?.displayName || user?.displayName || ""}`;
      try {
        const url = await QRCode.toDataURL(qrData, { width: 200, margin: 1, color: { dark: "#0d1f3c", light: "#ffffff" } });
        setQrUrl(url);
        // Update localStorage with qrUrl
        const existing = getSaved();
        if (existing) localStorage.setItem("neu_checkin", JSON.stringify({ ...existing, qrUrl: url }));
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
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundImage: "url('/login-bg.png')", backgroundSize: "cover", backgroundPosition: "center top", padding: 20, position: "relative" }}>
        <div style={{ position: "absolute", inset: 0, background: "rgba(10,22,40,0.7)" }} />
        <div style={{ width: "100%", maxWidth: 820, display: "flex", borderRadius: 20, overflow: "hidden", boxShadow: "0 24px 60px rgba(0,0,0,0.4)", position: "relative", zIndex: 1 }} className="fade-in">
        <div style={{ flex: 1, background: "white", padding: "48px 40px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minWidth: 0, textAlign: "center" }}>
        <div style={{ width: "100%" }}>
          {/* Success icon */}
          <div style={{ width: 72, height: 72, borderRadius: "50%", background: "rgba(26,154,92,0.1)", border: "2px solid rgba(26,154,92,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#1a9a5c" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          </div>

          <p style={{ fontSize: 11, fontWeight: 700, color: "#c9972b", letterSpacing: "0.12em", textTransform: "uppercase", margin: "0 0 6px", fontFamily: "'Poppins',sans-serif" }}>
            NEU Library
          </p>
          <h1 style={{ color: "#0d1f3c", fontFamily: "'Poppins',sans-serif", fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
            Hi, {userProfile?.displayName?.split(" ")[0] || user?.displayName?.split(" ")[0] || "Student"}!
          </h1>
          <p style={{ color: "#c9972b", fontSize: 17, fontWeight: 600, marginBottom: 4, fontFamily: "'Poppins',sans-serif" }}>
            Welcome to NEU Library!
          </p>
          <p style={{ color: "#888", fontSize: 13, marginBottom: 4, fontFamily: "'Poppins',sans-serif" }}>
            {purpose}
          </p>
          {checkInTime && (
            <p style={{ color: "#aaa", fontSize: 12, marginBottom: 20, fontFamily: "'Poppins',sans-serif" }}>
              Checked in at {format(checkInTime, "hh:mm a")} · {format(checkInTime, "MMMM d, yyyy")}
            </p>
          )}

          {/* QR Code */}
          {qrUrl && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ background: "white", borderRadius: 12, padding: 12, display: "inline-block", boxShadow: "0 2px 12px rgba(0,0,0,0.1)", border: "1px solid #f0f0f0" }}>
                <img src={qrUrl} alt="Your QR Code" width={140} height={140} style={{ display: "block" }} />
              </div>
              <div style={{ marginTop: 10, padding: "10px 14px", background: "#f8f9fb", borderRadius: 8, border: "1px solid #eee", textAlign: "left" }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: "#0d1f3c", margin: "0 0 3px", fontFamily: "'Poppins',sans-serif" }}>📲 Save your QR code</p>
                <p style={{ fontSize: 11, color: "#888", margin: 0, lineHeight: 1.5, fontFamily: "'Poppins',sans-serif" }}>Show this to the librarian on your next visit for faster check-in — no need to type your Student ID.</p>
              </div>
              <button onClick={() => {
                const a = document.createElement("a");
                a.href = qrUrl;
                a.download = `neu-library-qr-${studentId}.png`;
                a.click();
              }} style={{
                marginTop: 10, display: "inline-flex", alignItems: "center", gap: 6,
                padding: "7px 16px", background: "white",
                border: "1px solid #e0e0e0", borderRadius: 8,
                color: "#0d1f3c", fontSize: 12, fontWeight: 600, cursor: "pointer",
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
                localStorage.removeItem("neu_checkin");
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

          </div>
        </div>
        </div>
        {/* Right quote panel */}
        <div style={{ flex: 1, position: "relative", overflow: "hidden", minWidth: 0, backgroundImage: "url('/login-bg.png')", backgroundSize: "cover", backgroundPosition: "center top" }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(13,31,60,0.78)" }} />
          <div style={{ position: "relative", zIndex: 1, height: "100%", padding: "40px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 72, lineHeight: 1, color: "#c9972b", fontFamily: "Georgia,serif", marginBottom: 4 }}>"</div>
              <p style={{ color: "white", fontSize: 17, fontWeight: 600, lineHeight: 1.6, margin: "0 0 16px", fontFamily: "'Poppins',sans-serif" }}>A library is not a luxury but one of the necessities of life.</p>
              <div style={{ width: 32, height: 2, background: "#c9972b", borderRadius: 2, marginBottom: 10 }} />
              <p style={{ color: "rgba(201,151,43,0.75)", fontSize: 12, margin: 0, fontFamily: "'Poppins',sans-serif" }}>— Henry Ward Beecher</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: "rgba(201,151,43,0.12)", border: "1px solid rgba(201,151,43,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <img src="/neu-logo.png" width={20} height={20} alt="NEU" style={{ objectFit: "contain" }} />
              </div>
              <div>
                <p style={{ color: "#c9972b", fontSize: 13, fontWeight: 700, margin: 0, fontFamily: "'Poppins',sans-serif" }}>LibraLog</p>
                <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, margin: 0, fontFamily: "'Poppins',sans-serif" }}>New Era University</p>
              </div>
            </div>
          </div>
        </div>
        </div>
        <style>{`@media(max-width:640px){.login-split{flex-direction:column!important;max-width:400px!important;}.login-quote{min-height:160px;}}`}</style>
      </div>
    );
  }

  // ── Check-In Form ──
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundImage: "url('/login-bg.png')", backgroundSize: "cover", backgroundPosition: "center top", padding: 20, position: "relative" }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(10,22,40,0.7)" }} />
      <div style={{ width: "100%", maxWidth: 820, display: "flex", borderRadius: 20, position: "relative", zIndex: 1, overflow: "hidden", boxShadow: "0 24px 60px rgba(0,0,0,0.4)" }} className="fade-in">

        {/* Left: form */}
        <div style={{ flex: 1, background: "white", padding: "40px", display: "flex", flexDirection: "column", justifyContent: "center", minWidth: 0 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "#c9972b", letterSpacing: "0.12em", textTransform: "uppercase", margin: "0 0 8px", fontFamily: "'Poppins',sans-serif" }}>NEU Library</p>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0d1f3c", margin: "0 0 4px", fontFamily: "'Poppins',sans-serif" }}>Library Check-In</h1>
          <p style={{ fontSize: 13, color: "#888", margin: "0 0 20px", fontFamily: "'Poppins',sans-serif" }}>
            Welcome, <strong style={{ color: "#0d1f3c" }}>{userProfile?.displayName || user?.displayName || user?.email}</strong>
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>

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
                onFocus={e => e.target.style.borderColor = "#c9972b"}
                onBlur={e => e.target.style.borderColor = "#e0e0e0"}
              />
            </div>

            {/* Dept + Program — only if not set in profile */}
            {!hasDept && (
              <>
                <div>
                  <label style={labelStyle}>Department / College <span style={{ color: "#ff8080" }}>*</span></label>
                  <select value={dept} onChange={e => { setDept(e.target.value); setProgram(""); }} style={selectStyle}
                    onFocus={e => e.target.style.borderColor = "#c9972b"}
                    onBlur={e => e.target.style.borderColor = "#e0e0e0"}>
                    <option value="" disabled>Select your department...</option>
                    {DEPT_KEYS.map(k => <option key={k} value={k}>{k} — {DEPARTMENTS[k].label}</option>)}
                  </select>
                </div>
                {dept && (
                  <div>
                    <label style={labelStyle}>Program <span style={{ color: "#ff8080" }}>*</span></label>
                    <select value={program} onChange={e => setProgram(e.target.value)} style={selectStyle}
                      onFocus={e => e.target.style.borderColor = "#c9972b"}
                      onBlur={e => e.target.style.borderColor = "#e0e0e0"}>
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
                onFocus={e => e.target.style.borderColor = "#c9972b"}
                onBlur={e => e.target.style.borderColor = "#e0e0e0"}>
                <option value="" disabled>Select purpose...</option>
                {purposeOptions.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            {/* Error */}
            {error && (
              <div style={{ background: "rgba(217,57,43,0.08)", border: "1px solid rgba(217,57,43,0.3)", borderRadius: 8, padding: "10px 14px", color: "#c0392b", fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                {error}
              </div>
            )}

            {/* Submit */}
            <button onClick={handleSubmit} disabled={loading} style={{
              width: "100%", padding: "13px",
              background: loading ? "rgba(201,151,43,0.5)" : "linear-gradient(135deg, #d4a032, #c9972b)",
              color: "#0d1f3c", fontWeight: 700, fontSize: 15,
              borderRadius: 10, cursor: loading ? "not-allowed" : "pointer",
              border: "none", fontFamily: "'Poppins',sans-serif",
              boxShadow: loading ? "none" : "0 4px 14px rgba(201,151,43,0.35)",
              transition: "all 0.2s",
            }}>
              {loading ? "Logging in..." : "Log My Visit"}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

const labelStyle = { color: "#555", fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6, fontFamily: "'Poppins',sans-serif" };
const inputStyle = {
  width: "100%", padding: "10px 14px",
  background: "white", border: "1px solid #e0e0e0",
  borderRadius: 8, color: "#0d1f3c", fontSize: 14, outline: "none",
  transition: "border-color 0.15s", fontFamily: "'Poppins',sans-serif",
};
const selectStyle = { ...inputStyle, cursor: "pointer" };