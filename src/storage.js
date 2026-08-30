const DB_KEY = 'tnvr_doctor_portal_db_v8';

/**
 * Load committees reliably from localStorage.
 * Returns [] if empty. Never forces mock items.
 */
export function loadCommittees() {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (err) {
    console.error("Error reading from localStorage:", err);
  }

  return [];
}

/**
 * Save committees synchronously to localStorage.
 */
export function saveCommittees(committeesList) {
  try {
    // Images are stored separately in Firebase and loaded only on demand.
    // Keeping base64 images out of localStorage avoids its small quota and
    // prevents an otherwise valid cloud save from looking like it failed.
    const summaries = committeesList.map(({ images, _preserveExistingImages, ...committee }) => {
      const generatedPreviews = Array.isArray(images)
        ? images.slice(0, 3).map(image => ({
            url: image.thumbnailUrl || (
              typeof image.url === 'string' && !image.url.startsWith('data:')
                ? image.url
                : null
            ),
            caption: image.caption || ''
          })).filter(image => image.url)
        : committee.imagePreviews || [];

      return {
        ...committee,
        imageCount: Array.isArray(images)
          ? images.length
          : Number(committee.imageCount) || 0,
        imagePreviews: generatedPreviews
      };
    });
    localStorage.setItem(DB_KEY, JSON.stringify(summaries));
  } catch (err) {
    console.error("Error saving to localStorage:", err);
  }
}

/**
 * Add or Update a committee
 */
export function upsertCommitteeInStorage(committeeData) {
  const current = loadCommittees();
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

  saveCommittees(updatedList);
  return updatedList;
}

/**
 * Delete a committee from storage
 */
export function deleteCommitteeFromStorage(id) {
  const current = loadCommittees();
  const updatedList = current.filter(item => item.id !== id);
  saveCommittees(updatedList);
  return updatedList;
}

/**
 * Reset storage back to sample data
 */
export async function resetStorageToDefault() {
  const { initialCommittees } = await import('./data/mockData');
  saveCommittees(initialCommittees);
  return initialCommittees;
}
