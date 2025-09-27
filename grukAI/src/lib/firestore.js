import { initializeApp, getApps } from "firebase/app";
import {
  getFirestore, doc, getDoc, setDoc, serverTimestamp,
  collection, addDoc, updateDoc, increment, query, where, orderBy, limit, getDocs
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

// Helper function to get environment variables
function need(key) {
  const value = import.meta.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

const firebaseConfig = {
  apiKey: need("VITE_FIREBASE_API_KEY"),
  authDomain: need("VITE_FIREBASE_AUTH_DOMAIN"),
  projectId: need("VITE_FIREBASE_PROJECT_ID"),
  storageBucket: need("VITE_FIREBASE_STORAGE_BUCKET"),
  messagingSenderId: need("VITE_FIREBASE_MESSAGING_SENDER_ID"),
  appId: need("VITE_FIREBASE_APP_ID")
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

// ✅ SIMPLIFIED: Just check if image is accessible, don't try to convert to blob
export async function checkImageAccessibility(imageUrl) {
  return new Promise((resolve) => {
    const img = new Image();
    
    const timeoutId = setTimeout(() => {
      cleanup();
      resolve(false); // Timeout = not accessible
    }, 3000);

    const cleanup = () => {
      clearTimeout(timeoutId);
      img.onload = null;
      img.onerror = null;
    };

    img.onload = () => {
      cleanup();
      resolve(true); // Image loaded = accessible
    };
    
    img.onerror = () => {
      cleanup();
      resolve(false); // Error = not accessible
    };
    
    img.src = imageUrl;
  });
}

// ✅ COMPLETELY REWRITTEN: Simpler and more reliable CSS cropping
export function createCroppedImageCSS(originalImageUrl, bbox) {
  if (!bbox || !Array.isArray(bbox) || bbox.length !== 4) {
    console.warn('Invalid bbox for cropping:', bbox);
    return {
      backgroundImage: `url(${originalImageUrl})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat'
    };
  }
  
  const [x, y, width, height] = bbox;
  
  console.log('Creating CSS crop with bbox:', { x, y, width, height });
  
  // Use CSS clip-path instead of complex background positioning
  // This is much more reliable and predictable
  const clipPath = `inset(${y}% ${100 - x - width}% ${100 - y - height}% ${x}%)`;
  
  const cssStyle = {
    backgroundImage: `url(${originalImageUrl})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    clipPath: clipPath,
    // Fallback for browsers that don't support clip-path
    '-webkit-clip-path': clipPath
  };
  
  console.log('Generated CSS style:', cssStyle);
  
  return cssStyle;
}

// ✅ NEW: Alternative method using object-position (for img elements)
export function createImageCropStyle(originalImageUrl, bbox) {
  if (!bbox || !Array.isArray(bbox) || bbox.length !== 4) {
    return {
      src: originalImageUrl,
      style: {
        objectFit: 'cover',
        objectPosition: 'center'
      }
    };
  }
  
  const [x, y, width, height] = bbox;
  
  // Calculate the center point of the bounding box
  const centerX = x + (width / 2);
  const centerY = y + (height / 2);
  
  return {
    src: originalImageUrl,
    style: {
      objectFit: 'cover',
      objectPosition: `${centerX}% ${centerY}%`,
      // Scale the image so the bbox area fills the container
      transform: `scale(${Math.max(100/width, 100/height)})`,
      transformOrigin: `${centerX}% ${centerY}%`
    }
  };
}

export async function createUserDocument(user, additionalData = {}) {
  if (!user) return;
  
  const userRef = doc(db, "users", user.uid);
  const userDoc = await getDoc(userRef);
  
  if (!userDoc.exists()) {
    const { displayName, email, photoURL } = user;
    const createdAt = serverTimestamp();
    
    try {
      await setDoc(userRef, {
        displayName: displayName || "",
        email: email || "",
        photoURL: photoURL || "",
        createdAt,
        points: 0,
        level: 1,
        scansCount: 0,
        ...additionalData
      });
      console.log("User document created successfully");
    } catch (error) {
      console.error("Error creating user document:", error);
      throw error;
    }
  }
  
  return userRef;
}

// ✅ ADD: Missing createOrUpdateUser function that LoginPage.jsx is looking for
export async function createOrUpdateUser(user, additionalData = {}) {
  if (!user) return null;
  
  const userRef = doc(db, "users", user.uid);
  const userDoc = await getDoc(userRef);
  
  const { displayName, email, photoURL } = user;
  const userData = {
    displayName: displayName || "",
    email: email || "",
    photoURL: photoURL || "",
    lastLoginAt: serverTimestamp(),
    ...additionalData
  };

  if (!userDoc.exists()) {
    // Create new user
    userData.createdAt = serverTimestamp();
    userData.points = 0;
    userData.level = 1;
    userData.scansCount = 0;
    
    try {
      await setDoc(userRef, userData);
      console.log("New user document created successfully");
    } catch (error) {
      console.error("Error creating user document:", error);
      throw error;
    }
  } else {
    // Update existing user
    try {
      await updateDoc(userRef, userData);
      console.log("User document updated successfully");
    } catch (error) {
      console.error("Error updating user document:", error);
      throw error;
    }
  }
  
  return userRef;
}

export async function getUserData(userId) {
  if (!userId) {
    throw new Error("Missing userId");
  }

  try {
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      return { id: userDoc.id, ...userDoc.data() };
    } else {
      console.warn("User document not found");
      return null;
    }
  } catch (error) {
    console.error("Error getting user data:", error);
    throw error;
  }
}

export async function addPointsToUser(userId, pointsToAdd) {
  if (!userId || typeof pointsToAdd !== "number" || pointsToAdd <= 0) {
    throw new Error("Invalid userId or points value");
  }

  try {
    const userRef = doc(db, "users", userId);
    
    await updateDoc(userRef, {
      points: increment(pointsToAdd),
      scansCount: increment(1)
    });
    
    console.log(`Added ${pointsToAdd} points to user ${userId}`);
    return true;
  } catch (error) {
    console.error("Error adding points to user:", error);
    
    if (error.code === 'not-found') {
      throw new Error("User not found. Please ensure user document exists.");
    } else if (error.code === 'permission-denied') {
      throw new Error("Permission denied. Please check Firestore security rules.");
    } else {
      throw new Error(`Failed to add points: ${error.message}`);
    }
  }
}

export async function uploadScanImage(userId, imageBlob, metadata = {}) {
  if (!userId || !imageBlob) {
    throw new Error("Missing userId or imageBlob");
  }

  try {
    const timestamp = Date.now();
    const filename = `${timestamp}.jpeg`;
    const imagePath = `scans/${userId}/${filename}`;
    const imageRef = ref(storage, imagePath);
    
    const uploadMetadata = {
      contentType: 'image/jpeg',
      customMetadata: {
        userId: userId,
        uploadedAt: new Date().toISOString(),
        ...metadata
      }
    };
    
    console.log(`Uploading image: ${imagePath}`);
    const snapshot = await uploadBytes(imageRef, imageBlob, uploadMetadata);
    const url = await getDownloadURL(snapshot.ref);
    
    console.log(`Image uploaded successfully: ${url}`);
    return {
      url,
      path: imagePath,
      metadata: snapshot.metadata
    };
  } catch (error) {
    console.error("Error uploading image:", error);
    
    if (error.code === 'storage/unauthorized') {
      throw new Error("Unauthorized. Please check Firebase Storage security rules.");
    } else if (error.code === 'storage/quota-exceeded') {
      throw new Error("Storage quota exceeded. Please contact support.");
    } else {
      throw new Error(`Upload failed: ${error.message}`);
    }
  }
}

export async function saveScanToHistory(userId, scanData) {
  if (!userId || !scanData) {
    throw new Error("Missing userId or scanData");
  }

  if (!scanData.type || !['single', 'multiple'].includes(scanData.type)) {
    throw new Error("Invalid scan type. Must be 'single' or 'multiple'");
  }

  try {
    const scanRef = await addDoc(collection(db, "scanHistory"), {
      userId,
      ...scanData,
      createdAt: serverTimestamp()
    });

    console.log(`Saved scan to history with ID: ${scanRef.id}`);
    return scanRef.id;
  } catch (error) {
    console.error("Error saving scan to history:", error);
    
    if (error.code === 'permission-denied') {
      throw new Error("Permission denied. Please check Firestore security rules for scanHistory collection.");
    } else if (error.code === 'unauthenticated') {
      throw new Error("User not authenticated. Please log in again.");
    } else {
      throw new Error(`Failed to save scan: ${error.message}`);
    }
  }
}

export async function getUserScanHistory(userId, limitCount = 50) {
  if (!userId) {
    throw new Error("Missing userId");
  }

  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error("User not authenticated. Please log in.");
  }

  if (currentUser.uid !== userId) {
    throw new Error("Cannot access another user's scan history.");
  }

  try {
    const q = query(
      collection(db, "scanHistory"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc"),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    const scans = [];

    querySnapshot.forEach((doc) => {
      scans.push({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      });
    });

    console.log(`Retrieved ${scans.length} scans from history`);
    return scans;
  } catch (error) {
    console.error("Error getting scan history:", error);
    
    if (error.code === 'permission-denied') {
      throw new Error("Permission denied. Please check Firestore security rules for scanHistory collection.");
    } else if (error.code === 'unauthenticated') {
      throw new Error("User not authenticated. Please log in again.");
    } else if (error.code === 'failed-precondition') {
      throw new Error("Database index required. Please check Firestore console for index creation.");
    } else {
      throw new Error(`Failed to load scan history: ${error.message}`);
    }
  }
}

export { auth, db, storage };