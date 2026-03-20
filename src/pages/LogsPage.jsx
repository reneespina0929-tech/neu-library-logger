// src/pages/LogsPage.jsx
import { useState, useEffect } from "react";
import { subscribeLogs, timeOut } from "../firebase/logs";
import { useAuth } from "../hooks/useAuth.jsx";
import { formatTimestamp, formatDate, formatDuration, getTodayDateString } from "../utils/helpers";
import toast from "react-hot-toast";

const toLocalDate = (d) =>
  `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;

const PRESETS = [
  { label: "Today", getValue: () => { const t = getTodayDateString(); return { from: t, to: t }; } },
  { label: "This Week", getValue: () => {
    const now = new Date();
    const mon = new Date(now);
    mon.setDate(now.getDate() - (now.getDay() === 0 ? 6 : now.getDay() - 1));
    return { from: toLocalDate(mon), to: getTodayDateString() };
  }},
  { label: "This Month", getValue: () => {
    const now = new Date();
    const first = new Date(now.getFullYear(), now.getMonth(), 1);
    return { from: toLocalDate(first), to: getTodayDateString() };
  }},
  { label: "All Time", getValue: () => ({ from: "", to: "" }) },
];

export default function LogsPage() {
  const { userProfile } = useAuth();
  const isStaff = userProfile?.role === "admin" || userProfile?.role === "librarian";

  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState(getTodayDateString());
  const [dateTo, setDateTo] = useState(getTodayDateString());
  const [activePreset, setActivePreset] = useState("Today");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  const [timingOut, setTimingOut] = useState(null);

  useEffect(() => {
    setLoading(true);
    const unsub = subscribeLogs((data) => { setLogs(data); setLoading(false); }, null);
    return unsub;
  }, []);

  const applyPreset = (preset) => {
    const { from, to } = preset.getValue();
    setDateFrom(from); setDateTo(to);
    setActivePreset(preset.label);
  };

  const handleDateFromChange = (val) => { setDateFrom(val); setActivePreset(""); };
  const handleDateToChange = (val) => { setDateTo(val); setActivePreset(""); };

  const getLogDate = (log) => {
    // Use log.date if available, otherwise derive from timeIn timestamp
    if (log.date) return log.date;
    if (log.timeIn) {
      const d = log.timeIn.toDate ? log.timeIn.toDate() : new Date(log.timeIn);
      return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
    }
    return "";
  };

  const filtered = logs.filter(log => {
    const q = search.toLowerCase();
    const matchSearch = !search || log.studentName?.toLowerCase().includes(q) || log.studentId?.toLowerCase().includes(q) || log.purpose?.toLowerCase().includes(q);
    const matchStatus = statusFilter === "all" || log.status === statusFilter;
    const logDate = getLogDate(log);
    const matchFrom = !dateFrom || logDate >= dateFrom;
    const matchTo = !dateTo || logDate <= dateTo;
    return matchSearch && matchStatus && matchFrom && matchTo;
  });

  // Visit counts for top visitors bar
  const visitCounts = filtered.reduce((acc, log) => {
    if (!acc[log.studentId]) acc[log.studentId] = { name: log.studentName, count: 0 };
    acc[log.studentId].count++;
    return acc;
  }, {});

  const topVisitors = Object.entries(visitCounts)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5);

  const exportCSV = () => {
    const headers = ["Student Name","Student ID","Purpose","Date","Time In","Time Out","Duration","Status","Logged By"];
    const rows = filtered.map(l => [l.studentName, l.studentId, l.purpose, l.date,
      l.timeIn ? (l.timeIn.toDate ? l.timeIn.toDate().toLocaleTimeString() : l.timeIn) : "",
      l.timeOut ? (l.timeOut.toDate ? l.timeOut.toDate().toLocaleTimeString() : l.timeOut) : "",
      formatDuration(l.timeIn, l.timeOut), l.status, l.loggedBy || ""]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url;
    a.download = `library-logs-${dateFrom || "all"}-to-${dateTo || "all"}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const handleTimeOut = async (log) => {
    setTimingOut(log.id);
    try {
      await timeOut(log.id);
      toast.success(`${log.studentName} timed out.`);
    } catch {
      toast.error("Failed to time out.");
    } finally {
      setTimingOut(null);
    }
  };

  const PURPOSES = ["Study", "Research", "Borrow/Return Books", "Use Computer", "Group Discussion", "Other"];

  return (
    <div className="fade-in">

      <style>{`
        .logs-controls { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; padding: 14px 16px; background: white; border-radius: 12px; box-shadow: var(--shadow-sm); border: 1px solid var(--gray-100); margin-bottom: 12px; }
        .logs-presets { display: flex; gap: 6px; flex-wrap: wrap; padding: 10px 16px; background: white; border-radius: 12px; box-shadow: var(--shadow-sm); border: 1px solid var(--gray-100); margin-bottom: 12px; align-items: center; }
        .preset-btn { padding: 5px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; cursor: pointer; border: 1px solid var(--gray-200); background: white; color: var(--gray-600); font-family: 'Poppins',sans-serif; transition: all 0.15s; }
        .preset-btn.active { background: var(--navy); color: white; border-color: var(--navy); }
        .logs-search { position: relative; flex: 1 1 180px; min-width: 0; }
        .logs-search input { width: 100%; padding: 9px 12px 9px 34px; border: 1px solid var(--gray-200); border-radius: 8px; font-size: 14px; outline: none; font-family: 'Poppins',sans-serif; }
        .logs-search svg { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: var(--gray-400); pointer-events: none; }
        .logs-select { padding: 9px 12px; border: 1px solid var(--gray-200); border-radius: 8px; font-size: 14px; outline: none; cursor: pointer; color: var(--gray-800); font-family: 'Poppins',sans-serif; background: white; }
        .export-btn { display: flex; align-items: center; gap: 6px; padding: 9px 14px; background: var(--navy); color: white; font-weight: 600; font-size: 13px; border-radius: 8px; cursor: pointer; white-space: nowrap; font-family: 'Poppins',sans-serif; border: none; }
        .logs-table-wrap { background: white; border-radius: 12px; box-shadow: var(--shadow-sm); border: 1px solid var(--gray-100); overflow: hidden; }
        .logs-table { width: 100%; border-collapse: collapse; }
        .logs-table th { padding: 9px 16px; text-align: left; font-size: 11px; font-weight: 600; color: var(--gray-400); text-transform: uppercase; letter-spacing: .06em; background: var(--gray-50); white-space: nowrap; }
        .logs-table td { padding: 12px 16px; font-size: 13px; border-top: 1px solid var(--gray-100); }
        .log-card { padding: 14px 16px; border-top: 1px solid var(--gray-100); }
        .log-card:first-child { border-top: none; }
        .log-card-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
        .top-visitors { background: white; border-radius: 12px; box-shadow: var(--shadow-sm); border: 1px solid var(--gray-100); padding: 16px 20px; margin-bottom: 12px; }
        .visitor-bar-row { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
        .visitor-bar-row:last-child { margin-bottom: 0; }
        .visitor-bar-bg { flex: 1; height: 8px; background: var(--gray-100); border-radius: 4px; overflow: hidden; }
        .visitor-bar-fill { height: 100%; background: var(--navy); border-radius: 4px; transition: width 0.4s ease; }
        @media (max-width: 768px) {
          .logs-controls { padding: 12px; gap: 8px; }
          .desktop-table { display: none !important; }
          .mobile-log-cards { display: block !important; }
          .logs-select { font-size: 13px; padding: 8px 10px; }
          .export-btn { padding: 8px 12px; font-size: 12px; }
        }
        .mobile-log-cards { display: none; }
      `}</style>

      <div style={{ marginBottom: 16 }}>
        <h1 style={{ fontSize: 20, marginBottom: 2 }}>Visit Logs</h1>
        <p style={{ color: "var(--gray-400)", fontSize: 13 }}>Full history of library visits</p>
      </div>

      {/* Preset buttons */}
      <div className="logs-presets">
        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--gray-400)", marginRight: 4 }}>Range:</span>
        {PRESETS.map(p => (
          <button key={p.label} className={`preset-btn${activePreset === p.label ? " active" : ""}`} onClick={() => applyPreset(p)}>{p.label}</button>
        ))}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: 8 }}>
          <input type="date" value={dateFrom} onChange={e => handleDateFromChange(e.target.value)} className="logs-select" style={{ padding: "5px 8px", fontSize: 13 }} />
          <span style={{ color: "var(--gray-400)", fontSize: 12 }}>to</span>
          <input type="date" value={dateTo} onChange={e => handleDateToChange(e.target.value)} className="logs-select" style={{ padding: "5px 8px", fontSize: 13 }} />
        </div>
      </div>

      {/* Controls */}
      <div className="logs-controls">
        <div className="logs-search">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, ID, purpose..."
            onFocus={e => e.target.style.borderColor = "var(--navy)"} onBlur={e => e.target.style.borderColor = "var(--gray-200)"} />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="logs-select">
          <option value="all">All Status</option>
          <option value="active">Inside</option>
          <option value="completed">Completed</option>
        </select>
        <button onClick={exportCSV} className="export-btn">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Export CSV
        </button>
        <span style={{ marginLeft: "auto", color: "var(--gray-400)", fontSize: 13, whiteSpace: "nowrap" }}>{filtered.length} record{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Top Visitors */}
      {topVisitors.length > 0 && (
        <div className="top-visitors">
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--gray-400)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>
            Top Visitors · {activePreset || "Custom Range"}
          </div>
          {topVisitors.map(([id, { name, count }], i) => (
            <div key={id} className="visitor-bar-row">
              <span style={{ fontSize: 12, color: "var(--navy)", fontWeight: 600, minWidth: 20 }}>#{i + 1}</span>
              <span style={{ fontSize: 13, color: "var(--gray-800)", minWidth: 0, flex: "0 0 160px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</span>
              <div className="visitor-bar-bg">
                <div className="visitor-bar-fill" style={{ width: `${(count / topVisitors[0][1].count) * 100}%` }} />
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: "var(--navy)", minWidth: 50, textAlign: "right" }}>{count} visit{count !== 1 ? "s" : ""}</span>
            </div>
          ))}
        </div>
      )}

      {/* Logs Table */}
      <div className="logs-table-wrap">
        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "var(--gray-400)", fontSize: 14 }}>Loading logs...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: "40px 24px", textAlign: "center" }}>
            <p style={{ fontWeight: 500, color: "var(--gray-600)", marginBottom: 4 }}>No records found</p>
            <p style={{ fontSize: 13, color: "var(--gray-400)" }}>Try adjusting your filters</p>
          </div>
        ) : (<>
          {/* Desktop table */}
          <div className="desktop-table" style={{ overflowX: "auto" }}>
            <table className="logs-table">
              <thead>
                <tr>{["Student Name","Student ID","Purpose","Date","Time In","Time Out","Duration","Status", ...(isStaff ? [""] : [])].map(h=><th key={h}>{h}</th>)}</tr>
              </thead>
              <tbody>{filtered.map((log, i) => (
                <tr key={log.id} style={{ background: i % 2 === 0 ? "white" : "var(--gray-50)" }}>
                  <td style={{ fontWeight: 500 }}>
                    {log.studentName}
                    {visitCounts[log.studentId]?.count > 1 && (
                      <span style={{ marginLeft: 6, fontSize: 11, fontWeight: 600, background: "var(--navy)", color: "white", padding: "1px 6px", borderRadius: 10 }}>
                        ×{visitCounts[log.studentId].count}
                      </span>
                    )}
                  </td>
                  <td style={{ color: "var(--gray-600)", fontFamily: "monospace" }}>{log.studentId}</td>
                  <td style={{ color: "var(--gray-600)" }}>{log.purpose}</td>
                  <td style={{ color: "var(--gray-500)", whiteSpace: "nowrap" }}>{formatDate(log.timeIn)}</td>
                  <td style={{ whiteSpace: "nowrap" }}>{formatTimestamp(log.timeIn)}</td>
                  <td style={{ whiteSpace: "nowrap" }}>{log.timeOut ? formatTimestamp(log.timeOut) : <span style={{ color: "var(--gray-300)" }}>—</span>}</td>
                  <td style={{ fontWeight: 500, color: "var(--navy)" }}>{formatDuration(log.timeIn, log.timeOut)}</td>
                  <td><span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 20, background: log.status === "active" ? "rgba(26,154,92,0.12)" : "var(--gray-100)", color: log.status === "active" ? "var(--green)" : "var(--gray-600)" }}>{log.status === "active" ? "Inside" : "Completed"}</span></td>
                  {isStaff && (
                    <td>
                      <div style={{ display: "flex", gap: 6 }}>
                        {log.status === "active" && (
                          <button onClick={() => handleTimeOut(log)} disabled={timingOut === log.id} title="Time out"
                            style={{ padding: "4px 8px", background: "rgba(26,154,92,0.08)", border: "1px solid rgba(26,154,92,0.25)", borderRadius: 6, cursor: timingOut === log.id ? "not-allowed" : "pointer", color: "var(--green)", display: "flex", alignItems: "center", opacity: timingOut === log.id ? 0.5 : 1 }}
                            onMouseEnter={e => { if (timingOut !== log.id) e.currentTarget.style.background = "rgba(26,154,92,0.18)"; }}
                            onMouseLeave={e => e.currentTarget.style.background = "rgba(26,154,92,0.08)"}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}</tbody>
            </table>
          </div>
          {/* Mobile cards */}
          <div className="mobile-log-cards">
            {filtered.map(log => (
              <div key={log.id} className="log-card">
                <div className="log-card-row">
                  <span style={{ fontWeight: 600, fontSize: 14, color: "var(--navy)" }}>
                    {log.studentName}
                    {visitCounts[log.studentId]?.count > 1 && (
                      <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 700, background: "var(--navy)", color: "white", padding: "1px 5px", borderRadius: 10 }}>
                        ×{visitCounts[log.studentId].count}
                      </span>
                    )}
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 20, background: log.status === "active" ? "rgba(26,154,92,0.12)" : "var(--gray-100)", color: log.status === "active" ? "var(--green)" : "var(--gray-600)" }}>{log.status === "active" ? "Inside" : "Completed"}</span>
                    {isStaff && (
                      <>
                        {log.status === "active" && (
                          <button onClick={() => handleTimeOut(log)} disabled={timingOut === log.id} style={{ padding: "4px 7px", background: "rgba(26,154,92,0.08)", border: "1px solid rgba(26,154,92,0.25)", borderRadius: 6, cursor: "pointer", color: "var(--green)", opacity: timingOut === log.id ? 0.5 : 1 }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
                <div className="log-card-row">
                  <span style={{ fontSize: 12, color: "var(--gray-400)" }}>{log.studentId} · {log.purpose}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "var(--navy)" }}>{formatDuration(log.timeIn, log.timeOut)}</span>
                </div>
                <div style={{ fontSize: 11, color: "var(--gray-400)", marginTop: 2 }}>
                  {formatDate(log.timeIn)} · In: {formatTimestamp(log.timeIn)}{log.timeOut ? ` · Out: ${formatTimestamp(log.timeOut)}` : ""}
                </div>
              </div>
            ))}
          </div>
        </>)}
      </div>
    </div>
  );
}