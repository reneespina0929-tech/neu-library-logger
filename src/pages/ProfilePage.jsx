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
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, marginBottom: 4 }}>My Profile</h1>
        <p style={{ color: "var(--gray-400)", fontSize: 14 }}>Your account information and visit history</p>
      </div>

      <div style={{ display: "flex", gap: 24, flexWrap: "wrap", alignItems: "flex-start" }}>
        {/* Profile card */}
        <div style={{
          flex: "0 0 300px", background: "white", borderRadius: "var(--radius-lg)",
          boxShadow: "var(--shadow-sm)", border: "1px solid var(--gray-100)", overflow: "hidden",
        }}>
          <div style={{
            background: "var(--navy)", padding: "32px 24px", textAlign: "center",
          }}>
            <div style={{
              width: 72, height: 72, borderRadius: "50%", background: "var(--gold)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 12px",
              color: "var(--navy)", fontWeight: 800, fontSize: 26,
              fontFamily: "'Poppins', sans-serif",
            }}>{initials}</div>
            {editing ? (
              <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                <input
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  style={{
                    background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)",
                    color: "white", padding: "6px 10px", borderRadius: 6, fontSize: 16,
                    outline: "none", textAlign: "center",
                  }}
                />
              </div>
            ) : (
              <h2 style={{ color: "white", fontFamily: "'Poppins', sans-serif", fontSize: 18 }}>
                {user?.displayName || "User"}
              </h2>
            )}
            <span style={{
              display: "inline-block", marginTop: 6,
              background: "rgba(201,151,43,0.2)", color: "var(--gold-light)",
              fontSize: 15, fontWeight: 600, padding: "3px 10px", borderRadius: 20,
              textTransform: "capitalize",
            }}>
              {userProfile?.role || "student"}
            </span>
          </div>

          <div style={{ padding: "20px 24px" }}>
            <InfoItem label="Email" value={user?.email || "—"} />
            <div style={{ marginBottom: 13 }}>
              <div style={{ color: "var(--gray-400)", fontSize: 11, fontWeight: 600, marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Student ID
              </div>
              {editing ? (
                <input
                  value={studentId}
                  onChange={e => setStudentId(e.target.value)}
                  placeholder="e.g. 24-12345-678"
                  style={{
                    width: "100%", padding: "7px 10px",
                    border: "1px solid var(--gray-200)", borderRadius: 6,
                    fontSize: 14, outline: "none", fontFamily: "'Poppins', sans-serif",
                  }}
                  onFocus={e => e.target.style.borderColor = "var(--navy)"}
                  onBlur={e => e.target.style.borderColor = "var(--gray-200)"}
                />
              ) : (
                <div style={{ fontSize: 15, color: "var(--gray-800)", fontWeight: userProfile?.studentId ? 500 : 400 }}>
                  {userProfile?.studentId || <span style={{ color: "var(--gray-400)", fontStyle: "italic" }}>Not set — click Edit to add</span>}
                </div>
              )}
            </div>
            <InfoItem label="Member since" value={
              user?.metadata?.creationTime
                ? new Date(user.metadata.creationTime).toLocaleDateString("en-PH", { month: "long", year: "numeric" })
                : "—"
            } />

            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              {editing ? (
                <>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    style={{
                      flex: 1, padding: "8px", background: "var(--navy)", color: "white",
                      fontWeight: 600, fontSize: 15, borderRadius: 8, cursor: "pointer",
                    }}
                  >
                    {saving ? "Saving..." : "Save"}
                  </button>
                  <button
                    onClick={() => { setEditing(false); setDisplayName(user?.displayName || ""); }}
                    style={{
                      flex: 1, padding: "8px", background: "var(--gray-100)", color: "var(--gray-600)",
                      fontWeight: 600, fontSize: 15, borderRadius: 8, cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setEditing(true)}
                  style={{
                    width: "100%", padding: "8px", background: "var(--gray-100)", color: "var(--gray-800)",
                    fontWeight: 600, fontSize: 15, borderRadius: 8, cursor: "pointer",
                  }}
                >
                  Edit Display Name
                </button>
              )}
            </div>
          </div>

          {/* Stats */}
          <div style={{
            borderTop: "1px solid var(--gray-100)", padding: "16px 24px",
            display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12,
          }}>
            <StatMini label="Total Visits" value={totalVisits} />
            <StatMini label="Completed" value={completedVisits} />
          </div>
        </div>

        {/* My visit history */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            background: "white", borderRadius: "var(--radius-lg)",
            boxShadow: "var(--shadow-sm)", border: "1px solid var(--gray-100)",
            overflow: "hidden",
          }}>
            <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--gray-100)" }}>
              <h3 style={{ fontSize: 16, marginBottom: 2 }}>My Visit History</h3>
              <p style={{ color: "var(--gray-400)", fontSize: 12 }}>Your personal library visit records</p>
            </div>
            {myLogs.length === 0 ? (
              <div style={{ padding: "40px 24px", textAlign: "center" }}>
                <p style={{ fontWeight: 500, color: "var(--gray-600)" }}>No visits recorded yet</p>
                <p style={{ fontSize: 15, color: "var(--gray-400)", marginTop: 4 }}>
                  Your visit history will appear here
                </p>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "var(--gray-50)" }}>
                      {["Date", "Time In", "Time Out", "Duration", "Purpose", "Status"].map(h => (
                        <th key={h} style={{
                          padding: "10px 16px", textAlign: "left", fontSize: 15,
                          fontWeight: 600, color: "var(--gray-400)", textTransform: "uppercase",
                          letterSpacing: "0.06em", whiteSpace: "nowrap",
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {myLogs.map((log, i) => (
                      <tr key={log.id} style={{
                        borderTop: "1px solid var(--gray-100)",
                        background: i % 2 === 0 ? "white" : "var(--gray-50)",
                      }}>
                        <td style={{ padding: "11px 16px", fontSize: 15, whiteSpace: "nowrap" }}>
                          {formatDate(log.timeIn)}
                        </td>
                        <td style={{ padding: "11px 16px", fontSize: 13 }}>{formatTimestamp(log.timeIn)}</td>
                        <td style={{ padding: "11px 16px", fontSize: 13 }}>
                          {log.timeOut ? formatTimestamp(log.timeOut) : <span style={{ color: "var(--gray-300)" }}>—</span>}
                        </td>
                        <td style={{ padding: "11px 16px", fontSize: 15, fontWeight: 500 }}>
                          {formatDuration(log.timeIn, log.timeOut)}
                        </td>
                        <td style={{ padding: "11px 16px", fontSize: 16, color: "var(--gray-600)" }}>{log.purpose}</td>
                        <td style={{ padding: "11px 16px" }}>
                          <span style={{
                            fontSize: 15, fontWeight: 600, padding: "2px 8px", borderRadius: 20,
                            background: log.status === "active" ? "var(--green-light)" : "var(--gray-100)",
                            color: log.status === "active" ? "var(--green)" : "var(--gray-600)",
                          }}>
                            {log.status === "active" ? "Inside" : "Done"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
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