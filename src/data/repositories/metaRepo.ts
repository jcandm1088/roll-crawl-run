import type { Meta, Settings } from '../../types';
import { DB_VERSION, type RcrDB } from '../db';
import { newId, nowIso } from '../envelope';
import { DEFAULT_THEME, getTheme, type ThemeId } from '../../ui/theme/themes';

export function defaultSettings(): Settings {
  return {
    id: 'settings',
    theme: DEFAULT_THEME,
    childThemes: {},
    activeChildId: null,
    layers: { personal: true, medical: true, vaccines: false, wellVisits: true, therapy: true },
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
  const themes: Record<string, ThemeId> = {};
  for (const [id, t] of Object.entries(stored.childThemes ?? {})) themes[id] = getTheme(t).id;
  merged.childThemes = themes;
  return merged;
}

/** The theme for a child on this device: its own choice, else the legacy app-wide theme. No child → Earth. */
export function themeForChild(settings: Settings, childId: string | null | undefined): ThemeId {
  if (!childId) return DEFAULT_THEME;
  return settings.childThemes[childId] ?? settings.theme ?? DEFAULT_THEME;
}

/** Changes ONE child's theme. Other children's themes are untouched. */
export async function setChildTheme(db: RcrDB, childId: string, theme: ThemeId): Promise<Settings> {
  const tx = db.transaction(['settings', 'children'], 'readwrite');
  const child = await tx.objectStore('children').get(childId);
  if (!child || child.deletedAt !== null) {
    tx.abort();
    await tx.done.catch(() => undefined);
    throw new Error('Child profile not found.');
  }
  const current = (await tx.objectStore('settings').get('settings')) ?? defaultSettings();
  const next: Settings = { ...defaultSettings(), ...current, childThemes: { ...(current.childThemes ?? {}), [childId]: getTheme(theme).id }, updatedAt: nowIso() };
  await tx.objectStore('settings').put(next);
  await tx.done;
  return getSettings(db);
}

export async function updateSettings(db: RcrDB, patch: Partial<Omit<Settings, 'id'>>): Promise<Settings> {
  const current = await getSettings(db);
  const next: Settings = { ...current, ...patch, id: 'settings', updatedAt: nowIso() };
  await db.put('settings', next);
  return next;
}
