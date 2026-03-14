// src/firebase/auth.js
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./config";

export const registerUser = async (email, password, displayName, role = "student", department = "", program = "") => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(userCredential.user, { displayName });
  await setDoc(doc(db, "users", userCredential.user.uid), {
    uid: userCredential.user.uid,
    displayName,
    email,
    role,
    department,
    program,
    createdAt: serverTimestamp(),
  });
  return userCredential.user;
};

export const loginUser = async (email, password) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
};

export const logoutUser = async () => {
  await signOut(auth);
};

export const resetPassword = async (email) => {
  await sendPasswordResetEmail(auth, email);
};

// Delete a user's Firestore profile (Firebase Auth deletion requires Admin SDK — we soft-delete from Firestore)
export const deleteUserProfile = async (uid) => {
  const { deleteDoc, doc } = await import("firebase/firestore");
  const { db } = await import("./config");
  await deleteDoc(doc(db, "users", uid));
};