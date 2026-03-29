import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA4CbunSEJT7CuiZ54iqkPYt56BV3ZT3cs",
  authDomain: "roar-in-varc-mayankojha.firebaseapp.com",
  projectId: "roar-in-varc-mayankojha",
  storageBucket: "roar-in-varc-mayankojha.firebasestorage.app",
  messagingSenderId: "407114300851",
  appId: "1:407114300851:web:d9af7a8716ac7c2a1a9fc6",
  measurementId: "G-4NB5J4F114"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// Auth Helpers: Switched BACK to Popup now that the domain is authorized!
export const loginWithGoogle = async () => {
  try {
    await signInWithPopup(auth, googleProvider);
  } catch (error) {
    alert("Login Error: " + error.message);
  }
};

export const logout = () => signOut(auth);

// Database Helpers
export const saveUserData = async (userId, data) => {
  const userDoc = doc(db, "users", userId);
  return setDoc(userDoc, data, { merge: true });
};

export const getUserData = async (userId) => {
  const userDoc = doc(db, "users", userId);
  const snap = await getDoc(userDoc);
  return snap.exists() ? snap.data() : null;
};