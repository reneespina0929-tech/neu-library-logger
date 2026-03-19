// src/pages/AdminPage.jsx
import { useState, useEffect } from "react";
import { collection, onSnapshot, doc, updateDoc, query, orderBy } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "../hooks/useAuth.jsx";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const ROLES = ["student", "faculty", "librarian", "admin"];

const roleColor = (role) => ({
  admin:     { bg: "rgba(217,57,43,0.1)",   color: "#c0392b" },
  librarian: { bg: "rgba(201,151,43,0.12)", color: "var(--gold)" },
  faculty:   { bg: "rgba(13,31,60,0.1)",    color: "var(--navy)" },
  student:   { bg: "var(--gray-100)",        color: "var(--gray-600)" },
}[role] || { bg: "var(--gray-100)", color: "var(--gray-600)" });

const BlockModal = ({ user: target, onConfirm, onCancel, loading }) => (
  <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
    <div style={{ background: "white", borderRadius: 16, padding: 28, maxWidth: 380, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
      <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(217,57,43,0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--red)" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
      </div>
      <h3 style={{ textAlign: "center", fontSize: 17, fontWeight: 700, color: "var(--navy)", marginBottom: 8 }}>Block User?</h3>
      <p style={{ textAlign: "center", fontSize: 13, color: "var(--gray-600)", marginBottom: 6 }}>
        You are about to block <strong>{target.displayName || target.email}</strong>.
      </p>
      <p style={{ textAlign: "center", fontSize: 12, color: "var(--red)", marginBottom: 24 }}>
        They will be signed out immediately and cannot log in again until an admin unblocks them.
      </p>
      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={onCancel} disabled={loading} style={{ flex: 1, padding: "10px", background: "var(--gray-100)", color: "var(--gray-700)", fontWeight: 600, fontSize: 13, borderRadius: 8, cursor: "pointer", border: "none", fontFamily: "'Poppins',sans-serif" }}>
          Cancel
        </button>
        <button onClick={onConfirm} disabled={loading} style={{ flex: 1, padding: "10px", background: "var(--red)", color: "white", fontWeight: 600, fontSize: 13, borderRadius: 8, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, border: "none", fontFamily: "'Poppins',sans-serif" }}>
          {loading ? "Blocking..." : "Block User"}
        </button>
      </div>
    </div>
  </div>
);

export default function AdminPage() {
  const { userProfile, user } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [updating, setUpdating] = useState(null);
  const [blockTarget, setBlockTarget] = useState(null);
  const [blockLoading, setBlockLoading] = useState(false);
  const [filterRole, setFilterRole] = useState("");
  const [filterDept, setFilterDept] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  useEffect(() => {
    if (userProfile && userProfile.role !== "admin") {
      toast.error("Access denied.");
      navigate("/dashboard");
    }
  }, [userProfile]);

  useEffect(() => {
    const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, []);

  const handleRoleChange = async (userId, newRole, userName) => {
    if (userId === user.uid) { toast.error("You can't change your own role."); return; }
    setUpdating(userId);
    try {
      await updateDoc(doc(db, "users", userId), { role: newRole });
      toast.success(`${userName}'s role updated to ${newRole}`);
    } catch {
      toast.error("Failed to update role.");
    } finally {
      setUpdating(null);
    }
  };

  const handleBlock = async () => {
    if (!blockTarget) return;
    setBlockLoading(true);
    try {
      await updateDoc(doc(db, "users", blockTarget.id), { blocked: true });
      toast.success(`${blockTarget.displayName || blockTarget.email} has been blocked.`);
      setBlockTarget(null);
    } catch {
      toast.error("Failed to block user.");
    } finally {
      setBlockLoading(false);
    }
  };

  const handleUnblock = async (userId, userName) => {
    try {
      await updateDoc(doc(db, "users", userId), { blocked: false });
      toast.success(`${userName} has been unblocked.`);
    } catch {
      toast.error("Failed to unblock user.");
    }
  };

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    const matchSearch = !search || u.displayName?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.studentId?.toLowerCase().includes(q);
    const matchRole = !filterRole || u.role === filterRole;
    const matchDept = !filterDept || u.department === filterDept;
    return matchSearch && matchRole && matchDept;
  }).sort((a, b) => {
    if (sortBy === "newest") return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
    if (sortBy === "oldest") return (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0);
    if (sortBy === "name") return (a.displayName || "").localeCompare(b.displayName || "");
    if (sortBy === "role") return (a.role || "").localeCompare(b.role || "");
    return 0;
  });

  const activeDepts = [...new Set(users.map(u => u.department).filter(Boolean))].sort();

  const roleCounts = users.reduce((acc, u) => {
    acc[u.role] = (acc[u.role] || 0) + 1;
    return acc;
  }, {});

  const BlockBtn = ({ u }) => (
    u.blocked ? (
      <button
        onClick={() => handleUnblock(u.id, u.displayName || u.email)}
        title="Unblock user"
        style={{ padding: "5px 10px", background: "rgba(26,154,92,0.08)", border: "1px solid rgba(26,154,92,0.25)", borderRadius: 6, cursor: "pointer", color: "var(--green)", display: "flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600, fontFamily: "'Poppins',sans-serif", flexShrink: 0 }}
        onMouseEnter={e => e.currentTarget.style.background = "rgba(26,154,92,0.18)"}
        onMouseLeave={e => e.currentTarget.style.background = "rgba(26,154,92,0.08)"}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        Unblock
      </button>
    ) : (
      <button
        onClick={() => setBlockTarget(u)}
        title="Block user"
        style={{ padding: "5px 10px", background: "rgba(217,57,43,0.08)", border: "1px solid rgba(217,57,43,0.2)", borderRadius: 6, cursor: "pointer", color: "var(--red)", display: "flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600, fontFamily: "'Poppins',sans-serif", flexShrink: 0 }}
        onMouseEnter={e => e.currentTarget.style.background = "rgba(217,57,43,0.18)"}
        onMouseLeave={e => e.currentTarget.style.background = "rgba(217,57,43,0.08)"}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
        Block
      </button>
    )
  );

  return (
    <div className="fade-in">
      {blockTarget && (
        <BlockModal
          user={blockTarget}
          onConfirm={handleBlock}
          onCancel={() => setBlockTarget(null)}
          loading={blockLoading}
        />
      )}

      <style>{`
        .admin-stats { display: grid; grid-template-columns: repeat(4,1fr); gap: 10px; margin-bottom: 16px; }
        .admin-stat { background: white; border-radius: 10px; padding: 14px 16px; border: 1px solid var(--gray-100); box-shadow: var(--shadow-sm); text-align: center; }
        .users-table { width: 100%; border-collapse: collapse; }
        .users-table th { padding: 9px 16px; text-align: left; font-size: 11px; font-weight: 600; color: var(--gray-400); text-transform: uppercase; letter-spacing: .06em; background: var(--gray-50); }
        .users-table td { padding: 12px 16px; font-size: 13px; border-top: 1px solid var(--gray-100); }
        .role-select { padding: 5px 8px; border: 1px solid var(--gray-200); border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; outline: none; font-family: 'Poppins',sans-serif; background: white; }
        .user-card { padding: 14px 16px; border-top: 1px solid var(--gray-100); }
        .user-card:first-child { border-top: none; }
        @media (max-width: 768px) {
          .admin-stats { grid-template-columns: repeat(2,1fr); }
          .desktop-users { display: none !important; }
          .mobile-users { display: block !important; }
        }
        .mobile-users { display: none; }
      `}</style>

      <div style={{ marginBottom: 16 }}>
        <h1 style={{ fontSize: 20, marginBottom: 2 }}>Manage Users</h1>
        <p style={{ color: "var(--gray-400)", fontSize: 13 }}>View, update roles, and remove users</p>
      </div>

      {/* Role summary */}
      <div className="admin-stats">
        {ROLES.map(role => {
          const { bg, color } = roleColor(role);
          return (
            <div key={role} className="admin-stat">
              <div style={{ fontSize: 22, fontWeight: 700, color, fontFamily: "'Poppins',sans-serif" }}>{roleCounts[role] || 0}</div>
              <div style={{ fontSize: 12, color: "var(--gray-400)", textTransform: "capitalize", marginTop: 2 }}>{role}{(roleCounts[role] || 0) !== 1 ? "s" : ""}</div>
            </div>
          );
        })}
      </div>

      {/* Search + Filters */}
      <div style={{ background: "white", border: "1px solid var(--gray-100)", borderRadius: 12, padding: "14px 16px", marginBottom: 12, boxShadow: "var(--shadow-sm)", display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: "1 1 200px", minWidth: 0 }}>
          <svg style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--gray-400)", pointerEvents: "none" }}
            width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email or student ID..."
            style={{ width: "100%", padding: "9px 12px 9px 34px", border: "1px solid var(--gray-200)", borderRadius: 8, fontSize: 13, outline: "none", fontFamily: "'Poppins',sans-serif" }}
            onFocus={e => e.target.style.borderColor = "var(--navy)"} onBlur={e => e.target.style.borderColor = "var(--gray-200)"} />
        </div>
        <select value={filterRole} onChange={e => setFilterRole(e.target.value)}
          style={{ padding: "9px 12px", border: "1px solid var(--gray-200)", borderRadius: 8, fontSize: 13, outline: "none", cursor: "pointer", fontFamily: "'Poppins',sans-serif", background: "white", color: filterRole ? "var(--navy)" : "var(--gray-400)" }}>
          <option value="">All Roles</option>
          {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
        </select>
        <select value={filterDept} onChange={e => setFilterDept(e.target.value)}
          style={{ padding: "9px 12px", border: "1px solid var(--gray-200)", borderRadius: 8, fontSize: 13, outline: "none", cursor: "pointer", fontFamily: "'Poppins',sans-serif", background: "white", color: filterDept ? "var(--navy)" : "var(--gray-400)" }}>
          <option value="">All Departments</option>
          {activeDepts.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <select value={sortBy} onChange={e => setSortBy(e.target.value)}
          style={{ padding: "9px 12px", border: "1px solid var(--gray-200)", borderRadius: 8, fontSize: 13, outline: "none", cursor: "pointer", fontFamily: "'Poppins',sans-serif", background: "white", color: "var(--gray-800)" }}>
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="name">Name A–Z</option>
          <option value="role">Role</option>
        </select>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto" }}>
          <span style={{ fontSize: 12, color: "var(--gray-400)", whiteSpace: "nowrap" }}>{filtered.length} of {users.length} users</span>
          {(search || filterRole || filterDept) && (
            <button onClick={() => { setSearch(""); setFilterRole(""); setFilterDept(""); }}
              style={{ fontSize: 11, fontWeight: 600, color: "var(--red)", background: "rgba(217,57,43,0.08)", border: "1px solid rgba(217,57,43,0.2)", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontFamily: "'Poppins',sans-serif", whiteSpace: "nowrap" }}>
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Users list */}
      <div style={{ background: "white", borderRadius: 12, border: "1px solid var(--gray-100)", boxShadow: "var(--shadow-sm)", overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--gray-400)", fontSize: 14 }}>Loading users...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--gray-400)", fontSize: 13 }}>No users found</div>
        ) : (<>
          {/* Desktop table */}
          <div className="desktop-users">
            <table className="users-table">
              <thead>
                <tr><th>Name</th><th>Email</th><th>Student ID</th><th>Role</th><th>Joined</th><th></th></tr>
              </thead>
              <tbody>
                {filtered.map(u => {
                  const { bg, color } = roleColor(u.role);
                  const isSelf = u.id === user.uid;
                  return (
                    <tr key={u.id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--navy)", color: "var(--gold)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                            {(u.displayName || u.email || "?").split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                          </div>
                          <div>
                            <span style={{ fontWeight: 500 }}>{u.displayName || "—"}{isSelf && <span style={{ fontSize: 10, color: "var(--gray-400)", marginLeft: 6 }}>(you)</span>}</span>
                            {u.blocked && <span style={{ display: "inline-block", marginLeft: 6, fontSize: 10, fontWeight: 700, background: "rgba(217,57,43,0.1)", color: "var(--red)", padding: "1px 6px", borderRadius: 10, border: "1px solid rgba(217,57,43,0.2)" }}>Blocked</span>}
                          </div>
                        </div>
                      </td>
                      <td style={{ color: "var(--gray-600)" }}>{u.email}</td>
                      <td style={{ color: "var(--gray-600)", fontFamily: "monospace" }}>{u.studentId || "—"}</td>
                      <td>
                        {isSelf ? (
                          <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: bg, color }}>{u.role}</span>
                        ) : (
                          <select value={u.role || "student"} onChange={e => handleRoleChange(u.id, e.target.value, u.displayName)}
                            disabled={updating === u.id} className="role-select"
                            style={{ background: bg, color, borderColor: "transparent", opacity: updating === u.id ? 0.5 : 1 }}>
                            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                          </select>
                        )}
                      </td>
                      <td style={{ color: "var(--gray-400)", whiteSpace: "nowrap" }}>
                        {u.createdAt?.toDate ? u.createdAt.toDate().toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                      </td>
                      <td>{!isSelf && <BlockBtn u={u} />}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="mobile-users">
            {filtered.map(u => {
              const { bg, color } = roleColor(u.role);
              const isSelf = u.id === user.uid;
              return (
                <div key={u.id} className="user-card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 30, height: 30, borderRadius: "50%", background: "var(--navy)", color: "var(--gold)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                        {(u.displayName || u.email || "?").split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                      </div>
                      <span style={{ fontWeight: 600, fontSize: 14, color: "var(--navy)" }}>
                        {u.displayName || "—"}{isSelf && <span style={{ fontSize: 10, color: "var(--gray-400)", marginLeft: 4 }}>(you)</span>}
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {isSelf ? (
                        <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: bg, color }}>{u.role}</span>
                      ) : (
                        <select value={u.role || "student"} onChange={e => handleRoleChange(u.id, e.target.value, u.displayName)}
                          disabled={updating === u.id} className="role-select"
                          style={{ background: bg, color, borderColor: "transparent", opacity: updating === u.id ? 0.5 : 1 }}>
                          {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                      )}
                      {!isSelf && <BlockBtn u={u} />}
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--gray-400)" }}>{u.email}</div>
                  {u.studentId && <div style={{ fontSize: 12, color: "var(--gray-400)", fontFamily: "monospace" }}>{u.studentId}</div>}
                </div>
              );
            })}
          </div>
        </>)}
      </div>
    </div>
  );
}