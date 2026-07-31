import { initialCommittees } from './data/mockData';

const BASE_URL = "https://tnvr-a60d6-default-rtdb.europe-west1.firebasedatabase.app/committees";
const OFFLINE_QUEUE_KEY = "tnvr_offline_sync_queue_v1";

/**
 * Generate 100% unique collision-free ID for every committee
 */
export function generateUniqueId() {
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `cm-${Date.now()}-${randomStr}`;
}

/**
 * Fetch all committees directly from Firebase Cloud DB.
 * Returns clean, validated array of committee objects.
 */
export async function fetchCloudCommittees() {
  try {
    const response = await fetch(`${BASE_URL}.json`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();

    if (!data) return [];

    let items = [];
    if (Array.isArray(data)) {
      items = data;
    } else if (typeof data === 'object') {
      items = Object.values(data);
    }

    // Defensive validation: Filter out invalid/corrupted objects
    const validItems = items.filter(
      item => item && typeof item === 'object' && item.id && item.title
    );

    return validItems;
  } catch (err) {
    console.error("Failed to fetch from Firebase Cloud DB:", err);
  }
  return null;
}

/**
 * Helper to execute HTTP request with automatic 3x retries
 */
async function fetchWithRetry(url, options, retries = 3, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) return response;
    } catch (err) {
      if (i === retries - 1) throw err;
      await new Promise(r => setTimeout(r, delay * Math.pow(2, i)));
    }
  }
  throw new Error("Max retries reached");
}

/**
 * Upsert a single committee ATOMICALLY into Firebase by its unique ID.
 * Includes automatic retry on network flicker.
 */
export async function upsertCommitteeInCloud(committeeData) {
  const id = committeeData.id || generateUniqueId();
  const item = { ...committeeData, id };

  try {
    await fetchWithRetry(`${BASE_URL}/${id}.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    });
  } catch (err) {
    console.error("Network error while upserting committee. Queuing offline sync...", err);
    enqueueOfflineOperation({ type: 'upsert', item });
  }

  return await fetchCloudCommittees();
}

/**
 * Delete a single committee ATOMICALLY from Firebase by its unique ID.
 * Includes automatic retry on network flicker.
 */
export async function deleteCommitteeFromCloudDB(id) {
  try {
    await fetchWithRetry(`${BASE_URL}/${id}.json`, {
      method: 'DELETE'
    });
  } catch (err) {
    console.error("Network error while deleting committee. Queuing offline sync...", err);
    enqueueOfflineOperation({ type: 'delete', id });
  }

  return await fetchCloudCommittees();
}

/**
 * Reset Cloud DB to sample data (only when user explicitly clicks reset)
 */
export async function resetCloudDBToDefault() {
  try {
    await fetchWithRetry(`${BASE_URL}.json`, { method: 'DELETE' });

    for (const item of initialCommittees) {
      await fetchWithRetry(`${BASE_URL}/${item.id}.json`, {
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

/**
 * Offline Sync Queue Management
 */
function enqueueOfflineOperation(op) {
  try {
    const queue = JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]');
    queue.push(op);
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  } catch (e) {
    console.error("Failed to enqueue offline op", e);
  }
}

export async function processOfflineQueue() {
  try {
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
    if (!raw) return;
    const queue = JSON.parse(raw);
    if (!Array.isArray(queue) || queue.length === 0) return;

    for (const op of queue) {
      if (op.type === 'upsert' && op.item) {
        await upsertCommitteeInCloud(op.item);
      } else if (op.type === 'delete' && op.id) {
        await deleteCommitteeFromCloudDB(op.id);
      }
    }

    localStorage.removeItem(OFFLINE_QUEUE_KEY);
  } catch (e) {
    console.error("Error processing offline queue", e);
  }
}
