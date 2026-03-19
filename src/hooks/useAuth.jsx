// src/hooks/useAuth.jsx
import { useState, useEffect, createContext, useContext } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "../firebase/config";
import { logoutUser } from "../firebase/auth";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleted, setDeleted] = useState(false);
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setLoading(false), 5000);
    let profileUnsub = null;

    const authUnsub = onAuthStateChanged(auth, async (firebaseUser) => {
      clearTimeout(timeout);
      if (profileUnsub) { profileUnsub(); profileUnsub = null; }

      if (firebaseUser) {
        let profileMissing = false;
        profileUnsub = onSnapshot(doc(db, "users", firebaseUser.uid), (snap) => {
          if (snap.exists()) {
            const profile = snap.data();
            // Check if user is blocked
            if (profile.blocked) {
              setBlocked(true);
              setUser(null);
              setUserProfile(null);
              logoutUser();
              setLoading(false);
              return;
            }
            setUser(firebaseUser);
            setUserProfile(profile);
            setBlocked(false);
            profileMissing = false;
            setLoading(false);
          } else {
            if (profileMissing) {
              setUserProfile(null);
              setDeleted(true);
              logoutUser();
              setLoading(false);
            } else {
              profileMissing = true;
              setTimeout(() => setLoading(false), 1500);
            }
          }
        }, () => {
          setUser(firebaseUser);
          setLoading(false);
        });
      } else {
        setUser(null);
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => {
      authUnsub();
      if (profileUnsub) profileUnsub();
      clearTimeout(timeout);
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, userProfile, loading, deleted, blocked }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);