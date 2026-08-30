import {
  get,
  limitToLast,
  onChildAdded,
  onChildChanged,
  onChildRemoved,
  query,
  ref,
  update
} from 'firebase/database';
import { initialCommittees } from './data/mockData';
import { auth, db } from './firebaseClient';

const OFFLINE_QUEUE_KEY = 'tnvr_offline_sync_queue_v1';
const WRITE_TIMEOUT_MS = 8000;
const COMMITTEES_PATH = 'committeeSummaries';
const IMAGES_PATH = 'committeeImages';
const LEGACY_COMMITTEES_PATH = 'committees';

let offlineQueuePromise = null;

export function generateUniqueId() {
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `cm-${Date.now()}-${randomStr}`;
}

function objectToList(data) {
  if (!data) return [];

  const items = Array.isArray(data) ? data : Object.values(data);
  return items.filter(item => item && typeof item === 'object');
}

function splitCommittee(committee) {
  const hasImagePayload = Array.isArray(committee.images);
  const { images = [], _preserveExistingImages, ...summary } = committee;
  const existingPreviews = Array.isArray(summary.imagePreviews)
    ? summary.imagePreviews
    : [];
  const generatedPreviews = (Array.isArray(images) ? images : [])
    .slice(0, 3)
    .map(image => ({
      url: image.thumbnailUrl || (
        typeof image.url === 'string' && !image.url.startsWith('data:') ? image.url : null
      ),
      caption: image.caption || ''
    }))
    .filter(image => image.url);

  return {
    summary: {
      ...summary,
      imageCount: Array.isArray(images) ? images.length : Number(summary.imageCount) || 0,
      imagePreviews: hasImagePayload ? generatedPreviews : existingPreviews
    },
    images: Array.isArray(images) ? images : []
  };
}

function buildCommitteeChanges(committee) {
  const { summary, images } = splitCommittee(committee);
  const changes = { [`${COMMITTEES_PATH}/${summary.id}`]: summary };

  // Metadata can still be edited from the local cache during an outage. In
  // that case the full image list is unknown, so leave its cloud path intact.
  if (!committee._preserveExistingImages) {
    changes[`${IMAGES_PATH}/${summary.id}`] = images.length > 0 ? images : null;
  }

  return changes;
}

async function ensureCloudSchema() {
  const schemaSnapshot = await get(ref(db, 'schemaVersion'));
  if (Number(schemaSnapshot.val()) >= 2) return;

  const legacySnapshot = await get(ref(db, LEGACY_COMMITTEES_PATH));
  const legacyCommittees = objectToList(legacySnapshot.val()).filter(item => item.id);
  if (legacyCommittees.length === 0) return;

  const changes = { schemaVersion: 2 };
  legacyCommittees.forEach(committee => Object.assign(changes, buildCommitteeChanges(committee)));
  await applyAtomicUpdate(changes);
}

function createAuditLog(type, message) {
  const id = `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  return {
    id,
    type,
    message,
    timestamp: new Date().toLocaleString('ar-EG'),
    createdAt: Date.now(),
    user: auth.currentUser?.email || 'مستخدم معتمد'
  };
}

function withTimeout(operation, timeoutMs = WRITE_TIMEOUT_MS) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = globalThis.setTimeout(
      () => reject(new Error('Firebase write timed out')),
      timeoutMs
    );
  });

  return Promise.race([operation, timeout]).finally(() => globalThis.clearTimeout(timer));
}

async function applyAtomicUpdate(changes) {
  await withTimeout(update(ref(db), changes));
}

function emitCommittees(items, onDataChange) {
  onDataChange(
    Array.from(items.values()).filter(item => item.id && item.title)
  );
}

/**
 * Subscribe once, then receive only the committee that changed. The first
 * snapshot is buffered so the UI never renders a half-loaded collection.
 */
export function subscribeToCloudCommittees(onDataChange, onError = console.error) {
  const committeesRef = ref(db, COMMITTEES_PATH);
  const items = new Map();
  const bufferedEvents = [];
  let initialized = false;
  let active = true;

  const applyEvent = ({ type, key, value }) => {
    if (type === 'remove') {
      items.delete(key);
    } else if (value && typeof value === 'object') {
      items.set(key, { ...value, id: value.id || key });
    }
  };

  const receiveEvent = event => {
    if (!initialized) {
      bufferedEvents.push(event);
      return;
    }

    applyEvent(event);
    emitCommittees(items, onDataChange);
  };

  let stopAdded = () => {};
  let stopChanged = () => {};
  let stopRemoved = () => {};

  ensureCloudSchema()
    .then(() => {
      if (!active) return;

      stopAdded = onChildAdded(
        committeesRef,
        snapshot => receiveEvent({ type: 'upsert', key: snapshot.key, value: snapshot.val() }),
        onError
      );
      stopChanged = onChildChanged(
        committeesRef,
        snapshot => receiveEvent({ type: 'upsert', key: snapshot.key, value: snapshot.val() }),
        onError
      );
      stopRemoved = onChildRemoved(
        committeesRef,
        snapshot => receiveEvent({ type: 'remove', key: snapshot.key }),
        onError
      );

      return get(committeesRef);
    })
    .then(snapshot => {
      if (!active || !snapshot) return;

      objectToList(snapshot.val()).forEach(item => {
        if (item.id) items.set(item.id, item);
      });
      initialized = true;
      bufferedEvents.forEach(applyEvent);
      bufferedEvents.length = 0;
      emitCommittees(items, onDataChange);
    })
    .catch(onError);

  return () => {
    active = false;
    stopAdded();
    stopChanged();
    stopRemoved();
  };
}

export async function fetchCloudCommittees() {
  try {
    await ensureCloudSchema();
    const snapshot = await get(ref(db, COMMITTEES_PATH));
    return objectToList(snapshot.val()).filter(item => item.id && item.title);
  } catch (err) {
    console.error('Failed to fetch from Firebase Cloud DB:', err);
    return null;
  }
}

export async function fetchCommitteeImages(id, source = 'active') {
  try {
    return await readCommitteeImages(id, source);
  } catch (err) {
    console.error(`Failed to fetch images for committee ${id}:`, err);
    return null;
  }
}

async function readCommitteeImages(id, source = 'active') {
  const imagesPath = source === 'trash' ? 'trashBinImages' : IMAGES_PATH;
  const snapshot = await get(ref(db, `${imagesPath}/${id}`));
  return objectToList(snapshot.val());
}

export async function fetchAllCommitteesWithImages() {
  const committees = (await fetchCloudCommittees()) || [];
  return Promise.all(
    committees.map(async committee => ({
      ...committee,
      images: await readCommitteeImages(committee.id)
    }))
  );
}

export async function saveAllCommitteesToCloud(committeesArray) {
  const auditLog = createAuditLog('update', 'استرجاع جميع البيانات من ملف نسخة احتياطية');

  try {
    const summaries = {};
    const images = {};
    committeesArray.forEach(committee => {
      const split = splitCommittee(committee);
      summaries[split.summary.id] = split.summary;
      if (split.images.length > 0) images[split.summary.id] = split.images;
    });

    await applyAtomicUpdate({
      [COMMITTEES_PATH]: Object.keys(summaries).length > 0 ? summaries : null,
      [IMAGES_PATH]: Object.keys(images).length > 0 ? images : null,
      [`auditLogs/${auditLog.id}`]: auditLog
    });
    return true;
  } catch (err) {
    console.error('Failed to save all committees to cloud:', err);
    return false;
  }
}

export async function upsertCommitteeInCloud(committeeData, isEdit = false) {
  const id = committeeData.id || generateUniqueId();
  const item = { ...committeeData, id };
  const auditLog = createAuditLog(
    isEdit ? 'update' : 'create',
    `${isEdit ? 'تعديل بيانات' : 'إضافة'} لجنة: ${item.title}`
  );

  try {
    await applyAtomicUpdate({
      ...buildCommitteeChanges(item),
      [`auditLogs/${auditLog.id}`]: auditLog
    });
    return { ok: true, item };
  } catch (err) {
    console.error('Network error while upserting committee:', err);
    enqueueOfflineOperation({ type: 'upsert', item, isEdit });
    return { ok: false, queued: true, item };
  }
}

export async function moveToTrashBin(committeeItem) {
  const auditLog = createAuditLog(
    'delete',
    `نقل لجنة إلى سلة المحذوفات: ${committeeItem.title}`
  );

  try {
    const images = Array.isArray(committeeItem.images)
      ? committeeItem.images
      : await readCommitteeImages(committeeItem.id);
    const { summary } = splitCommittee({ ...committeeItem, images });

    await applyAtomicUpdate({
      [`${COMMITTEES_PATH}/${committeeItem.id}`]: null,
      [`${IMAGES_PATH}/${committeeItem.id}`]: null,
      [`trashBin/${committeeItem.id}`]: summary,
      [`trashBinImages/${committeeItem.id}`]: images.length > 0 ? images : null,
      [`auditLogs/${auditLog.id}`]: auditLog
    });
    return { ok: true };
  } catch (err) {
    console.error('Failed to move item to trash:', err);
    enqueueOfflineOperation({ type: 'trash', item: committeeItem });
    return { ok: false, queued: true };
  }
}

export async function restoreFromTrashBin(committeeItem) {
  const auditLog = createAuditLog(
    'create',
    `استعادة لجنة من سلة المحذوفات: ${committeeItem.title}`
  );

  try {
    const images = Array.isArray(committeeItem.images)
      ? committeeItem.images
      : await readCommitteeImages(committeeItem.id, 'trash');
    const restoredItem = { ...committeeItem, images };

    await applyAtomicUpdate({
      [`trashBin/${committeeItem.id}`]: null,
      [`trashBinImages/${committeeItem.id}`]: null,
      ...buildCommitteeChanges(restoredItem),
      [`auditLogs/${auditLog.id}`]: auditLog
    });
    return { ok: true };
  } catch (err) {
    console.error('Failed to restore from trash:', err);
    enqueueOfflineOperation({ type: 'restore', item: committeeItem });
    return { ok: false, queued: true };
  }
}

export async function deletePermanentlyFromTrash(id) {
  try {
    await applyAtomicUpdate({
      [`trashBin/${id}`]: null,
      [`trashBinImages/${id}`]: null
    });
    return true;
  } catch (err) {
    console.error('Failed to delete permanently:', err);
    return false;
  }
}

export async function fetchTrashBin() {
  try {
    const snapshot = await get(ref(db, 'trashBin'));
    return objectToList(snapshot.val());
  } catch (err) {
    console.error('Failed to fetch trash bin:', err);
    return [];
  }
}

export async function fetchAuditLogs() {
  try {
    const snapshot = await get(query(ref(db, 'auditLogs'), limitToLast(200)));
    return objectToList(snapshot.val()).sort(
      (a, b) => getAuditLogTime(b) - getAuditLogTime(a)
    );
  } catch (err) {
    console.error('Failed to fetch audit logs:', err);
    return [];
  }
}

function getAuditLogTime(log) {
  if (Number.isFinite(log.createdAt)) return log.createdAt;

  const timestampFromId = Number(String(log.id || '').split('-')[1]);
  return Number.isFinite(timestampFromId) ? timestampFromId : 0;
}

export async function recordAuditLog(logEntry) {
  const log = { ...createAuditLog(logEntry.type, logEntry.message), ...logEntry };

  try {
    await applyAtomicUpdate({ [`auditLogs/${log.id}`]: log });
    return true;
  } catch (err) {
    console.error('Failed to record audit log:', err);
    return false;
  }
}

export async function resetCloudDBToDefault() {
  const auditLog = createAuditLog(
    'update',
    'إعادة تصفير قاعدة البيانات إلى السجلات الافتراضية'
  );

  try {
    const summaries = {};
    const images = {};
    initialCommittees.forEach(committee => {
      const split = splitCommittee(committee);
      summaries[split.summary.id] = split.summary;
      if (split.images.length > 0) images[split.summary.id] = split.images;
    });

    await applyAtomicUpdate({
      [COMMITTEES_PATH]: summaries,
      [IMAGES_PATH]: Object.keys(images).length > 0 ? images : null,
      [`auditLogs/${auditLog.id}`]: auditLog
    });
    return true;
  } catch (err) {
    console.error('Failed to reset cloud database:', err);
    return false;
  }
}

function enqueueOfflineOperation(operation) {
  try {
    const queue = JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]');
    const operationKey = `${operation.type}:${operation.item?.id || operation.id || ''}`;
    const deduplicated = queue.filter(queued => {
      const queuedKey = `${queued.type}:${queued.item?.id || queued.id || ''}`;
      return queuedKey !== operationKey;
    });
    deduplicated.push(operation);
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(deduplicated));
  } catch (err) {
    console.error('Failed to enqueue offline operation:', err);
  }
}

async function replayOfflineOperation(operation) {
  if (operation.type === 'upsert' && operation.item) {
    const auditLog = createAuditLog(
      operation.isEdit ? 'update' : 'create',
      `${operation.isEdit ? 'تعديل بيانات' : 'إضافة'} لجنة: ${operation.item.title}`
    );
    await applyAtomicUpdate({
      ...buildCommitteeChanges(operation.item),
      [`auditLogs/${auditLog.id}`]: auditLog
    });
    return;
  }

  if (operation.type === 'trash' && operation.item) {
    const images = Array.isArray(operation.item.images)
      ? operation.item.images
      : await readCommitteeImages(operation.item.id);
    const { summary } = splitCommittee({ ...operation.item, images });
    await applyAtomicUpdate({
      [`${COMMITTEES_PATH}/${operation.item.id}`]: null,
      [`${IMAGES_PATH}/${operation.item.id}`]: null,
      [`trashBin/${operation.item.id}`]: summary,
      [`trashBinImages/${operation.item.id}`]: images.length > 0 ? images : null
    });
    return;
  }

  if (operation.type === 'restore' && operation.item) {
    const images = Array.isArray(operation.item.images)
      ? operation.item.images
      : await readCommitteeImages(operation.item.id, 'trash');
    await applyAtomicUpdate({
      [`trashBin/${operation.item.id}`]: null,
      [`trashBinImages/${operation.item.id}`]: null,
      ...buildCommitteeChanges({ ...operation.item, images })
    });
  }
}

export function processOfflineQueue() {
  if (offlineQueuePromise) return offlineQueuePromise;

  offlineQueuePromise = (async () => {
    try {
      const queue = JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]');
      if (!Array.isArray(queue) || queue.length === 0) return;

      const remaining = [];
      for (const operation of queue) {
        try {
          await replayOfflineOperation(operation);
        } catch (err) {
          console.error('Failed to replay offline operation:', err);
          remaining.push(operation);
        }
      }

      if (remaining.length > 0) {
        localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(remaining));
      } else {
        localStorage.removeItem(OFFLINE_QUEUE_KEY);
      }
    } catch (err) {
      console.error('Error processing offline queue:', err);
    } finally {
      offlineQueuePromise = null;
    }
  })();

  return offlineQueuePromise;
}
