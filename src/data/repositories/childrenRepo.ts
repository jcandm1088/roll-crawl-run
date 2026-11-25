import type { Child, ChildColor, ChildRecord, ChildTombstone, CorrectedAgeSettings, Photo } from '../../types';
import type { AgeBasis } from '../../domain/age';
import { CHILD_SCOPED_STORES, type RcrDB } from '../db';
import { newEnvelope, newId, nowIso, touch } from '../envelope';
import { runAtomic } from '../transactions';
import { CHILD_COLORS, DEFAULT_THEME, getTheme, type ThemeId } from '../../ui/theme/themes';
import { defaultSettings } from './metaRepo';

export interface ChildInput {
  name: string | null;
  dob: string;
  about: string | null;
  color?: ChildColor;
  /** Theme for this child on this device. New profiles default to Earth; omitted on edit = unchanged. */
  theme?: ThemeId;
  correctedAge: CorrectedAgeSettings;
  ageBasis: AgeBasis;
}

export const NO_CORRECTED_AGE: CorrectedAgeSettings = {
  enabled: false,
  inputMethod: 'dueDate',
  dueDate: null,
  gestationalWeeks: null,
  gestationalDays: null,
};

export function isActiveChild(record: ChildRecord | undefined): record is Child {
  return !!record && record.deletedAt === null;
}

function normalize(input: ChildInput): Omit<ChildInput, 'color' | 'theme'> {
  const name = input.name?.trim() || null;
  const about = input.about?.trim() || null;
  const correctedAge = input.correctedAge.enabled ? input.correctedAge : NO_CORRECTED_AGE;
  // Corrected-age basis is only meaningful when corrected age is enabled.
  const ageBasis: AgeBasis = correctedAge.enabled ? input.ageBasis : 'chronological';
  return { name, dob: input.dob, about, correctedAge, ageBasis };
}

export async function listChildren(db: RcrDB): Promise<Child[]> {
  const all = await db.getAll('children');
  // Oldest first; ties (same millisecond) broken by id so the order is always deterministic.
  return all.filter(isActiveChild).sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id));
}

export async function getChild(db: RcrDB, id: string): Promise<Child | undefined> {
  const r = await db.get('children', id);
  return isActiveChild(r) ? r : undefined;
}

function nextColor(existing: Child[]): ChildColor {
  const colors = Object.keys(CHILD_COLORS) as ChildColor[];
  const used = new Set(existing.map((c) => c.color));
  return colors.find((c) => !used.has(c)) ?? colors[existing.length % colors.length]!;
}

export async function createChild(db: RcrDB, deviceId: string, input: ChildInput): Promise<Child> {
  const existing = await listChildren(db);
  const child: Child = {
    ...newEnvelope(deviceId),
    deletedAt: null,
    ...normalize(input),
    color: input.color ?? nextColor(existing),
    photoId: null,
  };
  await runAtomic(db, ['children', 'settings'], async (tx) => {
    await tx.objectStore('children').put(child);
    await putChildTheme(tx.objectStore('settings'), child.id, input.theme ?? DEFAULT_THEME);
  });
  return child;
}

type SettingsStoreLike = { get(key: string): Promise<unknown>; put(value: never): Promise<unknown> };
async function putChildTheme(store: SettingsStoreLike, childId: string, theme: ThemeId): Promise<void> {
  const current = ((await store.get('settings')) as ReturnType<typeof defaultSettings> | undefined) ?? defaultSettings();
  await store.put({ ...defaultSettings(), ...current, childThemes: { ...(current.childThemes ?? {}), [childId]: getTheme(theme).id }, updatedAt: nowIso() } as never);
}

export async function updateChild(db: RcrDB, deviceId: string, id: string, input: ChildInput): Promise<Child> {
  const current = await getChild(db, id);
  if (!current) throw new Error('Child profile not found.');
  const next: Child = touch({ ...current, ...normalize(input), color: input.color ?? current.color }, deviceId);
  await db.put('children', next);
  return next;
}

/** Stores a (pre-resized) photo for a child, replacing any previous photo, atomically. */
export async function setChildPhoto(
  db: RcrDB,
  deviceId: string,
  childId: string,
  photo: { blob: Blob; width: number; height: number } | null,
): Promise<Child> {
  return runAtomic(db, ['children', 'photos'], async (tx) => {
    const childStore = tx.objectStore('children');
    const photoStore = tx.objectStore('photos');
    const current = await childStore.get(childId);
    if (!isActiveChild(current)) throw new Error('Child profile not found.');
    if (current.photoId) await photoStore.delete(current.photoId);
    let photoId: string | null = null;
    if (photo) {
      const record: Photo = { id: newId(), childId, blob: photo.blob, width: photo.width, height: photo.height, createdAt: nowIso() };
      await photoStore.put(record);
      photoId = record.id;
    }
    const next = touch({ ...current, photoId }, deviceId);
    await childStore.put(next);
    return next;
  });
}

export async function getPhoto(db: RcrDB, photoId: string): Promise<Photo | undefined> {
  return db.get('photos', photoId);
}

export async function countBackupsContainingChild(db: RcrDB, childId: string): Promise<number> {
  const backups = await db.getAll('backups');
  return backups.filter((b) => b.childIds.includes(childId)).length;
}

export interface DeleteChildOptions {
  /** Also remove this child's data from internal backup snapshots (Q10: checked by default in the UI). */
  purgeFromBackups: boolean;
}

export interface DeleteChildResult {
  recordsRemoved: number;
  backupsRewritten: number;
  backupsDeleted: number;
}

/**
 * Deletes a child profile and every record associated with it in a single
 * atomic transaction. The profile is replaced by a tombstone containing no
 * personal information, so a later partner import cannot silently
 * resurrect it.
 */
export async function deleteChild(db: RcrDB, deviceId: string, childId: string, options: DeleteChildOptions): Promise<DeleteChildResult> {
  return runAtomic(db, ['children', 'backups', 'settings', ...CHILD_SCOPED_STORES], async (tx) => {
    const childStore = tx.objectStore('children');
    const current = await childStore.get(childId);
    if (!isActiveChild(current)) throw new Error('Child profile not found.');

    let recordsRemoved = 0;
    for (const storeName of CHILD_SCOPED_STORES) {
      const index = tx.objectStore(storeName).index('byChild');
      let cursor = await index.openCursor(IDBKeyRange.only(childId));
      while (cursor) {
        await cursor.delete();
        recordsRemoved++;
        cursor = await cursor.continue();
      }
    }

    const tombstone: ChildTombstone = {
      id: current.id,
      createdAt: current.createdAt,
      originDeviceId: current.originDeviceId,
      updatedAt: nowIso(),
      deletedAt: nowIso(),
      rev: current.rev + 1,
      lastModifiedBy: deviceId,
    };
    await childStore.put(tombstone);

    // Remove the deleted child's theme preference (and stop it being the active child).
    const settingsStore = tx.objectStore('settings');
    const settings = await settingsStore.get('settings');
    if (settings) {
      const childThemes = { ...(settings.childThemes ?? {}) };
      delete childThemes[childId];
      await settingsStore.put({ ...settings, childThemes, activeChildId: settings.activeChildId === childId ? null : settings.activeChildId, updatedAt: nowIso() });
    }

    let backupsRewritten = 0;
    let backupsDeleted = 0;
    if (options.purgeFromBackups) {
      const backupStore = tx.objectStore('backups');
      for (const backup of await backupStore.getAll()) {
        if (!backup.childIds.includes(childId)) continue;
        const remaining = backup.childIds.filter((id) => id !== childId);
        if (remaining.length === 0) {
          await backupStore.delete(backup.id);
          backupsDeleted++;
          continue;
        }
        const payload: typeof backup.payload = {};
        for (const [store, rows] of Object.entries(backup.payload)) {
          payload[store] = rows.filter((row) => row['childId'] !== childId && !(store === 'children' && row['id'] === childId));
        }
        await backupStore.put({ ...backup, childIds: remaining, payload });
        backupsRewritten++;
      }
    }
    return { recordsRemoved, backupsRewritten, backupsDeleted };
  });
}

export type PhotoChange = { kind: 'keep' } | { kind: 'remove' } | { kind: 'set'; blob: Blob; width: number; height: number };

/**
 * Creates or updates a child profile AND its photo in ONE atomic transaction:
 * either the profile and photo are both saved, or nothing changes.
 *
 * `id` is generated once per form (not per attempt), so retrying a save —
 * e.g. after an error or a double tap — updates the same profile instead
 * of creating a duplicate.
 */
export async function saveChildProfile(
  db: RcrDB,
  deviceId: string,
  args: { id: string; input: ChildInput; photo: PhotoChange },
): Promise<Child> {
  const existingChildren = await listChildren(db);
  return runAtomic(db, ['children', 'photos', 'settings'], async (tx) => {
    const childStore = tx.objectStore('children');
    const photoStore = tx.objectStore('photos');
    const current = await childStore.get(args.id);
    if (current && current.deletedAt !== null) throw new Error('This profile was deleted and can’t be saved again.');
    // Theme: a new profile always gets an entry (Earth unless chosen); an edit changes it only if provided.
    if (!isActiveChild(current) || args.input.theme) await putChildTheme(tx.objectStore('settings'), args.id, args.input.theme ?? DEFAULT_THEME);

    let child: Child;
    if (isActiveChild(current)) {
      child = touch({ ...current, ...normalize(args.input), color: args.input.color ?? current.color }, deviceId);
    } else {
      child = {
        ...newEnvelope(deviceId),
        id: args.id,
        deletedAt: null,
        ...normalize(args.input),
        color: args.input.color ?? nextColor(existingChildren),
        photoId: null,
      };
    }

    if (args.photo.kind === 'set' || args.photo.kind === 'remove') {
      if (child.photoId) await photoStore.delete(child.photoId);
      child.photoId = null;
      if (args.photo.kind === 'set') {
        const record: Photo = { id: newId(), childId: child.id, blob: args.photo.blob, width: args.photo.width, height: args.photo.height, createdAt: nowIso() };
        await photoStore.put(record);
        child.photoId = record.id;
      }
    }
    await childStore.put(child);
    return child;
  });
}
