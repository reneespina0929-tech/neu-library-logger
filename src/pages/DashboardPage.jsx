// src/pages/DashboardPage.jsx
import { useState, useEffect } from "react";
import { subscribeActiveVisitors, subscribeLogs, timeOut } from "../firebase/logs";
import { useAuth } from '../hooks/useAuth.jsx';
import { formatTimestamp, formatDuration, getTodayDateString } from "../utils/helpers";
import toast from "react-hot-toast";
import { format } from "date-fns";

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
    } catch { toast.error("Failed to log time-out"); }
    finally { setTimingOut(null); }
  };

  const completedToday = todayLogs.filter(l => l.status === "completed").length;
  const canTimeOut = userProfile?.role === "admin" || userProfile?.role === "librarian";
  const greeting = () => {
    const h = new Date().getHours();
    return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
  };

  return (
    <div className="fade-in">
      <style>{`
        .dash-stats { display: grid; grid-template-columns: repeat(3,1fr); gap: 12px; margin-bottom: 20px; }
        .stat-card { background: white; border-radius: 12px; padding: 16px; box-shadow: var(--shadow-sm); border: 1px solid var(--gray-100); display: flex; align-items: center; gap: 12; }
        .stat-icon { width: 44px; height: 44px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .stat-val { font-size: 24px; font-weight: 700; color: var(--navy); line-height: 1; font-family: 'Poppins',sans-serif; }
        .stat-lbl { color: var(--gray-400); font-size: 12px; margin-top: 2px; font-weight: 500; }
        .section-card { background: white; border-radius: 12px; box-shadow: var(--shadow-sm); border: 1px solid var(--gray-100); margin-bottom: 16px; overflow: hidden; }
        .section-head { padding: 14px 16px; border-bottom: 1px solid var(--gray-100); display: flex; align-items: center; justify-content: space-between; }
        .visit-table { width: 100%; border-collapse: collapse; }
        .visit-table th { padding: 8px 16px; text-align: left; font-size: 11px; font-weight: 600; color: var(--gray-400); text-transform: uppercase; letter-spacing: .06em; background: var(--gray-50); }
        .visit-table td { padding: 12px 16px; font-size: 13px; border-top: 1px solid var(--gray-100); }
        .visitor-card { padding: 14px 16px; border-top: 1px solid var(--gray-100); display: flex; flex-direction: column; gap: 6px; }
        .visitor-card:first-child { border-top: none; }
        .visitor-row { display: flex; justify-content: space-between; align-items: center; }
        .badge { font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 20px; }
        @media (max-width: 768px) {
          .dash-stats { grid-template-columns: repeat(3,1fr); gap: 8px; }
          .stat-card { padding: 12px 10px; gap: 8px; flex-direction: column; align-items: flex-start; }
          .stat-icon { width: 36px; height: 36px; border-radius: 8px; }
          .stat-val { font-size: 20px; }
          .stat-lbl { font-size: 11px; }
          .desktop-table { display: none !important; }
          .mobile-cards { display: block !important; }
          .section-head { padding: 12px 14px; }
          .visit-table th, .visit-table td { padding: 8px 12px; }
        }
        .mobile-cards { display: none; }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, marginBottom: 2 }}>
          {greeting()}, {user?.displayName?.split(" ")[0] || "User"}
        </h1>
        <p style={{ color: "var(--gray-400)", fontSize: 13 }}>
          {format(new Date(), "EEEE, MMMM d, yyyy")}
        </p>
      </div>

      {/* Stats */}
      <div className="dash-stats">
        {[
          { label: "Inside", value: activeVisitors.length, color: "var(--green)",
            icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
          { label: "Total Today", value: todayLogs.length, color: "var(--navy)",
            icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> },
          { label: "Completed", value: completedToday, color: "var(--gold)",
            icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg> },
        ].map(({ label, value, color, icon }) => (
          <div key={label} className="stat-card">
            <div className="stat-icon" style={{ background: color + "18", color }}>{icon}</div>
            <div>
              <div className="stat-val">{value}</div>
              <div className="stat-lbl">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Currently Inside */}
      <div className="section-card">
        <div className="section-head">
          <div>
            <h3 style={{ fontSize: 15, marginBottom: 1 }}>Currently Inside</h3>
            <p style={{ color: "var(--gray-400)", fontSize: 12 }}>Active library visitors</p>
          </div>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "var(--green-light)", color: "var(--green)", fontSize: 12, fontWeight: 600, padding: "3px 8px", borderRadius: 20 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--green)", animation: "pulse 1.5s infinite" }} /> Live
          </span>
        </div>

        {activeVisitors.length === 0 ? (
          <div style={{ padding: "32px 16px", textAlign: "center", color: "var(--gray-400)" }}>
            <p style={{ fontWeight: 500, color: "var(--gray-600)" }}>No active visitors right now</p>
            <p style={{ fontSize: 12, marginTop: 4 }}>Visitors will appear here when they time in</p>
          </div>
        ) : (<>
          {/* Desktop table */}
          <div className="desktop-table" style={{ overflowX: "auto" }}>
            <table className="visit-table">
              <thead><tr>{["Student Name","Student ID","Purpose","Time In","Duration",canTimeOut?"Action":""].map(h => h && <th key={h}>{h}</th>)}</tr></thead>
              <tbody>{activeVisitors.map((log) => (
                <tr key={log.id}>
                  <td style={{ fontWeight: 500, color: "var(--navy)" }}>{log.studentName}</td>
                  <td style={{ color: "var(--gray-600)" }}>{log.studentId}</td>
                  <td><span style={{ background: "var(--navy)", color: "white", padding: "2px 8px", borderRadius: 20, fontSize: 12 }}>{log.purpose}</span></td>
                  <td style={{ color: "var(--gray-600)" }}>{formatTimestamp(log.timeIn)}</td>
                  <td style={{ color: "var(--green)", fontWeight: 600 }}>{formatDuration(log.timeIn, null)}</td>
                  {canTimeOut && <td><button onClick={() => handleTimeOut(log.id, log.studentName)} disabled={timingOut === log.id} style={{ padding: "5px 12px", background: "var(--red-light)", color: "var(--red)", fontWeight: 600, fontSize: 13, borderRadius: 6, cursor: "pointer", opacity: timingOut === log.id ? 0.6 : 1 }}>{timingOut === log.id ? "..." : "Time Out"}</button></td>}
                </tr>
              ))}</tbody>
            </table>
          </div>
          {/* Mobile cards */}
          <div className="mobile-cards">
            {activeVisitors.map((log) => (
              <div key={log.id} className="visitor-card">
                <div className="visitor-row">
                  <span style={{ fontWeight: 600, fontSize: 14, color: "var(--navy)" }}>{log.studentName}</span>
                  <span style={{ background: "var(--green-light)", color: "var(--green)", fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 20 }}>Inside · {formatDuration(log.timeIn, null)}</span>
                </div>
                <div className="visitor-row">
                  <span style={{ fontSize: 12, color: "var(--gray-400)" }}>ID: {log.studentId}</span>
                  <span style={{ fontSize: 12, color: "var(--gray-600)" }}>{log.purpose}</span>
                </div>
                <div className="visitor-row">
                  <span style={{ fontSize: 12, color: "var(--gray-400)" }}>In: {formatTimestamp(log.timeIn)}</span>
                  {canTimeOut && <button onClick={() => handleTimeOut(log.id, log.studentName)} disabled={timingOut === log.id} style={{ padding: "6px 16px", background: "var(--red-light)", color: "var(--red)", fontWeight: 600, fontSize: 13, borderRadius: 6, cursor: "pointer" }}>{timingOut === log.id ? "..." : "Time Out"}</button>}
                </div>
              </div>
            ))}
          </div>
        </>)}
      </div>

      {/* Today's Log */}
      <div className="section-card">
        <div className="section-head">
          <div>
            <h3 style={{ fontSize: 15, marginBottom: 1 }}>Today's Visit Log</h3>
            <p style={{ color: "var(--gray-400)", fontSize: 12 }}>All visits recorded today</p>
          </div>
        </div>
        {todayLogs.length === 0 ? (
          <div style={{ padding: "24px 16px", textAlign: "center", color: "var(--gray-400)", fontSize: 13 }}>No visits recorded today yet</div>
        ) : (<>
          {/* Desktop table */}
          <div className="desktop-table" style={{ overflowX: "auto" }}>
            <table className="visit-table">
              <thead><tr>{["Student","ID","Purpose","Time In","Time Out","Duration","Status"].map(h=><th key={h}>{h}</th>)}</tr></thead>
              <tbody>{todayLogs.slice(0,20).map((log) => (
                <tr key={log.id}>
                  <td style={{ fontWeight: 500 }}>{log.studentName}</td>
                  <td style={{ color: "var(--gray-600)" }}>{log.studentId}</td>
                  <td style={{ color: "var(--gray-600)" }}>{log.purpose}</td>
                  <td>{formatTimestamp(log.timeIn)}</td>
                  <td>{log.timeOut ? formatTimestamp(log.timeOut) : "—"}</td>
                  <td style={{ fontWeight: 500, color: "var(--navy)" }}>{formatDuration(log.timeIn, log.timeOut)}</td>
                  <td><span style={{ fontSize: 12, fontWeight: 600, padding: "2px 8px", borderRadius: 20, background: log.status === "active" ? "var(--green-light)" : "var(--gray-100)", color: log.status === "active" ? "var(--green)" : "var(--gray-600)" }}>{log.status === "active" ? "Inside" : "Completed"}</span></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          {/* Mobile cards */}
          <div className="mobile-cards">
            {todayLogs.slice(0,20).map((log) => (
              <div key={log.id} className="visitor-card">
                <div className="visitor-row">
                  <span style={{ fontWeight: 600, fontSize: 14, color: "var(--navy)" }}>{log.studentName}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 20, background: log.status === "active" ? "var(--green-light)" : "var(--gray-100)", color: log.status === "active" ? "var(--green)" : "var(--gray-600)" }}>{log.status === "active" ? "Inside" : "Completed"}</span>
                </div>
                <div className="visitor-row">
                  <span style={{ fontSize: 12, color: "var(--gray-400)" }}>{log.studentId} · {log.purpose}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "var(--navy)" }}>{formatDuration(log.timeIn, log.timeOut)}</span>
                </div>
                <div style={{ fontSize: 11, color: "var(--gray-400)" }}>
                  In: {formatTimestamp(log.timeIn)}{log.timeOut ? ` · Out: ${formatTimestamp(log.timeOut)}` : ""}
                </div>
              </div>
            ))}
          </div>
        </>)}
      </div>
    </div>
  );
}