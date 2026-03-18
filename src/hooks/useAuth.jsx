// src/hooks/useAuth.jsx
import { useState, useEffect, createContext, useContext } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { auth, db } from "../firebase/config";
import { logoutUser } from "../firebase/auth";

// Accounts allowed to switch roles on the fly
const HYBRID_EMAILS = [
  "rene.espina@neu.edu.ph",
  "jcesperanza@neu.edu.ph",
  "internship@neu.edu.ph",
];

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeRole, setActiveRole] = useState(null);
  const [deleted, setDeleted] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setLoading(false), 5000);
    let profileUnsub = null;

    const authUnsub = onAuthStateChanged(auth, async (firebaseUser) => {
      clearTimeout(timeout);

      // Clean up previous profile listener
      if (profileUnsub) { profileUnsub(); profileUnsub = null; }

      if (firebaseUser) {
        setUser(firebaseUser);

        // Use onSnapshot so profile updates (dept, program, role) reflect instantly
        let profileMissing = false;
        profileUnsub = onSnapshot(doc(db, "users", firebaseUser.uid), (snap) => {
          if (snap.exists()) {
            const profile = snap.data();
            setUserProfile(profile);
            setActiveRole(prev => prev || profile.role);
            profileMissing = false;
            setLoading(false);
          } else {
            if (profileMissing) {
              // Profile was already missing on first check — this is a deleted account
              setUserProfile(null);
              setActiveRole(null);
              setDeleted(true);
              logoutUser();
              setLoading(false);
            } else {
              // First time seeing no profile — could be a race condition on new register
              // Wait 1.5 seconds then check again via the snapshot re-firing
              profileMissing = true;
              setTimeout(() => {
                // If still no profile after delay, onSnapshot will fire again and catch it
                setLoading(false);
              }, 1500);
            }
          }
        }, () => {
          setLoading(false);
        });
      } else {
        setUser(null);
        setUserProfile(null);
        setActiveRole(null);
        setLoading(false);
      }
    });

    return () => {
      authUnsub();
      if (profileUnsub) profileUnsub();
      clearTimeout(timeout);
    };
  }, []);

  const isHybrid = HYBRID_EMAILS.includes(user?.email);

  const switchRole = async (newRole) => {
    if (!isHybrid || !user) return;
    setActiveRole(newRole);
    setUserProfile(prev => ({ ...prev, role: newRole }));
    try {
      await updateDoc(doc(db, "users", user.uid), { role: newRole });
    } catch {
      // silently fail
    }
  };

  const effectiveProfile = userProfile
    ? { ...userProfile, role: activeRole || userProfile.role }
    : null;

  return (
    <AuthContext.Provider value={{
      user, userProfile: effectiveProfile, loading,
      isHybrid, activeRole, switchRole, deleted,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);