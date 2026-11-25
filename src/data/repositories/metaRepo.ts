import type { Meta, Settings } from '../../types';
import { DB_VERSION, type RcrDB } from '../db';
import { newId, nowIso } from '../envelope';
import { DEFAULT_THEME, getTheme, type ThemeId } from '../../ui/theme/themes';

export function defaultSettings(): Settings {
  return {
    id: 'settings',
    theme: DEFAULT_THEME,
    activeChildId: null,
    layers: { personal: true, wellVisits: true, vaccines: false, therapy: true },
    vaccineSchedule: null,
    notificationsEnabled: false,
    familyCalendar: false,
    updatedAt: nowIso(),
  };
}

/** Returns this install's metadata, creating it (with a new random deviceId) on first run. */
export async function ensureMeta(db: RcrDB): Promise<Meta> {
  const tx = db.transaction('meta', 'readwrite');
  const existing = await tx.store.get('meta');
  if (existing) {
    await tx.done;
    return existing;
  }
  const meta: Meta = {
    id: 'meta',
    schemaVersion: DB_VERSION,
    deviceId: newId(),
    deviceLabel: '',
    createdAt: nowIso(),
    onboardingComplete: false,
    lastBackupAt: null,
  };
  await tx.store.put(meta);
  await tx.done;
  return meta;
}

export async function updateMeta(db: RcrDB, patch: Partial<Omit<Meta, 'id' | 'deviceId'>>): Promise<Meta> {
  const meta = await ensureMeta(db);
  const next: Meta = { ...meta, ...patch };
  await db.put('meta', next);
  return next;
}

export async function getSettings(db: RcrDB): Promise<Settings> {
  const stored = await db.get('settings', 'settings');
  if (!stored) {
    const s = defaultSettings();
    await db.put('settings', s);
    return s;
  }
  // Tolerate missing fields from older data and unknown theme ids.
  const merged: Settings = { ...defaultSettings(), ...stored, layers: { ...defaultSettings().layers, ...stored.layers } };
  merged.theme = getTheme(merged.theme).id as ThemeId;
  return merged;
}

export async function updateSettings(db: RcrDB, patch: Partial<Omit<Settings, 'id'>>): Promise<Settings> {
  const current = await getSettings(db);
  const next: Settings = { ...current, ...patch, id: 'settings', updatedAt: nowIso() };
  await db.put('settings', next);
  return next;
}
