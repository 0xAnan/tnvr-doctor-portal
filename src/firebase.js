import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, set, remove, get } from 'firebase/database';
import { initialCommittees } from './data/mockData';

// Firebase Realtime Database Configuration
// Replace with your Firebase credentials if you have a custom Firebase project
const firebaseConfig = {
  apiKey: "AIzaSyD-demo-tnvr-doctor-portal-key",
  authDomain: "tnvr-doctor-portal.firebaseapp.com",
  databaseURL: "https://tnvr-doctor-portal-default-rtdb.firebaseio.com",
  projectId: "tnvr-doctor-portal",
  storageBucket: "tnvr-doctor-portal.appspot.com",
  messagingSenderId: "109876543210",
  appId: "1:109876543210:web:abcdef123456"
};

// Initialize Firebase
let db = null;
try {
  const app = initializeApp(firebaseConfig);
  db = getDatabase(app);
} catch (e) {
  console.warn("Firebase initialization warning (using local fallback mode):", e);
}

const DB_REF = 'committees';

/**
 * Subscribe to real-time updates from Firebase.
 * Whenever ANY user adds, edits, or removes a committee,
 * callback is invoked instantly across all devices.
 */
export function subscribeToCloudCommittees(onDataChange) {
  if (!db) {
    onDataChange(null);
    return () => {};
  }

  const committeesRef = ref(db, DB_REF);

  const unsubscribe = onValue(
    committeesRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        // Convert object values to array if stored as object map
        const list = Array.isArray(data)
          ? data.filter(Boolean)
          : Object.values(data);
        onDataChange(list);
      } else {
        // If empty in cloud, initialize with initial mock data
        initializeCloudData();
        onDataChange(initialCommittees);
      }
    },
    (error) => {
      console.error("Firebase database read error:", error);
      onDataChange(null);
    }
  );

  return unsubscribe;
}

/**
 * Seed initial sample data to cloud DB if empty
 */
export async function initializeCloudData() {
  if (!db) return;
  try {
    const committeesRef = ref(db, DB_REF);
    const snapshot = await get(committeesRef);
    if (!snapshot.exists()) {
      await set(committeesRef, initialCommittees);
    }
  } catch (e) {
    console.error("Error initializing cloud data:", e);
  }
}

/**
 * Save or Update a committee item in the Cloud DB
 */
export async function saveCommitteeToCloud(committee) {
  if (!db) return false;
  try {
    const itemRef = ref(db, `${DB_REF}/${committee.id}`);
    await set(itemRef, committee);
    return true;
  } catch (e) {
    console.error("Error saving to cloud database:", e);
    return false;
  }
}

/**
 * Delete a committee item from the Cloud DB
 */
export async function deleteCommitteeFromCloud(id) {
  if (!db) return false;
  try {
    const itemRef = ref(db, `${DB_REF}/${id}`);
    await remove(itemRef);
    return true;
  } catch (e) {
    console.error("Error deleting from cloud database:", e);
    return false;
  }
}

/**
 * Reset cloud database to sample initial committees
 */
export async function resetCloudDatabase() {
  if (!db) return false;
  try {
    const committeesRef = ref(db, DB_REF);
    await set(committeesRef, initialCommittees);
    return true;
  } catch (e) {
    console.error("Error resetting cloud database:", e);
    return false;
  }
}
