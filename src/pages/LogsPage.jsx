// src/pages/LogsPage.jsx
import { useState, useEffect } from "react";
import { subscribeLogs } from "../firebase/logs";
import { formatTimestamp, formatDate, formatDuration, getTodayDateString } from "../utils/helpers";

export default function LogsPage() {
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState(getTodayDateString());
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const unsub = subscribeLogs((data) => { setLogs(data); setLoading(false); }, dateFilter || null);
    return unsub;
  }, [dateFilter]);

  const filtered = logs.filter(log => {
    const q = search.toLowerCase();
    const matchSearch = !search || log.studentName?.toLowerCase().includes(q) || log.studentId?.toLowerCase().includes(q) || log.purpose?.toLowerCase().includes(q);
    const matchStatus = statusFilter === "all" || log.status === statusFilter;
    return matchSearch && matchStatus;
  });

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
    a.download = `library-logs-${dateFilter || "all"}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fade-in">
      <style>{`
        .logs-controls { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; padding: 14px 16px; background: white; border-radius: 12px; box-shadow: var(--shadow-sm); border: 1px solid var(--gray-100); margin-bottom: 16px; }
        .logs-search { position: relative; flex: 1 1 180px; min-width: 0; }
        .logs-search input { width: 100%; padding: 9px 12px 9px 34px; border: 1px solid var(--gray-200); border-radius: 8px; font-size: 14px; outline: none; font-family: 'Poppins',sans-serif; }
        .logs-search svg { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: var(--gray-400); pointer-events: none; }
        .logs-select { padding: 9px 12px; border: 1px solid var(--gray-200); border-radius: 8px; font-size: 14px; outline: none; cursor: pointer; color: var(--gray-800); font-family: 'Poppins',sans-serif; background: white; }
        .export-btn { display: flex; align-items: center; gap: 6px; padding: 9px 14px; background: var(--navy); color: white; font-weight: 600; font-size: 13px; border-radius: 8px; cursor: pointer; white-space: nowrap; font-family: 'Poppins',sans-serif; }
        .logs-table-wrap { background: white; border-radius: 12px; box-shadow: var(--shadow-sm); border: 1px solid var(--gray-100); overflow: hidden; }
        .logs-table { width: 100%; border-collapse: collapse; }
        .logs-table th { padding: 9px 16px; text-align: left; font-size: 11px; font-weight: 600; color: var(--gray-400); text-transform: uppercase; letter-spacing: .06em; background: var(--gray-50); white-space: nowrap; }
        .logs-table td { padding: 12px 16px; font-size: 13px; border-top: 1px solid var(--gray-100); }
        .log-card { padding: 14px 16px; border-top: 1px solid var(--gray-100); }
        .log-card:first-child { border-top: none; }
        .log-card-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
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

      {/* Controls */}
      <div className="logs-controls">
        <div className="logs-search">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, ID, purpose..."
            onFocus={e => e.target.style.borderColor = "var(--navy)"} onBlur={e => e.target.style.borderColor = "var(--gray-200)"} />
        </div>
        <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="logs-select" />
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

      {/* Content */}
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
              <thead><tr>{["Student Name","Student ID","Purpose","Date","Time In","Time Out","Duration","Status"].map(h=><th key={h}>{h}</th>)}</tr></thead>
              <tbody>{filtered.map((log, i) => (
                <tr key={log.id} style={{ background: i % 2 === 0 ? "white" : "var(--gray-50)" }}>
                  <td style={{ fontWeight: 500 }}>{log.studentName}</td>
                  <td style={{ color: "var(--gray-600)", fontFamily: "monospace" }}>{log.studentId}</td>
                  <td style={{ color: "var(--gray-600)" }}>{log.purpose}</td>
                  <td style={{ color: "var(--gray-500)", whiteSpace: "nowrap" }}>{formatDate(log.timeIn)}</td>
                  <td style={{ whiteSpace: "nowrap" }}>{formatTimestamp(log.timeIn)}</td>
                  <td style={{ whiteSpace: "nowrap" }}>{log.timeOut ? formatTimestamp(log.timeOut) : <span style={{ color: "var(--gray-300)" }}>—</span>}</td>
                  <td style={{ fontWeight: 500, color: "var(--navy)" }}>{formatDuration(log.timeIn, log.timeOut)}</td>
                  <td><span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 20, background: log.status === "active" ? "var(--green-light)" : "var(--gray-100)", color: log.status === "active" ? "var(--green)" : "var(--gray-600)" }}>{log.status === "active" ? "Inside" : "Completed"}</span></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          {/* Mobile cards */}
          <div className="mobile-log-cards">
            {filtered.map(log => (
              <div key={log.id} className="log-card">
                <div className="log-card-row">
                  <span style={{ fontWeight: 600, fontSize: 14, color: "var(--navy)" }}>{log.studentName}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 20, background: log.status === "active" ? "var(--green-light)" : "var(--gray-100)", color: log.status === "active" ? "var(--green)" : "var(--gray-600)" }}>{log.status === "active" ? "Inside" : "Completed"}</span>
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