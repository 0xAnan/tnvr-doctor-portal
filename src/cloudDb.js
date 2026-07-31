import { initialCommittees } from './data/mockData';

const FIREBASE_DB_URL = "https://tnvr-a60d6-default-rtdb.europe-west1.firebasedatabase.app/committees.json";

/**
 * Fetch committees array directly from the live Firebase Cloud DB
 */
export async function fetchCloudCommittees() {
  try {
    const response = await fetch(FIREBASE_DB_URL);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();

    if (data === null) {
      // If cloud DB is empty, seed with initial sample committees
      await saveAllCommitteesToCloud(initialCommittees);
      return initialCommittees;
    }

    if (Array.isArray(data)) {
      return data.filter(Boolean);
    } else if (typeof data === 'object') {
      return Object.values(data).filter(Boolean);
    }
  } catch (err) {
    console.error("Failed to fetch from Firebase Cloud DB:", err);
  }
  return null; // Return null if fetch failed (use local fallback)
}

/**
 * Overwrite entire array in Firebase Cloud DB
 */
export async function saveAllCommitteesToCloud(committeesArray) {
  try {
    const response = await fetch(FIREBASE_DB_URL, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(committeesArray)
    });
    return response.ok;
  } catch (err) {
    console.error("Failed to save to Firebase Cloud DB:", err);
    return false;
  }
}

/**
 * Save or Update a single committee in Firebase Cloud DB
 */
export async function upsertCommitteeInCloud(committeeData) {
  const current = (await fetchCloudCommittees()) || [];
  let updatedList;

  if (committeeData.id) {
    updatedList = current.map(item =>
      item.id === committeeData.id ? { ...item, ...committeeData } : item
    );
  } else {
    const newEntry = {
      ...committeeData,
      id: `cm-${Date.now().toString().slice(-4)}`
    };
    updatedList = [newEntry, ...current];
  }

  await saveAllCommitteesToCloud(updatedList);
  return updatedList;
}

/**
 * Delete a committee from Firebase Cloud DB
 */
export async function deleteCommitteeFromCloudDB(id) {
  const current = (await fetchCloudCommittees()) || [];
  const updatedList = current.filter(item => item.id !== id);
  await saveAllCommitteesToCloud(updatedList);
  return updatedList;
}

/**
 * Reset Firebase Cloud DB back to initial sample data
 */
export async function resetCloudDBToDefault() {
  await saveAllCommitteesToCloud(initialCommittees);
  return initialCommittees;
}
