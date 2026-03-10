// src/pages/TimeInPage.jsx
import { useState } from "react";
import { timeIn } from "../firebase/logs";
import { useAuth } from '../hooks/useAuth.jsx';
import { purposeOptions } from "../utils/helpers";
import toast from "react-hot-toast";

export default function TimeInPage() {
  const { user } = useAuth();
  const [form, setForm] = useState({ studentId: "", studentName: "", purpose: "" });
  const [loading, setLoading] = useState(false);
  const [lastLogged, setLastLogged] = useState(null);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.studentId.trim() || !form.studentName.trim() || !form.purpose) {
      toast.error("Please fill in all fields");
      return;
    }
    setLoading(true);
    try {
      await timeIn(
        form.studentId.trim().toUpperCase(),
        form.studentName.trim(),
        form.purpose,
        user?.displayName || user?.email,
        user?.uid
      );
      setLastLogged({ ...form, time: new Date() });
      toast.success(`${form.studentName} has been logged in!`);
      setForm({ studentId: "", studentName: "", purpose: "" });
      // Focus back to ID field for quick consecutive entries
      setTimeout(() => {
        document.getElementById("studentId")?.focus();
      }, 100);
    } catch (err) {
      toast.error("Failed to log visit. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in">
      <style>{`
        .timein-layout { display: flex; gap: 20px; align-items: flex-start; }
        .timein-form { flex: 1 1 360px; background: white; border-radius: 12px; box-shadow: var(--shadow-sm); border: 1px solid var(--gray-100); overflow: visible; }
        .timein-side { flex: 1 1 260px; display: flex; flex-direction: column; gap: 14px; }
        @media (max-width: 768px) {
          .timein-layout { flex-direction: column; }
          .timein-form { width: 100%; overflow: visible; }
          .timein-side { width: 100%; }
          .timein-form-inner { padding-bottom: 24px !important; }
        }
      `}</style>

      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, marginBottom: 2 }}>Log Visit</h1>
        <p style={{ color: "var(--gray-400)", fontSize: 13 }}>Record a student's library entry</p>
      </div>

      <div className="timein-layout">
        {/* Form */}
        <div className="timein-form">
          <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--gray-100)", background: "var(--navy)" }}>
            <h2 style={{ color: "var(--gold)", fontSize: 15, fontFamily: "'Poppins', sans-serif" }}>New Visit Entry</h2>
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, marginTop: 2 }}>Time-in a student or visitor</p>
          </div>

          <div className="timein-form-inner" style={{ padding: 20 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <Field id="studentId" label="Student ID Number" value={form.studentId} onChange={set("studentId")} placeholder="e.g. 2023-00001" required />
              <Field label="Full Name" value={form.studentName} onChange={set("studentName")} placeholder="e.g. Juan Dela Cruz" required />
              <div>
                <label style={labelStyle}>Purpose of Visit <span style={{ color: "var(--red)" }}>*</span></label>
                <select value={form.purpose} onChange={set("purpose")} style={{ ...inputStyle, cursor: "pointer", color: form.purpose ? "var(--gray-800)" : "var(--gray-400)" }}>
                  <option value="" disabled>Select purpose...</option>
                  {purposeOptions.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <button onClick={handleSubmit} disabled={loading} style={{ padding: "13px", background: loading ? "rgba(13,31,60,0.5)" : "var(--navy)", color: "white", fontWeight: 600, fontSize: 15, borderRadius: 10, cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "background 0.15s", width: "100%" }}>
                {loading ? "Logging..." : <><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>Log Time-In</>}
              </button>
            </div>
          </div>
        </div>

        {/* Right side */}
        <div className="timein-side">
          {lastLogged && (
            <div style={{ background: "var(--green-light)", border: "1px solid #a8e6cc", borderRadius: 12, padding: 16 }} className="fade-in">
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <div style={{ width: 30, height: 30, borderRadius: "50%", background: "var(--green)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: "var(--green)", fontSize: 14 }}>Successfully Logged!</div>
                  <div style={{ color: "var(--green)", opacity: 0.7, fontSize: 12 }}>{lastLogged.time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                </div>
              </div>
              <div style={{ display: "grid", gap: 5, fontSize: 13 }}>
                <InfoRow label="Student ID" value={lastLogged.studentId.toUpperCase()} />
                <InfoRow label="Name" value={lastLogged.studentName} />
                <InfoRow label="Purpose" value={lastLogged.purpose} />
              </div>
            </div>
          )}
          <div style={{ background: "var(--gray-50)", border: "1px solid var(--gray-200)", borderRadius: 12, padding: 16 }}>
            <h3 style={{ fontSize: 12, fontWeight: 600, color: "var(--gray-600)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>Notes</h3>
            <ul style={{ color: "var(--gray-600)", fontSize: 13, lineHeight: 1.9, paddingLeft: 16 }}>
              <li>Form resets after each submission</li>
              <li>Student ID saved in uppercase</li>
              <li>Active visitors visible on Dashboard</li>
              <li>Admins/librarians can time-out from Dashboard</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

const InfoRow = ({ label, value }) => (
  <div style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
    <span style={{ color: "var(--gray-400)", minWidth: 72, fontSize: 13, fontWeight: 500 }}>{label}</span>
    <span style={{ fontWeight: 600, color: "var(--gray-800)", fontSize: 14 }}>{value}</span>
  </div>
);

const labelStyle = {
  display: "block", fontSize: 15, fontWeight: 500, color: "var(--gray-600)", marginBottom: 6,
};
const inputStyle = {
  width: "100%", padding: "10px 14px",
  border: "1px solid var(--gray-200)", borderRadius: 8,
  fontSize: 16, color: "var(--gray-800)", outline: "none",
  transition: "border-color 0.15s",
  background: "var(--white)",
};

const Field = ({ id, label, value, onChange, placeholder, required }) => (
  <div>
    <label style={labelStyle}>
      {label} {required && <span style={{ color: "var(--red)" }}>*</span>}
    </label>
    <input
      id={id}
      type="text" value={value} onChange={onChange} placeholder={placeholder}
      style={inputStyle}
      onFocus={e => e.target.style.borderColor = "var(--navy)"}
      onBlur={e => e.target.style.borderColor = "var(--gray-200)"}
    />
  </div>
);