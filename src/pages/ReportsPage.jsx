// src/pages/ReportsPage.jsx
import { useState, useEffect } from "react";
import { subscribeLogs } from "../firebase/logs";
import { useAuth } from "../hooks/useAuth.jsx";
import { useNavigate } from "react-router-dom";
import { DEPARTMENTS } from "../utils/departments";
import { purposeOptions } from "../utils/helpers";
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from "date-fns";
import toast from "react-hot-toast";

const DEPT_KEYS = Object.keys(DEPARTMENTS);
const DAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const SHORT_DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

const BAR_COLORS = [
  "#0d1f3c","#1a3a6e","#c9972b","#1a9a5c",
  "#7c3aed","#0891b2","#d9392b","#f59e0b",
];

export default function ReportsPage() {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Range selector — default: This Month
  const now = new Date();
  const [rangeType, setRangeType] = useState("month");
  const [customFrom, setCustomFrom] = useState(format(startOfMonth(now), "yyyy-MM-dd"));
  const [customTo, setCustomTo] = useState(format(now, "yyyy-MM-dd"));

  const isStaff = userProfile?.role === "admin" || userProfile?.role === "librarian";

  useEffect(() => {
    if (userProfile && !isStaff) {
      toast.error("Access denied.");
      navigate("/dashboard");
    }
  }, [userProfile]);

  useEffect(() => {
    setLoading(true);
    const unsub = subscribeLogs((data) => { setLogs(data); setLoading(false); }, null);
    return unsub;
  }, []);

  // Compute date range
  const getRange = () => {
    const n = new Date();
    if (rangeType === "week") {
      const day = n.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      const mon = new Date(n); mon.setDate(n.getDate() + diff);
      return { from: format(mon, "yyyy-MM-dd"), to: format(n, "yyyy-MM-dd"), label: "This Week" };
    }
    if (rangeType === "month") {
      return { from: format(startOfMonth(n), "yyyy-MM-dd"), to: format(n, "yyyy-MM-dd"), label: format(n, "MMMM yyyy") };
    }
    if (rangeType === "last3") {
      return { from: format(startOfMonth(subMonths(n, 2)), "yyyy-MM-dd"), to: format(n, "yyyy-MM-dd"), label: "Last 3 Months" };
    }
    if (rangeType === "year") {
      return { from: `${n.getFullYear()}-01-01`, to: format(n, "yyyy-MM-dd"), label: `Year ${n.getFullYear()}` };
    }
    return { from: customFrom, to: customTo, label: `${customFrom} → ${customTo}` };
  };

  const { from, to, label: rangeLabel } = getRange();

  const filtered = logs.filter(l => (!from || l.date >= from) && (!to || l.date <= to));

  // ── Summary stats ──
  const total = filtered.length;
  const completed = filtered.filter(l => l.status === "completed").length;
  const active = filtered.filter(l => l.status === "active").length;
  const uniqueStudents = new Set(filtered.map(l => l.studentId)).size;

  const avgDuration = (() => {
    const done = filtered.filter(l => l.status === "completed" && l.timeIn && l.timeOut);
    if (!done.length) return "—";
    const avg = done.reduce((s, l) => {
      const a = l.timeIn?.toDate ? l.timeIn.toDate() : new Date(l.timeIn);
      const b = l.timeOut?.toDate ? l.timeOut.toDate() : new Date(l.timeOut);
      return s + (b - a);
    }, 0) / done.length;
    const mins = Math.floor(avg / 60000);
    return mins < 60 ? `${mins}m` : `${Math.floor(mins / 60)}h ${mins % 60}m`;
  })();

  // ── Monthly trend (last 6 months) ──
  const last6Months = eachMonthOfInterval({ start: subMonths(now, 5), end: now });
  const monthlyData = last6Months.map(m => {
    const mStr = format(m, "yyyy-MM");
    const count = logs.filter(l => l.date?.startsWith(mStr)).length;
    return { label: format(m, "MMM"), count };
  });
  const maxMonthly = Math.max(...monthlyData.map(m => m.count), 1);

  // ── Day of week breakdown ──
  const dayData = DAYS.map((day, i) => ({
    label: SHORT_DAYS[i],
    count: filtered.filter(l => {
      if (!l.timeIn) return false;
      const d = l.timeIn?.toDate ? l.timeIn.toDate() : new Date(l.timeIn);
      return d.getDay() === i;
    }).length,
  }));
  const maxDay = Math.max(...dayData.map(d => d.count), 1);

  // ── Peak hours ──
  const hourData = HOURS.map(h => ({
    label: h === 0 ? "12am" : h < 12 ? `${h}am` : h === 12 ? "12pm" : `${h - 12}pm`,
    count: filtered.filter(l => {
      if (!l.timeIn) return false;
      const d = l.timeIn?.toDate ? l.timeIn.toDate() : new Date(l.timeIn);
      return d.getHours() === h;
    }).length,
  })).filter((_, i) => i >= 6 && i <= 21); // show 6am–9pm only
  const maxHour = Math.max(...hourData.map(h => h.count), 1);

  // ── Purpose breakdown ──
  const purposeData = purposeOptions.map(p => ({
    label: p, count: filtered.filter(l => l.purpose === p).length
  })).filter(p => p.count > 0).sort((a, b) => b.count - a.count);
  const maxPurpose = Math.max(...purposeData.map(p => p.count), 1);

  // ── College breakdown ──
  const collegeData = DEPT_KEYS.map(k => ({
    label: k, full: DEPARTMENTS[k].label, count: filtered.filter(l => l.department === k).length
  })).filter(c => c.count > 0).sort((a, b) => b.count - a.count);
  const maxCollege = Math.max(...collegeData.map(c => c.count), 1);
  const noCollege = filtered.filter(l => !l.department).length;

  // ── Print handler ──
  const handlePrint = () => window.print();

  // ── Export summary CSV ──
  const handleExportCSV = () => {
    const rows = [
      ["Report Period", rangeLabel],
      ["Total Visits", total],
      ["Completed", completed],
      ["Currently Inside", active],
      ["Unique Students", uniqueStudents],
      ["Average Duration", avgDuration],
      [],
      ["Purpose", "Count"],
      ...purposeData.map(p => [p.label, p.count]),
      [],
      ["College", "Count"],
      ...collegeData.map(c => [c.label, c.count]),
      ...(noCollege > 0 ? [["Unspecified", noCollege]] : []),
      [],
      ["Day", "Count"],
      ...dayData.map(d => [d.label, d.count]),
    ];
    const csv = rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `neu-library-report-${from}-to-${to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
      <div style={{ textAlign: "center", color: "var(--gray-400)" }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>📊</div>
        <p>Loading report data...</p>
      </div>
    </div>
  );

  return (
    <div className="fade-in" id="reports-page">
      <style>{`
        .report-grid-4 { display: grid; grid-template-columns: repeat(4,1fr); gap: 14px; margin-bottom: 22px; }
        .report-grid-2 { display: grid; grid-template-columns: repeat(2,1fr); gap: 16px; margin-bottom: 16px; }
        .report-card { background: white; border-radius: 16px; border: 1px solid var(--gray-100); box-shadow: var(--shadow-sm); overflow: hidden; }
        .report-card-head { padding: 14px 20px; border-bottom: 1px solid var(--gray-100); background: linear-gradient(to bottom, white, #fafbfd); display: flex; align-items: center; justify-content: space-between; }
        .report-card-body { padding: 18px 20px; }
        .summary-card { background: white; border-radius: 16px; border: 1px solid var(--gray-100); box-shadow: var(--shadow-sm); padding: 18px 20px; position: relative; overflow: hidden; transition: box-shadow 0.2s, transform 0.2s; }
        .summary-card:hover { box-shadow: var(--shadow-md); transform: translateY(-1px); }
        .summary-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; border-radius: 16px 16px 0 0; }
        .summary-card-blue::before { background: linear-gradient(90deg, #0d1f3c, #1a3a6e); }
        .summary-card-green::before { background: linear-gradient(90deg, #1a9a5c, #22c55e); }
        .summary-card-gold::before { background: linear-gradient(90deg, #c9972b, #e8b84b); }
        .summary-card-purple::before { background: linear-gradient(90deg, #7c3aed, #a855f7); }
        .bar-row { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
        .bar-row:last-child { margin-bottom: 0; }
        .bar-bg { flex: 1; height: 8px; background: var(--gray-100); border-radius: 4px; overflow: hidden; }
        .bar-fill { height: 100%; border-radius: 4px; transition: width 0.5s ease; }
        .chart-bar-col { display: flex; flex-direction: column; align-items: center; gap: 4px; flex: 1; }
        .chart-bar-wrap { width: 100%; display: flex; align-items: flex-end; justify-content: center; height: 80px; }
        .chart-bar { width: 70%; border-radius: 4px 4px 0 0; transition: height 0.5s ease; min-height: 2px; }
        .range-pill { padding: 5px 13px; border-radius: 20px; font-size: 12px; font-weight: 600; cursor: pointer; border: 1px solid var(--gray-200); background: white; color: var(--gray-600); font-family: 'Poppins',sans-serif; transition: all 0.15s; }
        .range-pill:hover { border-color: var(--navy); color: var(--navy); }
        .range-pill.active { background: var(--navy); color: white; border-color: var(--navy); box-shadow: 0 2px 8px rgba(13,31,60,0.2); }
        @media print {
          .no-print { display: none !important; }
          .report-grid-4 { grid-template-columns: repeat(4,1fr); }
          .report-grid-2 { grid-template-columns: repeat(2,1fr); }
        }
        @media (max-width: 768px) {
          .report-grid-4 { grid-template-columns: repeat(2,1fr); gap: 10px; }
          .report-grid-2 { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* ── Page Header ── */}
      <div className="page-header" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22 }}>Library Reports</h1>
          <p style={{ color: "var(--gray-400)", fontSize: 13, marginTop: 2 }}>
            Visit analytics and statistics — <strong style={{ color: "var(--navy)" }}>{rangeLabel}</strong>
          </p>
        </div>
        <div className="no-print" style={{ display: "flex", gap: 8 }}>
          <button onClick={handleExportCSV} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: "white", border: "1px solid var(--gray-200)", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", color: "var(--navy)", fontFamily: "'Poppins',sans-serif", transition: "all 0.15s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--navy)"; e.currentTarget.style.boxShadow = "var(--shadow-sm)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--gray-200)"; e.currentTarget.style.boxShadow = "none"; }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Export CSV
          </button>
          <button onClick={handlePrint} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: "var(--navy)", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", color: "white", fontFamily: "'Poppins',sans-serif", transition: "all 0.15s" }}
            onMouseEnter={e => { e.currentTarget.style.opacity = "0.9"; }}
            onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
            Print
          </button>
        </div>
      </div>

      {/* ── Range Selector ── */}
      <div className="no-print" style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center", marginBottom: 20 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--gray-400)", marginRight: 4 }}>Period:</span>
        {[["week","This Week"],["month","This Month"],["last3","Last 3 Months"],["year","This Year"],["custom","Custom"]].map(([val, lbl]) => (
          <button key={val} className={`range-pill${rangeType === val ? " active" : ""}`} onClick={() => setRangeType(val)}>{lbl}</button>
        ))}
        {rangeType === "custom" && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: 4 }}>
            <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)}
              style={{ padding: "5px 8px", border: "1px solid var(--gray-200)", borderRadius: 8, fontSize: 13, fontFamily: "'Poppins',sans-serif", outline: "none" }} />
            <span style={{ color: "var(--gray-400)", fontSize: 12 }}>to</span>
            <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)}
              style={{ padding: "5px 8px", border: "1px solid var(--gray-200)", borderRadius: 8, fontSize: 13, fontFamily: "'Poppins',sans-serif", outline: "none" }} />
          </div>
        )}
      </div>

      {/* ── Summary Cards ── */}
      <div className="report-grid-4">
        {[
          { label: "Total Visits", value: total, sub: "in selected period", cls: "summary-card-blue", color: "var(--navy)" },
          { label: "Completed", value: completed, sub: `${total ? Math.round(completed/total*100) : 0}% of total`, cls: "summary-card-green", color: "var(--green)" },
          { label: "Unique Students", value: uniqueStudents, sub: "individual visitors", cls: "summary-card-gold", color: "var(--gold)" },
          { label: "Avg. Duration", value: avgDuration, sub: "per completed visit", cls: "summary-card-purple", color: "#7c3aed" },
        ].map(({ label, value, sub, cls, color }) => (
          <div key={label} className={`summary-card ${cls}`}>
            <div style={{ fontSize: 28, fontWeight: 700, color, fontFamily: "'Poppins',sans-serif", lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--gray-700)", marginTop: 6 }}>{label}</div>
            <div style={{ fontSize: 11, color: "var(--gray-400)", marginTop: 3 }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* ── Monthly Trend + Day of Week ── */}
      <div className="report-grid-2">
        {/* Monthly trend */}
        <div className="report-card">
          <div className="report-card-head">
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--navy)" }}>Monthly Trend</div>
              <div style={{ fontSize: 12, color: "var(--gray-400)", marginTop: 1 }}>Last 6 months</div>
            </div>
          </div>
          <div className="report-card-body">
            <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 120 }}>
              {monthlyData.map((m, i) => (
                <div key={m.label} className="chart-bar-col">
                  <div className="chart-bar-wrap">
                    <div className="chart-bar" style={{
                      height: `${Math.max((m.count / maxMonthly) * 100, m.count > 0 ? 4 : 0)}%`,
                      background: i === monthlyData.length - 1
                        ? "linear-gradient(180deg, #c9972b, #b8861f)"
                        : "linear-gradient(180deg, #1a3a6e, #0d1f3c)",
                    }} />
                  </div>
                  <span style={{ fontSize: 10, color: "var(--gray-400)", fontWeight: 500 }}>{m.label}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: i === monthlyData.length - 1 ? "var(--gold)" : "var(--navy)" }}>{m.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Day of week */}
        <div className="report-card">
          <div className="report-card-head">
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--navy)" }}>Busiest Days</div>
              <div style={{ fontSize: 12, color: "var(--gray-400)", marginTop: 1 }}>Visits by day of week</div>
            </div>
          </div>
          <div className="report-card-body">
            <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 120 }}>
              {dayData.map((d, i) => (
                <div key={d.label} className="chart-bar-col">
                  <div className="chart-bar-wrap">
                    <div className="chart-bar" style={{
                      height: `${Math.max((d.count / maxDay) * 100, d.count > 0 ? 4 : 0)}%`,
                      background: d.count === Math.max(...dayData.map(x => x.count)) && d.count > 0
                        ? "linear-gradient(180deg, #d4a032, #c9972b)"
                        : "linear-gradient(180deg, #1a3a6e, #0d1f3c)",
                    }} />
                  </div>
                  <span style={{ fontSize: 10, color: "var(--gray-400)", fontWeight: 500 }}>{d.label}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "var(--navy)" }}>{d.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Peak Hours ── */}
      <div className="report-card" style={{ marginBottom: 16 }}>
        <div className="report-card-head">
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--navy)" }}>Peak Hours</div>
            <div style={{ fontSize: 12, color: "var(--gray-400)", marginTop: 1 }}>Visit distribution by time of day (6AM – 9PM)</div>
          </div>
        </div>
        <div className="report-card-body">
          <div style={{ display: "flex", alignItems: "flex-end", gap: 3 }}>
            {hourData.map((h) => (
              <div key={h.label} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                <div style={{ width: "100%", display: "flex", alignItems: "flex-end", justifyContent: "center", height: 60 }}>
                  <div style={{
                    width: "80%", borderRadius: "3px 3px 0 0", minHeight: h.count > 0 ? 3 : 0,
                    height: `${(h.count / maxHour) * 100}%`,
                    background: h.count === Math.max(...hourData.map(x => x.count)) && h.count > 0
                      ? "linear-gradient(180deg, #d4a032, #c9972b)"
                      : "linear-gradient(180deg, #2a4a7e, #0d1f3c)",
                    transition: "height 0.5s ease",
                  }} />
                </div>
                <span style={{ fontSize: 9, color: "var(--gray-400)", transform: "rotate(-45deg)", transformOrigin: "center", whiteSpace: "nowrap", marginTop: 4 }}>{h.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Purpose + College Breakdown ── */}
      <div className="report-grid-2">
        {/* Purpose breakdown */}
        <div className="report-card">
          <div className="report-card-head">
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--navy)" }}>Visit Reasons</div>
          </div>
          <div className="report-card-body">
            {purposeData.length === 0 ? (
              <p style={{ color: "var(--gray-400)", fontSize: 13, textAlign: "center", padding: "16px 0" }}>No data for selected period</p>
            ) : purposeData.map((p, i) => (
              <div key={p.label} className="bar-row">
                <span style={{ fontSize: 12, color: "var(--gray-700)", minWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.label}</span>
                <div className="bar-bg">
                  <div className="bar-fill" style={{ width: `${(p.count / maxPurpose) * 100}%`, background: BAR_COLORS[i % BAR_COLORS.length] }} />
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: "var(--navy)", minWidth: 28, textAlign: "right" }}>{p.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* College breakdown */}
        <div className="report-card">
          <div className="report-card-head">
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--navy)" }}>By College</div>
          </div>
          <div className="report-card-body">
            {collegeData.length === 0 && noCollege === 0 ? (
              <p style={{ color: "var(--gray-400)", fontSize: 13, textAlign: "center", padding: "16px 0" }}>No college data for selected period</p>
            ) : (<>
              {collegeData.map((c, i) => (
                <div key={c.label} className="bar-row">
                  <div style={{ minWidth: 140 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "var(--navy)" }}>{c.label}</div>
                    <div style={{ fontSize: 10, color: "var(--gray-400)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 130 }}>{c.full}</div>
                  </div>
                  <div className="bar-bg">
                    <div className="bar-fill" style={{ width: `${(c.count / maxCollege) * 100}%`, background: BAR_COLORS[i % BAR_COLORS.length] }} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "var(--navy)", minWidth: 28, textAlign: "right" }}>{c.count}</span>
                </div>
              ))}
              {noCollege > 0 && (
                <div className="bar-row">
                  <div style={{ minWidth: 140 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "var(--gray-400)" }}>Unspecified</div>
                    <div style={{ fontSize: 10, color: "var(--gray-400)" }}>No college on file</div>
                  </div>
                  <div className="bar-bg">
                    <div className="bar-fill" style={{ width: `${(noCollege / maxCollege) * 100}%`, background: "var(--gray-300)" }} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "var(--gray-400)", minWidth: 28, textAlign: "right" }}>{noCollege}</span>
                </div>
              )}
            </>)}
          </div>
        </div>
      </div>

      {/* ── Top Visitors ── */}
      <div className="report-card" style={{ marginBottom: 16 }}>
        <div className="report-card-head">
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--navy)" }}>Top Visitors</div>
            <div style={{ fontSize: 12, color: "var(--gray-400)", marginTop: 1 }}>Most frequent visitors in selected period</div>
          </div>
        </div>
        <div className="report-card-body" style={{ padding: 0 }}>
          {(() => {
            const counts = {};
            filtered.forEach(l => {
              if (!counts[l.studentId]) counts[l.studentId] = { name: l.studentName, id: l.studentId, dept: l.department, count: 0 };
              counts[l.studentId].count++;
            });
            const top = Object.values(counts).sort((a, b) => b.count - a.count).slice(0, 8);
            if (!top.length) return <p style={{ color: "var(--gray-400)", fontSize: 13, textAlign: "center", padding: 24 }}>No visits in selected period</p>;
            return (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {["Rank","Student","Student ID","College","Visits"].map(h => (
                      <th key={h} style={{ padding: "10px 16px", textAlign: h === "Visits" ? "center" : "left", fontSize: 11, fontWeight: 700, color: "var(--navy)", textTransform: "uppercase", letterSpacing: "0.07em", background: "linear-gradient(to bottom, #f0f4fa, #edf1f8)", borderBottom: "2px solid var(--gray-200)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {top.map((v, i) => (
                    <tr key={v.id} style={{ background: i % 2 === 0 ? "white" : "#fafbfd" }}>
                      <td style={{ padding: "11px 16px" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 24, height: 24, borderRadius: "50%", background: i < 3 ? "linear-gradient(135deg, #d4a032, #c9972b)" : "var(--gray-100)", color: i < 3 ? "var(--navy)" : "var(--gray-600)", fontSize: 11, fontWeight: 700 }}>{i + 1}</span>
                      </td>
                      <td style={{ padding: "11px 16px", fontWeight: 600, fontSize: 13, color: "var(--navy)" }}>{v.name}</td>
                      <td style={{ padding: "11px 16px", fontSize: 12, color: "var(--gray-400)", fontFamily: "monospace" }}>{v.id}</td>
                      <td style={{ padding: "11px 16px", fontSize: 12, color: "var(--gray-600)" }}>{v.dept || <span style={{ color: "var(--gray-300)" }}>—</span>}</td>
                      <td style={{ padding: "11px 16px", textAlign: "center" }}>
                        <span style={{ background: "rgba(13,31,60,0.08)", color: "var(--navy)", fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 20 }}>{v.count}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            );
          })()}
        </div>
      </div>
    </div>
  );
}