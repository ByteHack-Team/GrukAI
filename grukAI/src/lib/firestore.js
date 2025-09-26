// src/lib/firestore.js
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getFunctions } from "firebase/functions";

// Firebase config using Vite env variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export const functions = getFunctions(app);

/**
 * createOrUpdateUser(user)
 * - Ensures a users/{uid} doc exists and sets sensible defaults.
 * - Returns the user doc data (not the DocumentReference).
 */
export async function createOrUpdateUser(user) {
  if (!user || !user.uid) return null;

  const userRef = doc(db, "users", user.uid);
  const snap = await getDoc(userRef);

  const base = {
    uid: user.uid,
    email: user.email || null,
    name: user.displayName || "",
    photoURL: user.photoURL || "",
    updatedAt: serverTimestamp(),
  };

  if (!snap.exists()) {
    const initial = {
      ...base,
      points: 0,
      totalPoints: 0,
      level: 1,
      streak: 0,
      createdAt: serverTimestamp(),
    };
    await setDoc(userRef, initial);
    return { ...initial };
  } else {
    // Merge to avoid overwriting custom fields
    await setDoc(userRef, base, { merge: true });
    const refreshed = await getDoc(userRef);
    return refreshed.exists() ? refreshed.data() : null;
  }
}
