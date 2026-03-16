// src/hooks/useAuth.jsx
import { useState, useEffect, createContext, useContext } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../firebase/config";

// Accounts allowed to switch roles on the fly
const HYBRID_EMAILS = ["rene.espina@neu.edu.ph", "jcesperanza@neu.edu.ph"];

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  // Active role — can be overridden for hybrid accounts without touching Firestore
  const [activeRole, setActiveRole] = useState(null);

  useEffect(() => {
    const timeout = setTimeout(() => setLoading(false), 5000);
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      clearTimeout(timeout);
      if (firebaseUser) {
        setUser(firebaseUser);
        try {
          const profileDoc = await getDoc(doc(db, "users", firebaseUser.uid));
          if (profileDoc.exists()) {
            const profile = profileDoc.data();
            setUserProfile(profile);
            setActiveRole(profile.role); // initialize active role from Firestore
          }
        } catch {
          // ignore
        }
      } else {
        setUser(null);
        setUserProfile(null);
        setActiveRole(null);
      }
      setLoading(false);
    });
    return () => { unsubscribe(); clearTimeout(timeout); };
  }, []);

  const isHybrid = HYBRID_EMAILS.includes(user?.email);

  // Switch role for hybrid accounts — updates Firestore too
  const switchRole = async (newRole) => {
    if (!isHybrid || !user) return;
    setActiveRole(newRole);
    setUserProfile(prev => ({ ...prev, role: newRole }));
    try {
      await updateDoc(doc(db, "users", user.uid), { role: newRole });
    } catch {
      // silently fail — UI already updated
    }
  };

  // Expose userProfile with active role applied
  const effectiveProfile = userProfile
    ? { ...userProfile, role: activeRole || userProfile.role }
    : null;

  return (
    <AuthContext.Provider value={{
      user, userProfile: effectiveProfile, loading,
      isHybrid, activeRole, switchRole,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);