import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firestore'; // your initialized firestore

export const createOrUpdateUser = async (user) => {
  if (!user) return;

  const userRef = doc(db, 'users', user.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    // New user, create a document
    await setDoc(userRef, {
      email: user.email,
      displayName: user.displayName || '',
      photoURL: user.photoURL || '',
      createdAt: serverTimestamp()
    });
  } else {
    // Optional: update last login info or other fields
    await setDoc(userRef, { lastLogin: serverTimestamp() }, { merge: true });
  }

  return userRef;
};
