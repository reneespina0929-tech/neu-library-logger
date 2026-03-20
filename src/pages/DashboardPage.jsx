// src/pages/DashboardPage.jsx
import { useState, useEffect } from "react";
import { subscribeActiveVisitors, subscribeLogs, timeOut } from "../firebase/logs";
import { useAuth } from '../hooks/useAuth.jsx';
import { formatTimestamp, formatDuration, getTodayDateString } from "../utils/helpers";
import { DEPARTMENTS } from "../utils/departments";
import toast from "react-hot-toast";
import { format } from "date-fns";

const PURPOSES = ["Study / Review", "Research", "Borrowing / Returning Books", "Group Study", "Computer Use", "Thesis / Capstone Work", "Reading / Leisure", "Other"];
const DEPT_KEYS = Object.keys(DEPARTMENTS);

export default function DashboardPage() {
  const { user, userProfile } = useAuth();
  const [activeVisitors, setActiveVisitors] = useState([]);
  const [todayLogs, setTodayLogs] = useState([]);
  const [allLogs, setAllLogs] = useState([]);
  const [timingOut, setTimingOut] = useState(null);
  const [tick, setTick] = useState(0);
  const today = getTodayDateString();

  // Admin stats filters
  const [statsRange, setStatsRange] = useState("today");
  const [statsFrom, setStatsFrom] = useState(today);
  const [statsTo, setStatsTo] = useState(today);
  const [filterPurpose, setFilterPurpose] = useState("");
  const [filterCollege, setFilterCollege] = useState("");
  const [filterEmployee, setFilterEmployee] = useState("");

  const isAdmin = userProfile?.role === "admin";
  const canTimeOut = userProfile?.role === "admin" || userProfile?.role === "librarian";

  useEffect(() => {
    const unsub1 = subscribeActiveVisitors(setActiveVisitors);
    const unsub2 = subscribeLogs(setTodayLogs, today);
    const unsub3 = isAdmin ? subscribeLogs(setAllLogs, null) : () => {};
    return () => { unsub1(); unsub2(); unsub3(); };
  }, [today, isAdmin]);

  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 30000);
    return () => clearInterval(interval);
  }, []);

  // Compute date range for admin stats
  const getStatsDateRange = () => {
    const now = new Date();
    if (statsRange === "today") return { from: today, to: today };
    if (statsRange === "week") {
      const day = now.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      const mon = new Date(now); mon.setDate(now.getDate() + diff);
      return { from: mon.toISOString().split("T")[0], to: today };
    }
    if (statsRange === "month") {
      const first = new Date(now.getFullYear(), now.getMonth(), 1);
      return { from: first.toISOString().split("T")[0], to: today };
    }
    return { from: statsFrom, to: statsTo };
  };

  // Filter logs for admin stats
  const statsLogs = (() => {
    if (!isAdmin) return [];
    const { from, to } = getStatsDateRange();
    return allLogs.filter(log => {
      const matchDate = (!from || log.date >= from) && (!to || log.date <= to);
      const matchPurpose = !filterPurpose || log.purpose === filterPurpose;
      const matchCollege = !filterCollege || log.department === filterCollege;
      const matchEmployee = !filterEmployee || (() => {
        if (filterEmployee === "teacher") return log.visitorRole === "faculty";
        if (filterEmployee === "staff") return log.visitorRole === "librarian";
        return true;
      })();
      return matchDate && matchPurpose && matchCollege && matchEmployee;
    });
  })();

  const statsTotal = statsLogs.length;
  const statsActive = statsLogs.filter(l => l.status === "active").length;
  const statsCompleted = statsLogs.filter(l => l.status === "completed").length;
  const statsAvgDuration = (() => {
    const completed = statsLogs.filter(l => l.status === "completed" && l.timeIn && l.timeOut);
    if (!completed.length) return "—";
    const avg = completed.reduce((sum, l) => {
      const start = l.timeIn?.toDate ? l.timeIn.toDate() : new Date(l.timeIn);
      const end = l.timeOut?.toDate ? l.timeOut.toDate() : new Date(l.timeOut);
      return sum + (end - start);
    }, 0) / completed.length;
    const mins = Math.floor(avg / 60000);
    return mins < 60 ? `${mins}m` : `${Math.floor(mins/60)}h ${mins%60}m`;
  })();

  // Purpose breakdown
  const purposeBreakdown = PURPOSES.map(p => ({
    label: p, count: statsLogs.filter(l => l.purpose === p).length
  })).filter(p => p.count > 0).sort((a, b) => b.count - a.count);

  const handleTimeOut = async (logId, studentName) => {
    setTimingOut(logId);
    try {
      await timeOut(logId);
      toast.success(`${studentName} has been timed out`);
    } catch { toast.error("Failed to log time-out"); }
    finally { setTimingOut(null); }
  };

  const completedToday = todayLogs.filter(l => l.status === "completed").length;
  const greeting = () => {
    const h = new Date().getHours();
    return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
  };

  return (
    <div className="fade-in">
      <style>{`
        .dash-stats { display: grid; grid-template-columns: repeat(3,1fr); gap: 14px; margin-bottom: 22px; }
        .stat-card { background: white; border-radius: 16px; padding: 20px; box-shadow: var(--shadow-sm); border: 1px solid var(--gray-100); display: flex; align-items: center; gap: 14px; transition: box-shadow 0.2s, transform 0.2s; position: relative; overflow: hidden; }
        .stat-card:hover { box-shadow: var(--shadow-md); transform: translateY(-1px); }
        .stat-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; border-radius: 16px 16px 0 0; }
        .stat-card-green::before { background: linear-gradient(90deg, #1a9a5c, #22c55e); }
        .stat-card-navy::before { background: linear-gradient(90deg, #0d1f3c, #1a3a6e); }
        .stat-card-gold::before { background: linear-gradient(90deg, #c9972b, #e8b84b); }
        .stat-icon { width: 46px; height: 46px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .stat-val { font-size: 28px; font-weight: 700; color: var(--navy); line-height: 1; font-family: 'Poppins',sans-serif; }
        .stat-lbl { color: var(--gray-400); font-size: 11px; margin-top: 3px; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; }
        .section-card { background: white; border-radius: 16px; box-shadow: var(--shadow-sm); border: 1px solid var(--gray-100); margin-bottom: 18px; overflow: hidden; transition: box-shadow 0.2s; }
        .section-card:hover { box-shadow: var(--shadow-md); }
        .section-head { padding: 16px 20px; border-bottom: 1px solid var(--gray-100); display: flex; align-items: center; justify-content: space-between; background: linear-gradient(to bottom, white, #fafbfd); }
        .visit-table { width: 100%; border-collapse: collapse; }
        .visit-table th { padding: 10px 16px; text-align: left; font-size: 11px; font-weight: 700; color: var(--navy); text-transform: uppercase; letter-spacing: 0.07em; background: linear-gradient(to bottom, #f0f4fa, #edf1f8); border-bottom: 2px solid var(--gray-200); white-space: nowrap; }
        .visit-table td { padding: 12px 16px; font-size: 13px; border-bottom: 1px solid var(--gray-100); transition: background 0.12s; }
        .visit-table tr:last-child td { border-bottom: none; }
        .visit-table tbody tr:hover td { background: #f6f9ff; }
        .visitor-card { padding: 14px 16px; border-top: 1px solid var(--gray-100); display: flex; flex-direction: column; gap: 6px; }
        .visitor-card:first-child { border-top: none; }
        .visitor-row { display: flex; justify-content: space-between; align-items: center; }
        .admin-stats-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 12px; margin-bottom: 16px; }
        .admin-stat-card { background: white; border-radius: 12px; padding: 16px; border: 1px solid var(--gray-100); box-shadow: var(--shadow-sm); transition: box-shadow 0.2s; }
        .admin-stat-card:hover { box-shadow: var(--shadow-md); }
        .range-btn { padding: 5px 13px; border-radius: 20px; font-size: 12px; font-weight: 600; cursor: pointer; border: 1px solid var(--gray-200); background: white; color: var(--gray-600); font-family: 'Poppins',sans-serif; transition: all 0.15s; }
        .range-btn:hover { border-color: var(--navy); color: var(--navy); }
        .range-btn.active { background: var(--navy); color: white; border-color: var(--navy); box-shadow: 0 2px 8px rgba(13,31,60,0.2); }
        .filter-select { padding: 7px 10px; border: 1px solid var(--gray-200); border-radius: 8px; font-size: 13px; outline: none; cursor: pointer; font-family: 'Poppins',sans-serif; background: white; color: var(--gray-800); transition: border-color 0.15s; }
        .filter-select:focus { border-color: var(--navy); }
        .purpose-bar { display: flex; align-items: center; gap: 10px; margin-bottom: 9px; }
        .purpose-bar:last-child { margin-bottom: 0; }
        .purpose-bar-bg { flex: 1; height: 6px; background: var(--gray-100); border-radius: 3px; overflow: hidden; }
        .purpose-bar-fill { height: 100%; background: linear-gradient(90deg, #0d1f3c, #1a3a6e); border-radius: 3px; transition: width 0.5s ease; }
        @media (max-width: 768px) {
          .dash-stats { grid-template-columns: repeat(3,1fr); gap: 10px; }
          .stat-card { padding: 14px 12px; gap: 10px; flex-direction: column; align-items: flex-start; }
          .stat-icon { width: 38px; height: 38px; border-radius: 10px; }
          .stat-val { font-size: 22px; }
          .stat-lbl { font-size: 10px; }
          .desktop-table { display: none !important; }
          .mobile-cards { display: block !important; }
          .section-head { padding: 12px 14px; }
          .visit-table th, .visit-table td { padding: 8px 12px; }
          .admin-stats-grid { grid-template-columns: repeat(2,1fr); }
        }
        .mobile-cards { display: none; }
      `}</style>

      {/* Header */}
      <div className="page-header">
        <h1 style={{ fontSize: 22 }}>
          {greeting()}, {user?.displayName?.split(" ")[0] || "User"} 
        </h1>
        <p style={{ color: "var(--gray-400)", fontSize: 13, marginTop: 2 }}>
          {format(new Date(), "EEEE, MMMM d, yyyy")}
        </p>
      </div>

      {/* Basic Stats */}
      <div className="dash-stats">
        {[
          { label: "Inside", value: activeVisitors.length, color: "var(--green)", cls: "stat-card-green",
            icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
          { label: "Total Today", value: todayLogs.length, color: "var(--navy)", cls: "stat-card-navy",
            icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> },
          { label: "Completed", value: completedToday, color: "var(--gold)", cls: "stat-card-gold",
            icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg> },
        ].map(({ label, value, color, cls, icon }) => (
          <div key={label} className={`stat-card ${cls}`}>
            <div className="stat-icon" style={{ background: color + "15", color }}>{icon}</div>
            <div>
              <div className="stat-val">{value}</div>
              <div className="stat-lbl">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── ADMIN STATS SECTION ── */}
      {isAdmin && (
        <div className="section-card" style={{ marginBottom: 16 }}>
          <div className="section-head">
            <div>
              <h3 style={{ fontSize: 15, marginBottom: 1 }}>Visitor Statistics</h3>
              <p style={{ color: "var(--gray-400)", fontSize: 12 }}>Admin view — filter and analyze visit data</p>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
          </div>

          <div style={{ padding: "14px 16px" }}>
            {/* Range selector */}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--gray-400)", marginRight: 4 }}>Range:</span>
              {[["today","Today"],["week","This Week"],["month","This Month"]].map(([val, label]) => (
                <button key={val} className={`range-btn${statsRange === val ? " active" : ""}`} onClick={() => {
                  const now = new Date();
                  if (val === "today") {
                    setStatsFrom(today); setStatsTo(today);
                  } else if (val === "week") {
                    const day = now.getDay();
                    const diff = day === 0 ? -6 : 1 - day;
                    const mon = new Date(now); mon.setDate(now.getDate() + diff);
                    setStatsFrom(mon.toISOString().split("T")[0]); setStatsTo(today);
                  } else if (val === "month") {
                    const first = new Date(now.getFullYear(), now.getMonth(), 1);
                    setStatsFrom(first.toISOString().split("T")[0]); setStatsTo(today);
                  }
                  setStatsRange(val);
                }}>{label}</button>
              ))}
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: 4 }}>
                <input type="date" value={statsFrom} onChange={e => { setStatsFrom(e.target.value); setStatsRange("custom"); }} className="filter-select" style={{ padding: "5px 8px" }} />
                <span style={{ color: "var(--gray-400)", fontSize: 12 }}>to</span>
                <input type="date" value={statsTo} onChange={e => { setStatsTo(e.target.value); setStatsRange("custom"); }} className="filter-select" style={{ padding: "5px 8px" }} />
              </div>
            </div>

            {/* Filters */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
              <select value={filterPurpose} onChange={e => setFilterPurpose(e.target.value)} className="filter-select">
                <option value="">All Purposes</option>
                {PURPOSES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <select value={filterCollege} onChange={e => setFilterCollege(e.target.value)} className="filter-select">
                <option value="">All Colleges</option>
                {DEPT_KEYS.map(k => <option key={k} value={k}>{k}</option>)}
              </select>
              <select value={filterEmployee} onChange={e => setFilterEmployee(e.target.value)} className="filter-select">
                <option value="">All Visitors</option>
                <option value="teacher">Teachers / Faculty</option>
                <option value="staff">Staff</option>
              </select>
              {(filterPurpose || filterCollege || filterEmployee) && (
                <button onClick={() => { setFilterPurpose(""); setFilterCollege(""); setFilterEmployee(""); }}
                  style={{ padding: "7px 12px", borderRadius: 8, border: "1px solid var(--gray-200)", background: "var(--gray-50)", color: "var(--gray-600)", fontSize: 12, cursor: "pointer", fontFamily: "'Poppins',sans-serif" }}>
                  Clear filters
                </button>
              )}
            </div>

            {/* Stat cards */}
            <div className="admin-stats-grid">
              {[
                { label: "Total Visits", value: statsTotal, color: "var(--navy)", bg: "rgba(13,31,60,0.08)",
                  icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg> },
                { label: "Currently Inside", value: statsActive, color: "var(--green)", bg: "rgba(26,154,92,0.1)",
                  icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
                { label: "Completed", value: statsCompleted, color: "var(--gold)", bg: "rgba(201,151,43,0.1)",
                  icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg> },
                { label: "Avg Duration", value: statsAvgDuration, color: "#7c3aed", bg: "rgba(124,58,237,0.08)",
                  icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> },
              ].map(({ label, value, color, bg, icon }) => (
                <div key={label} className="admin-stat-card">
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: bg, color, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>{icon}</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color, fontFamily: "'Poppins',sans-serif", lineHeight: 1 }}>{value}</div>
                  <div style={{ fontSize: 12, color: "var(--gray-400)", marginTop: 4 }}>{label}</div>
                </div>
              ))}
            </div>

            {/* Purpose breakdown */}
            {purposeBreakdown.length > 0 && (
              <div style={{ marginTop: 16, borderTop: "1px solid var(--gray-100)", paddingTop: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--gray-400)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>
                  Visit Reasons
                </div>
                {purposeBreakdown.map(({ label, count }) => (
                  <div key={label} className="purpose-bar">
                    <span style={{ fontSize: 12, color: "var(--gray-700)", minWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
                    <div className="purpose-bar-bg">
                      <div className="purpose-bar-fill" style={{ width: `${(count / purposeBreakdown[0].count) * 100}%` }} />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "var(--navy)", minWidth: 30, textAlign: "right" }}>{count}</span>
                  </div>
                ))}
              </div>
            )}

            {statsTotal === 0 && (
              <div style={{ textAlign: "center", padding: "20px 0", color: "var(--gray-400)", fontSize: 13 }}>
                No visit data for the selected range and filters
              </div>
            )}
          </div>
        </div>
      )}

      {/* Currently Inside */}
      <div className="section-card">
        <div className="section-head">
          <div>
            <h3 style={{ fontSize: 15, marginBottom: 1 }}>Currently Inside</h3>
            <p style={{ color: "var(--gray-400)", fontSize: 12 }}>Active library visitors</p>
          </div>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--green)", animation: "pulse 1.5s infinite", display: "inline-block" }} />
        </div>

        {activeVisitors.length === 0 ? (
          <div style={{ padding: "32px 16px", textAlign: "center", color: "var(--gray-400)" }}>
            <p style={{ fontWeight: 500, color: "var(--gray-600)" }}>No active visitors right now</p>
            <p style={{ fontSize: 12, marginTop: 4 }}>Visitors will appear here when they time in</p>
          </div>
        ) : (<>
          <div className="desktop-table" style={{ overflowX: "auto" }}>
            <table className="visit-table">
              <thead><tr>{["Student Name","Student ID","Purpose","Time In","Duration",canTimeOut?"Action":""].map(h => h && <th key={h}>{h}</th>)}</tr></thead>
              <tbody>{activeVisitors.map((log) => (
                <tr key={log.id}>
                  <td style={{ fontWeight: 500, color: "var(--navy)" }}>{log.studentName}</td>
                  <td style={{ color: "var(--gray-600)" }}>{log.studentId}</td>
                  <td><span style={{ background: "var(--navy)", color: "white", padding: "2px 8px", borderRadius: 20, fontSize: 12 }}>{log.purpose}</span></td>
                  <td style={{ color: "var(--gray-600)" }}>{formatTimestamp(log.timeIn)}</td>
                  <td style={{ color: "var(--green)", fontWeight: 600 }}>{formatDuration(log.timeIn, null, tick)}</td>
                  {canTimeOut && <td><button onClick={() => handleTimeOut(log.id, log.studentName)} disabled={timingOut === log.id} style={{ padding: "5px 12px", background: "rgba(217,57,43,0.1)", color: "var(--red)", fontWeight: 600, fontSize: 13, borderRadius: 6, cursor: "pointer", opacity: timingOut === log.id ? 0.6 : 1, border: "none" }}>{timingOut === log.id ? "..." : "Time Out"}</button></td>}
                </tr>
              ))}</tbody>
            </table>
          </div>
          <div className="mobile-cards">
            {activeVisitors.map((log) => (
              <div key={log.id} className="visitor-card">
                <div className="visitor-row">
                  <span style={{ fontWeight: 600, fontSize: 14, color: "var(--navy)" }}>{log.studentName}</span>
                  <span style={{ background: "rgba(26,154,92,0.12)", color: "var(--green)", fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 20 }}>Inside · {formatDuration(log.timeIn, null, tick)}</span>
                </div>
                <div className="visitor-row">
                  <span style={{ fontSize: 12, color: "var(--gray-400)" }}>ID: {log.studentId}</span>
                  <span style={{ fontSize: 12, color: "var(--gray-600)" }}>{log.purpose}</span>
                </div>
                <div className="visitor-row">
                  <span style={{ fontSize: 12, color: "var(--gray-400)" }}>In: {formatTimestamp(log.timeIn)}</span>
                  {canTimeOut && <button onClick={() => handleTimeOut(log.id, log.studentName)} disabled={timingOut === log.id} style={{ padding: "6px 16px", background: "rgba(217,57,43,0.1)", color: "var(--red)", fontWeight: 600, fontSize: 13, borderRadius: 6, cursor: "pointer", border: "none" }}>{timingOut === log.id ? "..." : "Time Out"}</button>}
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
                  <td><span style={{ fontSize: 12, fontWeight: 600, padding: "2px 8px", borderRadius: 20, background: log.status === "active" ? "rgba(26,154,92,0.12)" : "var(--gray-100)", color: log.status === "active" ? "var(--green)" : "var(--gray-600)" }}>{log.status === "active" ? "Inside" : "Completed"}</span></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          <div className="mobile-cards">
            {todayLogs.slice(0,20).map((log) => (
              <div key={log.id} className="visitor-card">
                <div className="visitor-row">
                  <span style={{ fontWeight: 600, fontSize: 14, color: "var(--navy)" }}>{log.studentName}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 20, background: log.status === "active" ? "rgba(26,154,92,0.12)" : "var(--gray-100)", color: log.status === "active" ? "var(--green)" : "var(--gray-600)" }}>{log.status === "active" ? "Inside" : "Completed"}</span>
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