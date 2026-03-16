// src/firebase/auth.js
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./config";

export const registerUser = async (email, password, displayName, role = "student", department = "", program = "") => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const newUser = userCredential.user;

  // Update display name in Auth
  await updateProfile(newUser, { displayName });

  // Force token refresh to ensure auth state is fully propagated before Firestore write
  await newUser.getIdToken(true);

  // Write profile to Firestore
  await setDoc(doc(db, "users", newUser.uid), {
    uid: newUser.uid,
    displayName,
    email,
    role,
    department: department || "",
    program: program || "",
    createdAt: serverTimestamp(),
  });

  return newUser;
};

export const loginUser = async (email, password) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
};

export const loginWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ hd: "neu.edu.ph" }); // restrict to NEU domain
  const result = await signInWithPopup(auth, provider);
  const user = result.user;

  // Check if user profile already exists in Firestore
  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    // First time Google login — create profile
    await setDoc(userRef, {
      uid: user.uid,
      displayName: user.displayName || user.email.split("@")[0],
      email: user.email,
      role: "student",
      department: "",
      program: "",
      createdAt: serverTimestamp(),
    });
  }

  return user;
};

export const logoutUser = async () => {
  await signOut(auth);
};

export const resetPassword = async (email) => {
  await sendPasswordResetEmail(auth, email);
};

export const deleteUserProfile = async (uid) => {
  const { deleteDoc, doc } = await import("firebase/firestore");
  const { db } = await import("./config");
  await deleteDoc(doc(db, "users", uid));
};