// src/firebase/logs.js
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  where,
  limit,
  getDocs,
} from "firebase/firestore";
import { db } from "./config";

// Check if a student is already inside (active visit)
export const checkActiveVisit = async (studentId) => {
  const q = query(
    collection(db, "logs"),
    where("studentId", "==", studentId.toUpperCase()),
    where("status", "==", "active"),
    limit(1)
  );
  const snap = await getDocs(q);
  return snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() };
};

// Get past visits for a studentId (for name autosuggest)
export const getStudentHistory = async (studentId) => {
  const q = query(
    collection(db, "logs"),
    where("studentId", "==", studentId.toUpperCase()),
    orderBy("timeIn", "desc"),
    limit(1)
  );
  const snap = await getDocs(q);
  return snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() };
};

// Log a new library visit (time-in)
export const timeIn = async (studentId, studentName, purpose, loggedBy, loggedByUid) => {
  // Look up student's profile to get department and role
  let department = "";
  let program = "";
  let visitorRole = "student";
  try {
    const usersQ = query(
      collection(db, "users"),
      where("studentId", "==", studentId.toUpperCase()),
      limit(1)
    );
    const snap = await getDocs(usersQ);
    if (!snap.empty) {
      const profile = snap.docs[0].data();
      department = profile.department || "";
      program = profile.program || "";
      visitorRole = profile.role || "student";
    }
  } catch {
    // silently continue without profile data
  }

  const docRef = await addDoc(collection(db, "logs"), {
    studentId,
    studentName,
    purpose,
    loggedBy,
    loggedByUid,
    department,
    program,
    visitorRole,
    timeIn: serverTimestamp(),
    timeOut: null,
    status: "active",
    date: (() => { const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,"0")}-${String(n.getDate()).padStart(2,"0")}`; })(),
  });
  return docRef.id;
};

// Log time-out for an existing visit
export const timeOut = async (logId) => {
  const logRef = doc(db, "logs", logId);
  await updateDoc(logRef, {
    timeOut: serverTimestamp(),
    status: "completed",
  });
};

// Edit a log entry (correct name, ID or purpose)
export const editLog = async (logId, fields) => {
  const logRef = doc(db, "logs", logId);
  await updateDoc(logRef, {
    ...fields,
    editedAt: serverTimestamp(),
  });
};

// Delete a log entry
export const deleteLog = async (logId) => {
  await deleteDoc(doc(db, "logs", logId));
};

// Real-time listener for all logs.
// We fetch ordered by timeIn and filter date client-side to avoid
// requiring a composite Firestore index (date + timeIn).
export const subscribeLogs = (callback, dateFilter = null) => {
  const q = query(
    collection(db, "logs"),
    orderBy("timeIn", "desc"),
    limit(500)
  );
  return onSnapshot(q, (snapshot) => {
    let logs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    if (dateFilter) {
      logs = logs.filter((l) => {
        if (l.timeIn) {
          const d = l.timeIn.toDate ? l.timeIn.toDate() : new Date(l.timeIn);
          const localDate = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
          return localDate === dateFilter;
        }
        return l.date === dateFilter;
      });
    }
    callback(logs);
  });
};

// Get active (still inside) visitors
export const subscribeActiveVisitors = (callback) => {
  const q = query(
    collection(db, "logs"),
    where("status", "==", "active"),
    orderBy("timeIn", "desc")
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const logs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      callback(logs);
    },
    (error) => {
      // Fallback while Firestore index is still building
      console.warn("Index pending, using fallback:", error.message);
      const fallback = query(collection(db, "logs"), where("status", "==", "active"));
      onSnapshot(fallback, (snap) => {
        callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      });
    }
  );
};

// Get all logs created by a specific user (for My Profile page)
export const subscribeMyLogs = (uid, callback) => {
  const q = query(
    collection(db, "logs"),
    where("loggedByUid", "==", uid),
    orderBy("timeIn", "desc")
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const logs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      callback(logs);
    },
    (error) => {
      // Fallback while index builds
      console.warn("My logs index pending, using fallback:", error.message);
      const fallback = query(collection(db, "logs"), where("loggedByUid", "==", uid));
      onSnapshot(fallback, (snap) => {
        const logs = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => (b.timeIn?.seconds || 0) - (a.timeIn?.seconds || 0));
        callback(logs);
      });
    }
  );
};