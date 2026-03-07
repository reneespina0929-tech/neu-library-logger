// src/pages/DashboardPage.jsx
import { useState, useEffect } from "react";
import { subscribeActiveVisitors, subscribeLogs, timeOut } from "../firebase/logs";
import { useAuth } from '../hooks/useAuth.jsx';
import { formatTimestamp, formatDuration, getTodayDateString } from "../utils/helpers";
import toast from "react-hot-toast";
import { format } from "date-fns";

const StatCard = ({ label, value, color, icon }) => (
  <div style={{
    background: "white", borderRadius: "var(--radius-lg)", padding: "20px 24px",
    boxShadow: "var(--shadow-sm)", border: "1px solid var(--gray-100)",
    display: "flex", alignItems: "center", gap: 16, flex: 1, minWidth: 0,
  }}>
    <div style={{
      width: 48, height: 48, borderRadius: 12, background: color + "18",
      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      color,
    }}>{icon}</div>
    <div>
      <div style={{ fontSize: 26, fontWeight: 700, color: "var(--navy)", lineHeight: 1, fontFamily: "'Poppins', sans-serif" }}>
        {value}
      </div>
      <div style={{ color: "var(--gray-400)", fontSize: 16, marginTop: 3, fontWeight: 500 }}>{label}</div>
    </div>
  </div>
);

const ActiveBadge = () => (
  <span style={{
    display: "inline-flex", alignItems: "center", gap: 5,
    background: "var(--green-light)", color: "var(--green)",
    fontSize: 15, fontWeight: 600, padding: "3px 8px", borderRadius: 20,
  }}>
    <span style={{
      width: 6, height: 6, borderRadius: "50%", background: "var(--green)",
      animation: "pulse 1.5s infinite",
    }} />
    Inside
  </span>
);

export default function DashboardPage() {
  const { user, userProfile } = useAuth();
  const [activeVisitors, setActiveVisitors] = useState([]);
  const [todayLogs, setTodayLogs] = useState([]);
  const [timingOut, setTimingOut] = useState(null);

  const today = getTodayDateString();

  useEffect(() => {
    const unsub1 = subscribeActiveVisitors(setActiveVisitors);
    const unsub2 = subscribeLogs(setTodayLogs, today);
    return () => { unsub1(); unsub2(); };
  }, [today]);

  const handleTimeOut = async (logId, studentName) => {
    setTimingOut(logId);
    try {
      await timeOut(logId);
      toast.success(`${studentName} has been timed out`);
    } catch {
      toast.error("Failed to log time-out");
    } finally {
      setTimingOut(null);
    }
  };

  const completedToday = todayLogs.filter(l => l.status === "completed").length;
  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  };

  const canTimeOut = userProfile?.role === "admin" || userProfile?.role === "librarian";

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, marginBottom: 4 }}>
          {greeting()}, {user?.displayName?.split(" ")[0] || "User"}
        </h1>
        <p style={{ color: "var(--gray-400)", fontSize: 14 }}>
          {format(new Date(), "EEEE, MMMM d, yyyy")} · Library Visit Dashboard
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: "flex", gap: 16, marginBottom: 28, flexWrap: "wrap" }}>
        <StatCard
          label="Currently Inside"
          value={activeVisitors.length}
          color="var(--green)"
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>}
        />
        <StatCard
          label="Total Visits Today"
          value={todayLogs.length}
          color="var(--navy)"
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>}
        />
        <StatCard
          label="Completed Visits"
          value={completedToday}
          color="var(--gold)"
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>}
        />
      </div>

      {/* Active Visitors */}
      <div style={{
        background: "white", borderRadius: "var(--radius-lg)",
        boxShadow: "var(--shadow-sm)", border: "1px solid var(--gray-100)",
        marginBottom: 24, overflow: "hidden",
      }}>
        <div style={{
          padding: "18px 24px", borderBottom: "1px solid var(--gray-100)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div>
            <h3 style={{ fontSize: 16, marginBottom: 2 }}>Currently Inside</h3>
            <p style={{ color: "var(--gray-400)", fontSize: 12 }}>Students / visitors currently in the library</p>
          </div>
          <ActiveBadge />
        </div>

        {activeVisitors.length === 0 ? (
          <div style={{ padding: "40px 24px", textAlign: "center", color: "var(--gray-400)" }}>
            <p style={{ fontWeight: 500, color: "var(--gray-600)" }}>No active visitors right now</p>
            <p style={{ fontSize: 15, marginTop: 4 }}>Visitors will appear here when they time in</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "var(--gray-50)" }}>
                  {["Student Name", "Student ID", "Purpose", "Time In", "Duration", canTimeOut ? "Action" : ""].map(h => (
                    h && <th key={h} style={{
                      padding: "10px 20px", textAlign: "left", fontSize: 15,
                      fontWeight: 600, color: "var(--gray-400)", textTransform: "uppercase",
                      letterSpacing: "0.06em",
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {activeVisitors.map((log, i) => (
                  <tr key={log.id} style={{
                    borderTop: "1px solid var(--gray-100)",
                    background: i % 2 === 0 ? "white" : "var(--gray-50)",
                  }}>
                    <td style={{ padding: "14px 20px" }}>
                      <div style={{ fontWeight: 500, fontSize: 16, color: "var(--navy)" }}>
                        {log.studentName}
                      </div>
                    </td>
                    <td style={{ padding: "14px 20px", fontSize: 15, color: "var(--gray-600)" }}>
                      {log.studentId}
                    </td>
                    <td style={{ padding: "14px 20px" }}>
                      <span style={{
                        background: "var(--navy)", color: "white", fontSize: 15,
                        padding: "3px 9px", borderRadius: 20, fontWeight: 500,
                      }}>{log.purpose}</span>
                    </td>
                    <td style={{ padding: "14px 20px", fontSize: 15, color: "var(--gray-600)" }}>
                      {formatTimestamp(log.timeIn)}
                    </td>
                    <td style={{ padding: "14px 20px", fontSize: 15, color: "var(--green)", fontWeight: 600 }}>
                      {formatDuration(log.timeIn, null)}
                    </td>
                    {canTimeOut && (
                      <td style={{ padding: "14px 20px" }}>
                        <button
                          onClick={() => handleTimeOut(log.id, log.studentName)}
                          disabled={timingOut === log.id}
                          style={{
                            padding: "6px 14px", background: "var(--red-light)",
                            color: "var(--red)", fontWeight: 600, fontSize: 16,
                            borderRadius: 6, transition: "all 0.15s",
                            cursor: timingOut === log.id ? "not-allowed" : "pointer",
                            opacity: timingOut === log.id ? 0.6 : 1,
                          }}
                        >
                          {timingOut === log.id ? "..." : "Time Out"}
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent logs */}
      <div style={{
        background: "white", borderRadius: "var(--radius-lg)",
        boxShadow: "var(--shadow-sm)", border: "1px solid var(--gray-100)",
        overflow: "hidden",
      }}>
        <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--gray-100)" }}>
          <h3 style={{ fontSize: 16, marginBottom: 2 }}>Today's Visit Log</h3>
          <p style={{ color: "var(--gray-400)", fontSize: 12 }}>All visits recorded today</p>
        </div>
        {todayLogs.length === 0 ? (
          <div style={{ padding: "32px 24px", textAlign: "center", color: "var(--gray-400)" }}>
            <p>No visits recorded today yet</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "var(--gray-50)" }}>
                  {["Student", "ID", "Purpose", "Time In", "Time Out", "Duration", "Status"].map(h => (
                    <th key={h} style={{
                      padding: "10px 20px", textAlign: "left", fontSize: 15,
                      fontWeight: 600, color: "var(--gray-400)", textTransform: "uppercase", letterSpacing: "0.06em",
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {todayLogs.slice(0, 20).map((log, i) => (
                  <tr key={log.id} style={{
                    borderTop: "1px solid var(--gray-100)",
                    background: i % 2 === 0 ? "white" : "var(--gray-50)",
                  }}>
                    <td style={{ padding: "12px 20px", fontWeight: 500, fontSize: 14 }}>{log.studentName}</td>
                    <td style={{ padding: "12px 20px", fontSize: 15, color: "var(--gray-600)" }}>{log.studentId}</td>
                    <td style={{ padding: "12px 20px", fontSize: 16, color: "var(--gray-600)" }}>{log.purpose}</td>
                    <td style={{ padding: "12px 20px", fontSize: 13 }}>{formatTimestamp(log.timeIn)}</td>
                    <td style={{ padding: "12px 20px", fontSize: 13 }}>{log.timeOut ? formatTimestamp(log.timeOut) : "—"}</td>
                    <td style={{ padding: "12px 20px", fontSize: 15, fontWeight: 500, color: "var(--navy)" }}>
                      {formatDuration(log.timeIn, log.timeOut)}
                    </td>
                    <td style={{ padding: "12px 20px" }}>
                      <span style={{
                        fontSize: 15, fontWeight: 600, padding: "3px 9px", borderRadius: 20,
                        background: log.status === "active" ? "var(--green-light)" : "var(--gray-100)",
                        color: log.status === "active" ? "var(--green)" : "var(--gray-600)",
                      }}>
                        {log.status === "active" ? "Inside" : "Completed"}
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
  );
}