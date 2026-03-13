// src/pages/ProfilePage.jsx
import { useState, useEffect, useRef } from "react";
import { useAuth } from '../hooks/useAuth.jsx';
import { subscribeLogs } from "../firebase/logs";
import { formatTimestamp, formatDate, formatDuration } from "../utils/helpers";
import { updateProfile, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { auth, db } from "../firebase/config";
import toast from "react-hot-toast";
import QRCode from "qrcode";

export default function ProfilePage() {
  const { user, userProfile } = useAuth();
  const [myLogs, setMyLogs] = useState([]);
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [studentId, setStudentId] = useState(userProfile?.studentId || "");
  const [saving, setSaving] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const [showQr, setShowQr] = useState(false);

  // Local state that updates immediately on save (no refresh needed)
  const [localName, setLocalName] = useState(user?.displayName || "");
  const [localStudentId, setLocalStudentId] = useState(userProfile?.studentId || "");

  // Change password state
  const [showPwForm, setShowPwForm] = useState(false);
  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [pwLoading, setPwLoading] = useState(false);
  const [showPw, setShowPw] = useState({ current: false, next: false, confirm: false });

  const initials = localName
    .split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "U";

  // Sync from auth/firestore on first load
  useEffect(() => {
    if (user?.displayName) { setDisplayName(user.displayName); setLocalName(user.displayName); }
  }, [user?.displayName]);

  useEffect(() => {
    if (userProfile?.studentId) { setStudentId(userProfile.studentId); setLocalStudentId(userProfile.studentId); }
  }, [userProfile?.studentId]);

  // Generate QR code whenever studentId or displayName changes
  useEffect(() => {
    const id = localStudentId;
    const name = localName;
    if (!id) { setQrDataUrl(null); return; }
    QRCode.toDataURL(`${id}|${name}`, {
      width: 240, margin: 2,
      color: { dark: "#0d1f3c", light: "#ffffff" },
    }).then(setQrDataUrl).catch(console.error);
  }, [localStudentId, localName]);

  useEffect(() => {
    if (!user) return;
    // Subscribe to all logs, filter client-side by uid OR by name/email
    // This covers both old logs (no loggedByUid) and new ones
    const unsub = subscribeLogs((allLogs) => {
      const mine = allLogs.filter(
        l => l.loggedByUid === user.uid ||
             l.loggedBy === user.displayName ||
             l.loggedBy === user.email
      );
      setMyLogs(mine);
    });
    return unsub;
  }, [user]);

  const handleSave = async () => {
    if (!displayName.trim()) { toast.error("Name cannot be empty"); return; }
    setSaving(true);
    try {
      await updateProfile(auth.currentUser, { displayName: displayName.trim() });
      await updateDoc(doc(db, "users", user.uid), {
        displayName: displayName.trim(),
        studentId: studentId.trim().toUpperCase(),
      });
      // Update local display state immediately — no refresh needed
      setLocalName(displayName.trim());
      setLocalStudentId(studentId.trim().toUpperCase());
      toast.success("Profile updated!");
      setEditing(false);
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    const { current, next, confirm } = pwForm;
    if (!current || !next || !confirm) { toast.error("Please fill in all fields."); return; }
    if (next.length < 6) { toast.error("New password must be at least 6 characters."); return; }
    if (next !== confirm) { toast.error("New passwords don't match."); return; }
    setPwLoading(true);
    try {
      // Re-authenticate first (Firebase requires this for sensitive changes)
      const credential = EmailAuthProvider.credential(user.email, current);
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, next);
      toast.success("Password changed successfully!");
      setShowPwForm(false);
      setPwForm({ current: "", next: "", confirm: "" });
    } catch (err) {
      const code = err.code || "";
      if (code === "auth/wrong-password" || code === "auth/invalid-credential") {
        toast.error("Current password is incorrect.");
      } else if (code === "auth/too-many-requests") {
        toast.error("Too many attempts. Please wait and try again.");
      } else {
        toast.error("Failed to change password. Try again.");
      }
    } finally {
      setPwLoading(false);
    }
  };

  const totalVisits = myLogs.length;
  const completedVisits = myLogs.filter(l => l.status === "completed").length;

  return (
    <div className="fade-in">
      <style>{`
        .profile-layout { display: flex; gap: 20px; align-items: flex-start; }
        .profile-card { flex: 0 0 280px; background: white; border-radius: 12px; box-shadow: var(--shadow-sm); border: 1px solid var(--gray-100); overflow: hidden; }
        .profile-history { flex: 1; min-width: 0; background: white; border-radius: 12px; box-shadow: var(--shadow-sm); border: 1px solid var(--gray-100); overflow: hidden; }
        .history-table { width: 100%; border-collapse: collapse; }
        .history-table th { padding: 9px 14px; text-align: left; font-size: 11px; font-weight: 600; color: var(--gray-400); text-transform: uppercase; letter-spacing: .06em; background: var(--gray-50); white-space: nowrap; }
        .history-table td { padding: 11px 14px; font-size: 13px; border-top: 1px solid var(--gray-100); }
        .hist-card { padding: 12px 16px; border-top: 1px solid var(--gray-100); }
        .hist-card:first-child { border-top: none; }
        @media (max-width: 768px) {
          .profile-layout { flex-direction: column; }
          .profile-card { flex: none; width: 100%; }
          .profile-history { width: 100%; }
          .desktop-hist { display: none !important; }
          .mobile-hist { display: block !important; }
        }
        .mobile-hist { display: none; }
      `}</style>

      <div style={{ marginBottom: 16 }}>
        <h1 style={{ fontSize: 20, marginBottom: 2 }}>My Profile</h1>
        <p style={{ color: "var(--gray-400)", fontSize: 13 }}>Your account information and visit history</p>
      </div>

      <div className="profile-layout">
        {/* Profile Card */}
        <div className="profile-card">
          <div style={{ background: "var(--navy)", padding: "24px 20px", textAlign: "center" }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--gold)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px", color: "var(--navy)", fontWeight: 800, fontSize: 22, fontFamily: "'Poppins', sans-serif" }}>{initials}</div>
            {editing ? (
              <input value={displayName} onChange={e => setDisplayName(e.target.value)} style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "white", padding: "6px 10px", borderRadius: 6, fontSize: 15, outline: "none", textAlign: "center", width: "100%" }} />
            ) : (
              <h2 style={{ color: "white", fontFamily: "'Poppins', sans-serif", fontSize: 17 }}>{localName || "User"}</h2>
            )}
            <span style={{ display: "inline-block", marginTop: 6, background: "rgba(201,151,43,0.2)", color: "var(--gold-light)", fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 20, textTransform: "capitalize" }}>{userProfile?.role || "student"}</span>
          </div>

          <div style={{ padding: "16px 20px" }}>
            <InfoItem label="Email" value={user?.email || "—"} />
            <div style={{ marginBottom: 12 }}>
              <div style={{ color: "var(--gray-400)", fontSize: 11, fontWeight: 600, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>Student ID</div>
              {editing ? (
                <input value={studentId} onChange={e => setStudentId(e.target.value)} placeholder="e.g. 24-12345-678" style={{ width: "100%", padding: "7px 10px", border: "1px solid var(--gray-200)", borderRadius: 6, fontSize: 14, outline: "none", fontFamily: "'Poppins', sans-serif" }} onFocus={e => e.target.style.borderColor = "var(--navy)"} onBlur={e => e.target.style.borderColor = "var(--gray-200)"} />
              ) : (
                <div style={{ fontSize: 14, color: "var(--gray-800)", fontWeight: localStudentId ? 500 : 400 }}>
                  {localStudentId || <span style={{ color: "var(--gray-400)", fontStyle: "italic" }}>Not set — click Edit to add</span>}
                </div>
              )}
            </div>
            <InfoItem label="Member Since" value={user?.metadata?.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString("en-PH", { month: "long", year: "numeric" }) : "—"} />

            <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
              {editing ? (<>
                <button onClick={handleSave} disabled={saving} style={{ flex: 1, padding: "8px", background: "var(--navy)", color: "white", fontWeight: 600, fontSize: 14, borderRadius: 8, cursor: "pointer" }}>{saving ? "Saving..." : "Save"}</button>
                <button onClick={() => { setEditing(false); setDisplayName(user?.displayName || ""); }} style={{ flex: 1, padding: "8px", background: "var(--gray-100)", color: "var(--gray-600)", fontWeight: 600, fontSize: 14, borderRadius: 8, cursor: "pointer" }}>Cancel</button>
              </>) : (
                <button onClick={() => setEditing(true)} style={{ width: "100%", padding: "8px", background: "var(--gray-100)", color: "var(--gray-800)", fontWeight: 600, fontSize: 14, borderRadius: 8, cursor: "pointer" }}>Edit Display Name</button>
              )}
            </div>
          </div>

          <div style={{ borderTop: "1px solid var(--gray-100)", padding: "14px 20px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <StatMini label="Total Visits" value={totalVisits} />
            <StatMini label="Completed" value={completedVisits} />
          </div>

          {/* Change Password */}
          <div style={{ borderTop: "1px solid var(--gray-100)", padding: "14px 20px" }}>
            {!showPwForm ? (
              <button
                onClick={() => setShowPwForm(true)}
                style={{ width: "100%", padding: "8px", background: "var(--gray-50)", border: "1px solid var(--gray-200)", color: "var(--gray-700)", fontWeight: 600, fontSize: 13, borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                Change Password
              </button>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "var(--gray-600)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Change Password</span>
                  <button onClick={() => { setShowPwForm(false); setPwForm({ current: "", next: "", confirm: "" }); }} style={{ background: "none", color: "var(--gray-400)", fontSize: 18, cursor: "pointer", lineHeight: 1 }}>×</button>
                </div>
                {[
                  { key: "current", label: "Current Password" },
                  { key: "next",    label: "New Password" },
                  { key: "confirm", label: "Confirm New Password" },
                ].map(({ key, label }) => (
                  <div key={key} style={{ position: "relative" }}>
                    <input
                      type={showPw[key] ? "text" : "password"}
                      placeholder={label}
                      value={pwForm[key]}
                      onChange={e => setPwForm(f => ({ ...f, [key]: e.target.value }))}
                      onKeyDown={e => e.key === "Enter" && handleChangePassword()}
                      style={{ width: "100%", padding: "9px 36px 9px 12px", border: "1px solid var(--gray-200)", borderRadius: 8, fontSize: 13, outline: "none", fontFamily: "'Poppins',sans-serif" }}
                      onFocus={e => e.target.style.borderColor = "var(--navy)"}
                      onBlur={e => e.target.style.borderColor = "var(--gray-200)"}
                    />
                    <button type="button" onClick={() => setShowPw(s => ({ ...s, [key]: !s[key] }))}
                      style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", color: "var(--gray-400)", padding: 0, cursor: "pointer", lineHeight: 1 }}>
                      {showPw[key]
                        ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                        : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      }
                    </button>
                  </div>
                ))}
                <button onClick={handleChangePassword} disabled={pwLoading}
                  style={{ padding: "9px", background: pwLoading ? "rgba(13,31,60,0.4)" : "var(--navy)", color: "white", fontWeight: 600, fontSize: 13, borderRadius: 8, cursor: pwLoading ? "not-allowed" : "pointer", width: "100%" }}>
                  {pwLoading ? "Saving..." : "Update Password"}
                </button>
              </div>
            )}
          </div>

          {/* QR Code section */}
          <div style={{ borderTop: "1px solid var(--gray-100)", padding: "16px 20px" }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--gray-400)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
              My Library QR Code
            </div>
            {!localStudentId ? (
              <div style={{ background: "var(--gray-50)", border: "1px dashed var(--gray-200)", borderRadius: 10, padding: "16px 12px", textAlign: "center" }}>
                <p style={{ fontSize: 12, color: "var(--gray-400)", marginBottom: 8 }}>Set your Student ID to generate your personal QR code</p>
                <button onClick={() => setEditing(true)} style={{ fontSize: 12, color: "var(--navy)", fontWeight: 600, textDecoration: "underline", cursor: "pointer", background: "none" }}>
                  Add Student ID
                </button>
              </div>
            ) : qrDataUrl ? (
              <div style={{ textAlign: "center" }}>
                <div style={{ display: "inline-block", padding: 10, background: "white", border: "2px solid var(--gray-100)", borderRadius: 12, cursor: "pointer" }} onClick={() => setShowQr(true)}>
                  <img src={qrDataUrl} alt="My QR Code" style={{ width: 120, height: 120, display: "block" }} />
                </div>
                <p style={{ fontSize: 11, color: "var(--gray-400)", marginTop: 8 }}>Tap to enlarge · Show this to staff when entering</p>
                <button
                  onClick={() => {
                    const a = document.createElement("a");
                    a.href = qrDataUrl;
                    a.download = `libraqr-${localStudentId}.png`;
                    a.click();
                  }}
                  style={{ marginTop: 8, display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, color: "var(--navy)", fontWeight: 600, padding: "6px 12px", border: "1px solid var(--gray-200)", borderRadius: 6, cursor: "pointer", background: "white" }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  Save QR
                </button>
              </div>
            ) : null}
          </div>
        </div>

        {/* QR Fullscreen Modal */}
        {showQr && qrDataUrl && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }} onClick={() => setShowQr(false)}>
            <div style={{ background: "white", borderRadius: 20, padding: 32, textAlign: "center", maxWidth: 320, width: "100%" }} onClick={e => e.stopPropagation()}>
              <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 700, color: "var(--navy)", fontSize: 16, marginBottom: 4 }}>
                {localName}
              </div>
              <div style={{ color: "var(--gray-400)", fontSize: 13, marginBottom: 20 }}>{localStudentId}</div>
              <img src={qrDataUrl} alt="QR Code" style={{ width: 220, height: 220, display: "block", margin: "0 auto" }} />
              <p style={{ fontSize: 12, color: "var(--gray-400)", marginTop: 16 }}>Show this to library staff to time in</p>
              <button onClick={() => setShowQr(false)} style={{ marginTop: 16, width: "100%", padding: "10px", background: "var(--navy)", color: "white", fontWeight: 600, fontSize: 14, borderRadius: 8, cursor: "pointer" }}>Close</button>
            </div>
          </div>
        )}

        {/* Visit History */}
        <div className="profile-history">
          <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--gray-100)" }}>
            <h3 style={{ fontSize: 15, marginBottom: 1 }}>My Visit History</h3>
            <p style={{ color: "var(--gray-400)", fontSize: 12 }}>Your personal library visit records</p>
          </div>
          {myLogs.length === 0 ? (
            <div style={{ padding: "40px 20px", textAlign: "center" }}>
              <p style={{ fontWeight: 500, color: "var(--gray-600)" }}>No visits recorded yet</p>
              <p style={{ fontSize: 13, color: "var(--gray-400)", marginTop: 4 }}>Your visit history will appear here</p>
            </div>
          ) : (<>
            {/* Desktop table */}
            <div className="desktop-hist" style={{ overflowX: "auto" }}>
              <table className="history-table">
                <thead><tr>{["Date","Time In","Time Out","Duration","Purpose","Status"].map(h=><th key={h}>{h}</th>)}</tr></thead>
                <tbody>{myLogs.map((log, i) => (
                  <tr key={log.id} style={{ background: i % 2 === 0 ? "white" : "var(--gray-50)" }}>
                    <td style={{ whiteSpace: "nowrap" }}>{formatDate(log.timeIn)}</td>
                    <td>{formatTimestamp(log.timeIn)}</td>
                    <td>{log.timeOut ? formatTimestamp(log.timeOut) : <span style={{ color: "var(--gray-300)" }}>—</span>}</td>
                    <td style={{ fontWeight: 500 }}>{formatDuration(log.timeIn, log.timeOut)}</td>
                    <td style={{ color: "var(--gray-600)" }}>{log.purpose}</td>
                    <td><span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 20, background: log.status === "active" ? "var(--green-light)" : "var(--gray-100)", color: log.status === "active" ? "var(--green)" : "var(--gray-600)" }}>{log.status === "active" ? "Inside" : "Done"}</span></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
            {/* Mobile cards */}
            <div className="mobile-hist">
              {myLogs.map(log => (
                <div key={log.id} className="hist-card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                    <span style={{ fontWeight: 600, fontSize: 13, color: "var(--navy)" }}>{formatDate(log.timeIn)}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 20, background: log.status === "active" ? "var(--green-light)" : "var(--gray-100)", color: log.status === "active" ? "var(--green)" : "var(--gray-600)" }}>{log.status === "active" ? "Inside" : "Done"}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 12, color: "var(--gray-400)" }}>{log.purpose}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "var(--navy)" }}>{formatDuration(log.timeIn, log.timeOut)}</span>
                  </div>
                  <div style={{ fontSize: 11, color: "var(--gray-400)", marginTop: 2 }}>
                    In: {formatTimestamp(log.timeIn)}{log.timeOut ? ` · Out: ${formatTimestamp(log.timeOut)}` : ""}
                  </div>
                </div>
              ))}
            </div>
          </>)}
        </div>
      </div>
    </div>
  );
}

const InfoItem = ({ label, value, mono }) => (
  <div style={{ marginBottom: 12 }}>
    <div style={{ color: "var(--gray-400)", fontSize: 11, fontWeight: 600, marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
    <div style={{
      fontSize: 15, color: "var(--gray-800)", fontFamily: mono ? "monospace" : "inherit",
    }}>{value}</div>
  </div>
);

const StatMini = ({ label, value }) => (
  <div style={{
    textAlign: "center", padding: "10px 8px",
    background: "var(--gray-50)", borderRadius: 8,
  }}>
    <div style={{ fontFamily: "'Poppins', sans-serif", fontSize: 22, color: "var(--navy)", fontWeight: 700 }}>
      {value}
    </div>
    <div style={{ fontSize: 15, color: "var(--gray-400)", marginTop: 2, fontWeight: 500 }}>{label}</div>
  </div>
);