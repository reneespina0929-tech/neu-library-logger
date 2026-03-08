// src/pages/ProfilePage.jsx
import { useState, useEffect } from "react";
import { useAuth } from '../hooks/useAuth.jsx';
import { subscribeLogs } from "../firebase/logs";
import { formatTimestamp, formatDate, formatDuration } from "../utils/helpers";
import { updateProfile } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { auth, db } from "../firebase/config";
import toast from "react-hot-toast";

export default function ProfilePage() {
  const { user, userProfile } = useAuth();
  const [myLogs, setMyLogs] = useState([]);
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [studentId, setStudentId] = useState(userProfile?.studentId || "");
  const [saving, setSaving] = useState(false);

  const initials = (user?.displayName || user?.email || "U")
    .split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  useEffect(() => {
    if (userProfile?.studentId) setStudentId(userProfile.studentId);
  }, [userProfile]);

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
      toast.success("Profile updated!");
      setEditing(false);
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
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
              <h2 style={{ color: "white", fontFamily: "'Poppins', sans-serif", fontSize: 17 }}>{user?.displayName || "User"}</h2>
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
                <div style={{ fontSize: 14, color: "var(--gray-800)", fontWeight: userProfile?.studentId ? 500 : 400 }}>
                  {userProfile?.studentId || <span style={{ color: "var(--gray-400)", fontStyle: "italic" }}>Not set — click Edit to add</span>}
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
        </div>

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