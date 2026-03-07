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
    const unsub = subscribeLogs((data) => {
      setLogs(data);
      setLoading(false);
    }, dateFilter || null);
    return unsub;
  }, [dateFilter]);

  const filtered = logs.filter(log => {
    const matchSearch = !search ||
      log.studentName?.toLowerCase().includes(search.toLowerCase()) ||
      log.studentId?.toLowerCase().includes(search.toLowerCase()) ||
      log.purpose?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || log.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const exportCSV = () => {
    const headers = ["Student Name", "Student ID", "Purpose", "Date", "Time In", "Time Out", "Duration", "Status", "Logged By"];
    const rows = filtered.map(l => [
      l.studentName,
      l.studentId,
      l.purpose,
      l.date,
      l.timeIn ? (l.timeIn.toDate ? l.timeIn.toDate().toLocaleTimeString() : l.timeIn) : "",
      l.timeOut ? (l.timeOut.toDate ? l.timeOut.toDate().toLocaleTimeString() : l.timeOut) : "",
      formatDuration(l.timeIn, l.timeOut),
      l.status,
      l.loggedBy || "",
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `library-logs-${dateFilter || "all"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, marginBottom: 4 }}>Visit Logs</h1>
        <p style={{ color: "var(--gray-400)", fontSize: 14 }}>
          Full history of library visits
        </p>
      </div>

      {/* Controls */}
      <div style={{
        background: "white", borderRadius: "var(--radius-lg)",
        boxShadow: "var(--shadow-sm)", border: "1px solid var(--gray-100)",
        padding: "18px 24px", marginBottom: 20,
        display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center",
      }}>
        {/* Search */}
        <div style={{ position: "relative", flex: "1 1 200px" }}>
          <svg style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--gray-400)" }}
            width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, ID, purpose..."
            style={{
              width: "100%", padding: "9px 12px 9px 34px",
              border: "1px solid var(--gray-200)", borderRadius: 8, fontSize: 15,
              outline: "none", transition: "border-color 0.15s",
            }}
            onFocus={e => e.target.style.borderColor = "var(--navy)"}
            onBlur={e => e.target.style.borderColor = "var(--gray-200)"}
          />
        </div>

        {/* Date filter */}
        <input
          type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)}
          style={{
            padding: "9px 12px", border: "1px solid var(--gray-200)",
            borderRadius: 8, fontSize: 15, outline: "none",
            cursor: "pointer", color: "var(--gray-800)",
          }}
        />

        {/* Status filter */}
        <select
          value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          style={{
            padding: "9px 12px", border: "1px solid var(--gray-200)",
            borderRadius: 8, fontSize: 15, outline: "none", cursor: "pointer",
            color: "var(--gray-800)",
          }}
        >
          <option value="all">All Status</option>
          <option value="active">Inside</option>
          <option value="completed">Completed</option>
        </select>

        {/* Export */}
        <button
          onClick={exportCSV}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "9px 16px", background: "var(--navy)", color: "white",
            fontWeight: 600, fontSize: 15, borderRadius: 8, cursor: "pointer",
            transition: "background 0.15s", whiteSpace: "nowrap",
          }}
          onMouseEnter={e => e.currentTarget.style.background = "var(--navy-light)"}
          onMouseLeave={e => e.currentTarget.style.background = "var(--navy)"}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Export CSV
        </button>

        <div style={{
          marginLeft: "auto", color: "var(--gray-400)", fontSize: 16, whiteSpace: "nowrap",
        }}>
          {filtered.length} record{filtered.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Table */}
      <div style={{
        background: "white", borderRadius: "var(--radius-lg)",
        boxShadow: "var(--shadow-sm)", border: "1px solid var(--gray-100)",
        overflow: "hidden",
      }}>
        {loading ? (
          <div style={{ padding: "48px", textAlign: "center", color: "var(--gray-400)" }}>
            <div style={{ animation: "pulse 1.5s infinite", fontSize: 14 }}>Loading logs...</div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: "48px 24px", textAlign: "center" }}>
            <p style={{ fontWeight: 500, color: "var(--gray-600)", marginBottom: 4 }}>No records found</p>
            <p style={{ fontSize: 15, color: "var(--gray-400)" }}>Try adjusting your filters</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "var(--gray-50)" }}>
                  {["Student Name", "Student ID", "Purpose", "Date", "Time In", "Time Out", "Duration", "Status"].map(h => (
                    <th key={h} style={{
                      padding: "10px 18px", textAlign: "left", fontSize: 15,
                      fontWeight: 600, color: "var(--gray-400)", textTransform: "uppercase",
                      letterSpacing: "0.06em", whiteSpace: "nowrap",
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((log, i) => (
                  <tr key={log.id} style={{
                    borderTop: "1px solid var(--gray-100)",
                    background: i % 2 === 0 ? "white" : "var(--gray-50)",
                  }}>
                    <td style={{ padding: "13px 18px", fontWeight: 500, fontSize: 14 }}>{log.studentName}</td>
                    <td style={{ padding: "13px 18px", fontSize: 15, color: "var(--gray-600)", fontFamily: "monospace" }}>{log.studentId}</td>
                    <td style={{ padding: "13px 18px", fontSize: 16, color: "var(--gray-600)", maxWidth: 160, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {log.purpose}
                    </td>
                    <td style={{ padding: "13px 18px", fontSize: 16, color: "var(--gray-500)", whiteSpace: "nowrap" }}>
                      {formatDate(log.timeIn)}
                    </td>
                    <td style={{ padding: "13px 18px", fontSize: 15, whiteSpace: "nowrap" }}>{formatTimestamp(log.timeIn)}</td>
                    <td style={{ padding: "13px 18px", fontSize: 15, whiteSpace: "nowrap" }}>
                      {log.timeOut ? formatTimestamp(log.timeOut) : <span style={{ color: "var(--gray-300)" }}>—</span>}
                    </td>
                    <td style={{ padding: "13px 18px", fontSize: 15, fontWeight: 500, color: "var(--navy)" }}>
                      {formatDuration(log.timeIn, log.timeOut)}
                    </td>
                    <td style={{ padding: "13px 18px" }}>
                      <span style={{
                        fontSize: 15, fontWeight: 600, padding: "3px 9px", borderRadius: 20,
                        background: log.status === "active" ? "var(--green-light)" : "var(--gray-100)",
                        color: log.status === "active" ? "var(--green)" : "var(--gray-600)",
                        whiteSpace: "nowrap",
                      }}>
                        {log.status === "active" ? "● Inside" : "Completed"}
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