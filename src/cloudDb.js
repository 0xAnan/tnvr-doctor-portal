import { initialCommittees } from './data/mockData';

const BASE_URL = "https://tnvr-a60d6-default-rtdb.europe-west1.firebasedatabase.app";
const OFFLINE_QUEUE_KEY = "tnvr_offline_sync_queue_v1";

export function generateUniqueId() {
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `cm-${Date.now()}-${randomStr}`;
}

export async function fetchCloudCommittees() {
  try {
    const response = await fetch(`${BASE_URL}/committees.json`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();

    if (!data) return [];

    let items = [];
    if (Array.isArray(data)) {
      items = data;
    } else if (typeof data === 'object') {
      items = Object.values(data);
    }

    return items.filter(item => item && typeof item === 'object' && item.id && item.title);
  } catch (err) {
    console.error("Failed to fetch from Firebase Cloud DB:", err);
  }
  return null;
}

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

export async function saveAllCommitteesToCloud(committeesArray) {
  try {
    // Delete all current records
    await fetchWithRetry(`${BASE_URL}/committees.json`, { method: 'DELETE' });

    for (const item of committeesArray) {
      await fetchWithRetry(`${BASE_URL}/committees/${item.id}.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item)
      });
    }

    await recordAuditLog({
      type: 'update',
      message: 'استرجاع جميع البيانات من ملف نسخة احتياطية',
      timestamp: new Date().toLocaleString('ar-EG'),
      user: 'طبيب بيطري'
    });
    return true;
  } catch (err) {
    console.error("Failed to save all committees to cloud:", err);
    return false;
  }
}

export async function upsertCommitteeInCloud(committeeData, isEdit = false) {
  const id = committeeData.id || generateUniqueId();
  const item = { ...committeeData, id };

  try {
    await fetchWithRetry(`${BASE_URL}/committees/${id}.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    });

    await recordAuditLog({
      type: isEdit ? 'update' : 'create',
      message: `${isEdit ? 'تعديل بيانات' : 'إضافة'} لجنة: ${item.title}`,
      timestamp: new Date().toLocaleString('ar-EG'),
      user: 'طبيب بيطري'
    });
  } catch (err) {
    console.error("Network error while upserting committee.", err);
    enqueueOfflineOperation({ type: 'upsert', item });
  }

  return await fetchCloudCommittees();
}

export async function moveToTrashBin(committeeItem) {
  try {
    await fetchWithRetry(`${BASE_URL}/committees/${committeeItem.id}.json`, {
      method: 'DELETE'
    });

    await fetchWithRetry(`${BASE_URL}/trashBin/${committeeItem.id}.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(committeeItem)
    });

    await recordAuditLog({
      type: 'delete',
      message: `نقل لجنة إلى سلة المحذوفات: ${committeeItem.title}`,
      timestamp: new Date().toLocaleString('ar-EG'),
      user: 'طبيب بيطري'
    });
  } catch (err) {
    console.error("Failed to move item to trash:", err);
  }

  return await fetchCloudCommittees();
}

export async function restoreFromTrashBin(committeeItem) {
  try {
    await fetchWithRetry(`${BASE_URL}/trashBin/${committeeItem.id}.json`, {
      method: 'DELETE'
    });

    await fetchWithRetry(`${BASE_URL}/committees/${committeeItem.id}.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(committeeItem)
    });

    await recordAuditLog({
      type: 'create',
      message: `استعادة لجنة من سلة المحذوفات: ${committeeItem.title}`,
      timestamp: new Date().toLocaleString('ar-EG'),
      user: 'طبيب بيطري'
    });
  } catch (err) {
    console.error("Failed to restore from trash:", err);
  }

  return await fetchCloudCommittees();
}

export async function deletePermanentlyFromTrash(id) {
  try {
    await fetchWithRetry(`${BASE_URL}/trashBin/${id}.json`, {
      method: 'DELETE'
    });
  } catch (err) {
    console.error("Failed to delete permanently:", err);
  }
}

export async function fetchTrashBin() {
  try {
    const response = await fetch(`${BASE_URL}/trashBin.json`);
    if (!response.ok) return [];
    const data = await response.json();
    if (!data) return [];
    const items = Array.isArray(data) ? data : Object.values(data);
    return items.filter(Boolean);
  } catch (err) {
    console.error("Failed to fetch trash bin:", err);
    return [];
  }
}

export async function fetchAuditLogs() {
  try {
    const response = await fetch(`${BASE_URL}/auditLogs.json`);
    if (!response.ok) return [];
    const data = await response.json();
    if (!data) return [];
    const items = Array.isArray(data) ? data : Object.values(data);
    return items.filter(Boolean).reverse();
  } catch (err) {
    console.error("Failed to fetch audit logs:", err);
    return [];
  }
}

export async function recordAuditLog(logEntry) {
  const id = `log-${Date.now()}`;
  try {
    await fetchWithRetry(`${BASE_URL}/auditLogs/${id}.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...logEntry, id })
    });
  } catch (err) {
    console.error("Failed to record audit log:", err);
  }
}

export async function resetCloudDBToDefault() {
  try {
    await fetchWithRetry(`${BASE_URL}/committees.json`, { method: 'DELETE' });

    for (const item of initialCommittees) {
      await fetchWithRetry(`${BASE_URL}/committees/${item.id}.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item)
      });
    }

    await recordAuditLog({
      type: 'update',
      message: 'إعادة تصفير قاعدة البيانات إلى السجلات الافتراضية',
      timestamp: new Date().toLocaleString('ar-EG'),
      user: 'طبيب بيطري'
    });
  } catch (err) {
    console.error("Failed to reset cloud database:", err);
  }

  return await fetchCloudCommittees();
}

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
        await moveToTrashBin({ id: op.id, title: 'لجنة محذوفة' });
      }
    }

    localStorage.removeItem(OFFLINE_QUEUE_KEY);
  } catch (e) {
    console.error("Error processing offline queue", e);
  }
}
