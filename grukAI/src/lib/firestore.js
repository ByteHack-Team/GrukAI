import { initializeApp, getApps } from "firebase/app";
import {
  getFirestore, doc, getDoc, setDoc, serverTimestamp,
  collection, addDoc, updateDoc, increment
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

function need(name) {
  const v = import.meta.env[name];
  if (!v) console.warn("[env missing]", name);
  return v;
}

const firebaseConfig = {
  apiKey: need("VITE_FIREBASE_API_KEY"),
  authDomain: need("VITE_FIREBASE_AUTH_DOMAIN"),
  projectId: need("VITE_FIREBASE_PROJECT_ID"),
  storageBucket: need("VITE_FIREBASE_STORAGE_BUCKET"),
  messagingSenderId: need("VITE_FIREBASE_MESSAGING_SENDER_ID"),
  appId: need("VITE_FIREBASE_APP_ID")
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

export async function createOrUpdateUser(user) {
  if (!user?.uid) return null;
  const userRef = doc(db, "users", user.uid);
  const snap = await getDoc(userRef);
  const base = {
    uid: user.uid,
    email: user.email || null,
    name: user.displayName || "",
    photoURL: user.photoURL || "",
    updatedAt: serverTimestamp()
  };
  if (!snap.exists()) {
    const initial = { ...base, points: 0, totalPoints: 0, level: 1, streak: 0, createdAt: serverTimestamp() };
    await setDoc(userRef, initial);
    return initial;
  }
  await setDoc(userRef, base, { merge: true });
  return (await getDoc(userRef)).data();
}

export async function uploadScanImage(userId, imageInput, meta = {}) {
  if (!userId) throw new Error("Missing userId");
  if (!imageInput) throw new Error("Missing image input");

  let blob;
  if (typeof imageInput === "string") {
    const [head, b64] = imageInput.split(",");
    if (!head?.startsWith("data:")) throw new Error("Invalid data URL");
    const mime = head.match(/data:(.*);base64/)?.[1] || "image/jpeg";
    const bin = atob(b64);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    blob = new Blob([arr], { type: mime });
  } else {
    blob = imageInput;
  }

  const ext = (blob.type?.split("/")[1]) || "jpg";
  const path = `scans/${userId}/${Date.now()}.${ext}`;
  const fileRef = ref(storage, path);

  await uploadBytes(fileRef, blob);
  const url = await getDownloadURL(fileRef);

  // Optional metadata doc (remove if not needed)
  await addDoc(collection(db, "scans"), {
    userId, url, path,
    size: blob.size,
    contentType: blob.type,
    createdAt: serverTimestamp(),
    ...meta
  });

  return { url, path };
}

// New function to add points to user
export async function addPointsToUser(userId, points) {
  if (!userId || typeof points !== 'number' || points <= 0) {
    console.warn("Invalid userId or points for addPointsToUser");
    return;
  }

  try {
    const userRef = doc(db, "users", userId);
    
    // Use increment to atomically add points to both fields
    await updateDoc(userRef, {
      points: increment(points),
      totalPoints: increment(points),
      updatedAt: serverTimestamp()
    });

    console.log(`Added ${points} points to user ${userId}`);
  } catch (error) {
    console.error("Error adding points to user:", error);
    throw error;
  }
}