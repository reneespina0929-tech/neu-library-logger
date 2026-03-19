// src/pages/TimeInPage.jsx
import { useState, useEffect, useRef } from "react";
import { timeIn, checkActiveVisit, getStudentHistory } from "../firebase/logs";
import { useAuth } from '../hooks/useAuth.jsx';
import { purposeOptions } from "../utils/helpers";
import { DEPARTMENTS, DEPT_KEYS } from "../utils/departments";
import { doc, updateDoc, query, collection, where, limit, getDocs } from "firebase/firestore";
import { db } from "../firebase/config";
import toast from "react-hot-toast";

export default function TimeInPage() {
  const { user } = useAuth();
  const [form, setForm] = useState({ studentId: "", studentName: "", purpose: "Study / Review" });
  const [loading, setLoading] = useState(false);
  const [lastLogged, setLastLogged] = useState(null);
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const [nameSuggestion, setNameSuggestion] = useState("");
  const debounceRef = useRef(null);

  // Department/program state — shown only when student has no dept in profile
  const [missingDept, setMissingDept] = useState(false);
  const [studentUid, setStudentUid] = useState(null);
  const [dept, setDept] = useState("");
  const [program, setProgram] = useState("");

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  // When student ID reaches full length, check for duplicate + autosuggest name
  useEffect(() => {
    const digits = form.studentId.replace(/\D/g, "");
    if (digits.length < 10) {
      setDuplicateWarning(null);
      setNameSuggestion("");
      setMissingDept(false);
      setStudentUid(null);
      setDept("");
      setProgram("");
      return;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const [active, history] = await Promise.all([
        checkActiveVisit(form.studentId),
        getStudentHistory(form.studentId),
      ]);
      setDuplicateWarning(active);
      if (history?.studentName && !form.studentName.trim()) {
        setNameSuggestion(history.studentName);
      } else {
        setNameSuggestion("");
      }

      // Check if student has a department set in their profile
      try {
        const q = query(
          collection(db, "users"),
          where("studentId", "==", form.studentId.trim().toUpperCase()),
          limit(1)
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
          const profile = snap.docs[0].data();
          setStudentUid(snap.docs[0].id);
          if (!profile.department) {
            setMissingDept(true);
            setDept("");
            setProgram("");
          } else {
            setMissingDept(false);
          }
        } else {
          // Student not registered — show dept fields anyway
          setMissingDept(true);
          setStudentUid(null);
          setDept("");
          setProgram("");
        }
      } catch {
        setMissingDept(false);
      }
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [form.studentId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.studentId.trim() || !form.studentName.trim() || !form.purpose) {
      toast.error("Please fill in all fields");
      return;
    }
    if (duplicateWarning) {
      toast.error(`${form.studentName} is already inside the library.`);
      return;
    }
    if (missingDept && !dept) {
      toast.error("Please select the student's department.");
      return;
    }
    if (missingDept && !program) {
      toast.error("Please select the student's program.");
      return;
    }
    setLoading(true);
    try {
      // If dept was filled in and student has a profile, save it back
      if (missingDept && dept && studentUid) {
        await updateDoc(doc(db, "users", studentUid), {
          department: dept,
          program: program,
        });
      }

      await timeIn(
        form.studentId.trim().toUpperCase(),
        form.studentName.trim(),
        form.purpose,
        user?.displayName || user?.email,
        user?.uid
      );
      setLastLogged({ ...form, time: new Date() });
      toast.success(`${form.studentName} has been logged in!`);
      setForm({ studentId: "", studentName: "", purpose: "Study / Review" });
      setDuplicateWarning(null);
      setNameSuggestion("");
      setMissingDept(false);
      setStudentUid(null);
      setDept("");
      setProgram("");
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
        .timein-form input::placeholder { color: #9ba3af !important; }
        .timein-form select { color: var(--gray-400); }
        .timein-form select.has-value { color: var(--gray-800); }
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
              <StudentIdField
                id="studentId"
                value={form.studentId}
                onChange={val => setForm(f => ({ ...f, studentId: val }))}
                required
              />

              {/* Duplicate warning */}
              {duplicateWarning && (
                <div style={{ background: "rgba(217,57,43,0.08)", border: "1px solid rgba(217,57,43,0.3)", borderRadius: 8, padding: "10px 14px", display: "flex", alignItems: "center", gap: 8 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--red)" strokeWidth="2" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  <span style={{ fontSize: 13, color: "var(--red)", fontWeight: 500 }}>
                    This student is already inside the library since {duplicateWarning.timeIn?.toDate ? duplicateWarning.timeIn.toDate().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "earlier"}.
                  </span>
                </div>
              )}

              {/* Name field with autosuggest */}
              <div>
                <label style={labelStyle}>Full Name <span style={{ color: "var(--red)" }}>*</span></label>
                <div style={{ position: "relative" }}>
                  <input
                    type="text" value={form.studentName}
                    onChange={set("studentName")}
                    placeholder="e.g. Juan Dela Cruz"
                    style={inputStyle}
                    onFocus={e => e.target.style.borderColor = "var(--navy)"}
                    onBlur={e => e.target.style.borderColor = "var(--gray-200)"}
                  />
                  {nameSuggestion && !form.studentName.trim() && (
                    <button
                      onClick={() => { setForm(f => ({ ...f, studentName: nameSuggestion })); setNameSuggestion(""); }}
                      style={{
                        position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
                        background: "var(--navy)", color: "white", fontSize: 11, fontWeight: 600,
                        padding: "3px 10px", borderRadius: 6, cursor: "pointer", whiteSpace: "nowrap",
                        maxWidth: "60%", overflow: "hidden", textOverflow: "ellipsis",
                      }}
                      title={`Use: ${nameSuggestion}`}
                    >
                      Use: {nameSuggestion}
                    </button>
                  )}
                </div>
              </div>
              <div>
                <label style={labelStyle}>Purpose of Visit <span style={{ color: "var(--red)" }}>*</span></label>
                <select value={form.purpose} onChange={set("purpose")} style={{ ...inputStyle, cursor: "pointer", color: form.purpose ? "var(--gray-800)" : "var(--gray-400)" }}>
                  <option value="" disabled>Select purpose...</option>
                  {purposeOptions.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              {/* Dept/program — only shows when student has none in profile */}
              {missingDept && (
                <div style={{ background: "rgba(201,151,43,0.07)", border: "1px solid rgba(201,151,43,0.25)", borderRadius: 10, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    <span style={{ fontSize: 12, color: "var(--gold)", fontWeight: 600 }}>No department on file — please fill in below</span>
                  </div>
                  <div>
                    <label style={labelStyle}>Department / College <span style={{ color: "var(--red)" }}>*</span></label>
                    <select value={dept} onChange={e => { setDept(e.target.value); setProgram(""); }}
                      style={{ ...inputStyle, cursor: "pointer", color: dept ? "var(--gray-800)" : "var(--gray-400)" }}>
                      <option value="" disabled>Select department...</option>
                      {DEPT_KEYS.map(k => <option key={k} value={k}>{k} — {DEPARTMENTS[k].label}</option>)}
                    </select>
                  </div>
                  {dept && (
                    <div>
                      <label style={labelStyle}>Program <span style={{ color: "var(--red)" }}>*</span></label>
                      <select value={program} onChange={e => setProgram(e.target.value)}
                        style={{ ...inputStyle, cursor: "pointer", color: program ? "var(--gray-800)" : "var(--gray-400)" }}>
                        <option value="" disabled>Select program...</option>
                        {(DEPARTMENTS[dept]?.programs || []).map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                  )}
                  <p style={{ fontSize: 11, color: "var(--gray-400)", margin: 0 }}>
                    This will be saved to the student's profile for future visits.
                  </p>
                </div>
              )}
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

// Auto-formats input as XX-XXXXX-XXX (digits only, dashes inserted automatically)
const StudentIdField = ({ id, value, onChange, required }) => {
  const format = (raw) => {
    // Strip everything except digits
    const digits = raw.replace(/\D/g, "");
    // Apply XX-XXXXX-XXX pattern
    if (digits.length <= 2) return digits;
    if (digits.length <= 7) return `${digits.slice(0, 2)}-${digits.slice(2)}`;
    return `${digits.slice(0, 2)}-${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
  };

  const handleChange = (e) => {
    const formatted = format(e.target.value);
    onChange(formatted);
  };

  const handleKeyDown = (e) => {
    // Allow backspace to remove the dash naturally
    if (e.key === "Backspace" && (value.endsWith("-"))) {
      e.preventDefault();
      onChange(value.slice(0, -1));
    }
  };

  return (
    <div>
      <label style={labelStyle}>
        Student ID Number {required && <span style={{ color: "var(--red)" }}>*</span>}
      </label>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="24-12781-942"
        maxLength={12}
        style={inputStyle}
        onFocus={e => e.target.style.borderColor = "var(--navy)"}
        onBlur={e => e.target.style.borderColor = "var(--gray-200)"}
      />
    </div>
  );
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