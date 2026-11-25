import { DB_NAME, type RcrDB } from './db';

export type PersistenceStatus = 'persisted' | 'notPersisted' | 'unsupported';

/** Reports whether the browser has granted persistent storage. Never throws. */
export async function getPersistenceStatus(): Promise<PersistenceStatus> {
  try {
    if (!navigator.storage?.persisted) return 'unsupported';
    return (await navigator.storage.persisted()) ? 'persisted' : 'notPersisted';
  } catch {
    return 'unsupported';
  }
}

/**
 * Asks the browser to keep this app's data from automatic eviction.
 * Called only after a user action. Some browsers grant or deny silently;
 * the app works either way.
 */
export async function requestPersistence(): Promise<PersistenceStatus> {
  try {
    if (!navigator.storage?.persist) return 'unsupported';
    return (await navigator.storage.persist()) ? 'persisted' : 'notPersisted';
  } catch {
    return 'unsupported';
  }
}

export interface StorageEstimate {
  usageBytes: number | null;
  quotaBytes: number | null;
}

export async function getStorageEstimate(): Promise<StorageEstimate> {
  try {
    const e = await navigator.storage?.estimate?.();
    return { usageBytes: e?.usage ?? null, quotaBytes: e?.quota ?? null };
  } catch {
    return { usageBytes: null, quotaBytes: null };
  }
}

/** Permanently deletes ALL app data on this device (after explicit typed confirmation in the UI). */
export async function deleteAllData(db: RcrDB, name: string = DB_NAME): Promise<void> {
  db.close();
  await new Promise<void>((resolve, reject) => {
    const req = indexedDB.deleteDatabase(name);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
    req.onblocked = () => resolve(); // completes once other tabs close
  });
}
