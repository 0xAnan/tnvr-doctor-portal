const BASE_URL = "https://tnvr-a60d6-default-rtdb.europe-west1.firebasedatabase.app/committees";

/**
 * Fetch all committees directly from Firebase Cloud DB.
 * Returns an array of objects. If empty, returns [].
 */
export async function fetchCloudCommittees() {
  try {
    const response = await fetch(`${BASE_URL}.json`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();

    if (!data) return [];

    if (Array.isArray(data)) {
      return data.filter(Boolean);
    }

    if (typeof data === 'object') {
      return Object.values(data).filter(Boolean);
    }
  } catch (err) {
    console.error("Failed to fetch from Firebase Cloud DB:", err);
  }
  return null;
}

/**
 * Upsert a single committee ATOMICALLY into Firebase by its unique ID.
 * This never touches or overwrites other committees in the database.
 */
export async function upsertCommitteeInCloud(committeeData) {
  const id = committeeData.id || `cm-${Date.now().toString().slice(-6)}`;
  const item = { ...committeeData, id };

  try {
    await fetch(`${BASE_URL}/${id}.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    });
  } catch (err) {
    console.error("Failed to save committee atomically to Firebase:", err);
  }

  return await fetchCloudCommittees();
}

/**
 * Delete a single committee ATOMICALLY from Firebase by its unique ID.
 */
export async function deleteCommitteeFromCloudDB(id) {
  try {
    await fetch(`${BASE_URL}/${id}.json`, {
      method: 'DELETE'
    });
  } catch (err) {
    console.error("Failed to delete committee from Firebase:", err);
  }

  return await fetchCloudCommittees();
}

/**
 * Reset Cloud DB to sample data (only when user explicitly clicks reset)
 */
export async function resetCloudDBToDefault() {
  try {
    // Delete all current records
    await fetch(`${BASE_URL}.json`, { method: 'DELETE' });

    const { initialCommittees } = await import('./data/mockData');
    for (const item of initialCommittees) {
      await fetch(`${BASE_URL}/${item.id}.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item)
      });
    }
  } catch (err) {
    console.error("Failed to reset cloud database:", err);
  }

  return await fetchCloudCommittees();
}
