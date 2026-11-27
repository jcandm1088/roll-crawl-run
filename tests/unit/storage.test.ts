import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { openRcrDb, type RcrDB } from '../../src/data/db';
import { runAtomic } from '../../src/data/transactions';
import { ensureMeta, getSettings, updateMeta, updateSettings } from '../../src/data/repositories/metaRepo';
import {
  NO_CORRECTED_AGE,
  countBackupsContainingChild,
  createChild,
  deleteChild,
  getChild,
  listChildren,
  setChildPhoto,
  updateChild,
} from '../../src/data/repositories/childrenRepo';
import { deleteAllData } from '../../src/data/storage';
import { SAMPLE_CHILD_A, SAMPLE_CHILD_B } from '../fixtures/children';

let db: RcrDB;
let dbName: string;
let counter = 0;

beforeEach(async () => {
  dbName = `test-db-${++counter}`;
  db = await openRcrDb(dbName);
});
afterEach(() => db.close());

describe('schema', () => {
  it('creates every planned store', () => {
    expect([...db.objectStoreNames].sort()).toEqual(
      [
        'backups', 'children', 'completions', 'customItems', 'eventCompletions', 'events', 'idAliases', 'journal',
        'mergeBases', 'meta', 'milestoneEvents', 'milestoneRecords', 'photos', 'referenceAnnotations', 'settings',
        'itemEvents', 'trackerState', // added in v3 (Checkpoint 2b)
      ].sort(),
    );
  });

  it('enforces one starter-milestone record per child and definition (logical key)', async () => {
    await db.put('milestoneRecords', { id: 'r1', childId: 'c1', milestoneDefId: 'cdc22-m02-x' });
    await expect(db.put('milestoneRecords', { id: 'r2', childId: 'c1', milestoneDefId: 'cdc22-m02-x' })).rejects.toThrow();
    // Different child → allowed. Custom records without a definition id are not constrained by that index.
    await db.put('milestoneRecords', { id: 'r3', childId: 'c2', milestoneDefId: 'cdc22-m02-x' });
    await db.put('milestoneRecords', { id: 'r4', childId: 'c1', customItemId: 'ci1' });
    await db.put('milestoneRecords', { id: 'r5', childId: 'c1', customItemId: 'ci2' });
    expect(await db.count('milestoneRecords')).toBe(4);
  });

  // Updated at Checkpoint 2b (schema v3, Decision D1): the logical key of an exercise session is
  // (item, slot), so one day can hold several scheduled sessions and additional sessions, while one
  // slot can still never be recorded twice. (Previously: one completion per item and date.)
  it('enforces one session per item and slot, allowing several sessions on one date', async () => {
    await db.put('completions', { id: 'a', childId: 'c1', customItemId: 'ex1', occurrenceDate: '2025-03-01', slotKey: '2025-03-01#1' });
    await db.put('completions', { id: 'b', childId: 'c1', customItemId: 'ex1', occurrenceDate: '2025-03-01', slotKey: '2025-03-01#2' });
    await db.put('completions', { id: 'x', childId: 'c1', customItemId: 'ex1', occurrenceDate: '2025-03-01', slotKey: 'extra:1' });
    await expect(db.put('completions', { id: 'c', childId: 'c1', customItemId: 'ex1', occurrenceDate: '2025-03-01', slotKey: '2025-03-01#1' })).rejects.toThrow();
    await db.put('eventCompletions', { id: 'a', childId: 'c1', eventId: 'e1', occurrenceDate: '2025-03-01' });
    await expect(db.put('eventCompletions', { id: 'b', childId: 'c1', eventId: 'e1', occurrenceDate: '2025-03-01' })).rejects.toThrow();
  });
});

describe('atomic transactions', () => {
  it('commits all writes together', async () => {
    await runAtomic(db, ['journal', 'events'], async (tx) => {
      await tx.objectStore('journal').put({ id: 'j1', childId: 'c1' });
      await tx.objectStore('events').put({ id: 'e1', childId: 'c1' });
    });
    expect(await db.count('journal')).toBe(1);
    expect(await db.count('events')).toBe(1);
  });

  it('rolls back every write when the work fails part-way', async () => {
    await db.put('journal', { id: 'existing', childId: 'c1', body: 'original' });
    await expect(
      runAtomic(db, ['journal', 'events'], async (tx) => {
        await tx.objectStore('journal').put({ id: 'existing', childId: 'c1', body: 'changed' });
        await tx.objectStore('events').put({ id: 'e1', childId: 'c1' });
        throw new Error('simulated failure');
      }),
    ).rejects.toThrow('simulated failure');
    expect((await db.get('journal', 'existing'))?.['body']).toBe('original');
    expect(await db.count('events')).toBe(0);
  });

  it('rolls back when a uniqueness constraint fails mid-transaction', async () => {
    await expect(
      runAtomic(db, ['milestoneRecords'], async (tx) => {
        await tx.objectStore('milestoneRecords').put({ id: 'r1', childId: 'c1', milestoneDefId: 'd1' });
        await tx.objectStore('milestoneRecords').put({ id: 'r2', childId: 'c1', milestoneDefId: 'd1' });
      }),
    ).rejects.toThrow();
    expect(await db.count('milestoneRecords')).toBe(0);
  });
});

describe('meta and settings', () => {
  it('creates a stable device id once', async () => {
    const a = await ensureMeta(db);
    const b = await ensureMeta(db);
    expect(a.deviceId).toMatch(/^[0-9a-f-]{36}$/);
    expect(b.deviceId).toBe(a.deviceId);
    expect(a.deviceLabel).toBe(''); // blank by default (Q8)
    expect(a.onboardingComplete).toBe(false);
  });

  it('persists onboarding completion', async () => {
    await ensureMeta(db);
    await updateMeta(db, { onboardingComplete: true });
    db.close();
    db = await openRcrDb(dbName);
    expect((await ensureMeta(db)).onboardingComplete).toBe(true);
  });

  it('defaults: Earth theme, notifications off, well-visit layer on, vaccine layer off with no source', async () => {
    const s = await getSettings(db);
    expect(s.theme).toBe('earth');
    expect(s.notificationsEnabled).toBe(false);
    expect(s.layers).toEqual({ personal: true, wellVisits: true, vaccines: false, therapy: true });
    expect(s.vaccineSchedule).toBeNull();
  });

  it('persists theme selection across reopen', async () => {
    await updateSettings(db, { theme: 'lavender' });
    db.close();
    db = await openRcrDb(dbName);
    expect((await getSettings(db)).theme).toBe('lavender');
  });

  it('falls back to Earth for an unknown stored theme', async () => {
    await db.put('settings', { ...(await getSettings(db)), theme: 'neon' as never });
    expect((await getSettings(db)).theme).toBe('earth');
  });
});

describe('child profiles', () => {
  it('creates, lists, and updates profiles with envelope metadata', async () => {
    const { deviceId } = await ensureMeta(db);
    const a = await createChild(db, deviceId, SAMPLE_CHILD_A);
    expect(a).toMatchObject({ name: 'Sample Child A', rev: 1, deletedAt: null, originDeviceId: deviceId, photoId: null });
    await new Promise((r) => setTimeout(r, 2)); // profiles created by a person are never in the same millisecond
    const b = await createChild(db, deviceId, SAMPLE_CHILD_B);
    expect(b.color).not.toBe(a.color);
    expect((await listChildren(db)).map((c) => c.id)).toEqual([a.id, b.id]);

    const updated = await updateChild(db, deviceId, a.id, { ...SAMPLE_CHILD_A, name: '  Sample A  ' });
    expect(updated.name).toBe('Sample A');
    expect(updated.rev).toBe(2);
    expect(updated.id).toBe(a.id);
  });

  it('stores blank names as null and forces chronological basis when corrected age is off', async () => {
    const { deviceId } = await ensureMeta(db);
    const c = await createChild(db, deviceId, { name: '   ', dob: '2025-01-01', about: '', correctedAge: NO_CORRECTED_AGE, ageBasis: 'corrected' });
    expect(c.name).toBeNull();
    expect(c.about).toBeNull();
    expect(c.ageBasis).toBe('chronological');
  });

  it('keeps each child’s records independent and deletes only the chosen child', async () => {
    const { deviceId } = await ensureMeta(db);
    const a = await createChild(db, deviceId, SAMPLE_CHILD_A);
    const b = await createChild(db, deviceId, SAMPLE_CHILD_B);
    await setChildPhoto(db, deviceId, a.id, { blob: new Blob(['fake-image']), width: 10, height: 10 });
    await db.put('journal', { id: 'ja', childId: a.id });
    await db.put('journal', { id: 'jb', childId: b.id });
    await db.put('milestoneRecords', { id: 'ma', childId: a.id, milestoneDefId: 'd1' });
    await db.put('milestoneRecords', { id: 'mb', childId: b.id, milestoneDefId: 'd1' });

    const result = await deleteChild(db, deviceId, a.id, { purgeFromBackups: true });
    expect(result.recordsRemoved).toBe(3); // photo, journal entry, milestone record

    expect(await getChild(db, a.id)).toBeUndefined();
    expect(await getChild(db, b.id)).toBeDefined();
    expect(await db.get('journal', 'jb')).toBeDefined();
    expect(await db.get('milestoneRecords', 'mb')).toBeDefined();
    expect(await db.count('photos')).toBe(0);

    // A tombstone without personal information remains.
    const tomb = await db.get('children', a.id);
    expect(tomb?.deletedAt).not.toBeNull();
    expect(tomb).not.toHaveProperty('name');
    expect(tomb).not.toHaveProperty('dob');
  });

  it('replaces a child photo atomically', async () => {
    const { deviceId } = await ensureMeta(db);
    const a = await createChild(db, deviceId, SAMPLE_CHILD_A);
    const first = await setChildPhoto(db, deviceId, a.id, { blob: new Blob(['1']), width: 1, height: 1 });
    const second = await setChildPhoto(db, deviceId, a.id, { blob: new Blob(['2']), width: 1, height: 1 });
    expect(second.photoId).not.toBe(first.photoId);
    expect(await db.count('photos')).toBe(1);
    const removed = await setChildPhoto(db, deviceId, a.id, null);
    expect(removed.photoId).toBeNull();
    expect(await db.count('photos')).toBe(0);
  });

  it('purges a deleted child from internal backups when chosen', async () => {
    const { deviceId } = await ensureMeta(db);
    const a = await createChild(db, deviceId, SAMPLE_CHILD_A);
    const b = await createChild(db, deviceId, SAMPLE_CHILD_B);
    await db.put('backups', { id: 'only-a', createdAt: 't', reason: 'test', childIds: [a.id], payload: { children: [{ id: a.id }] } });
    await db.put('backups', {
      id: 'both',
      createdAt: 't',
      reason: 'test',
      childIds: [a.id, b.id],
      payload: { children: [{ id: a.id }, { id: b.id }], journal: [{ id: 'x', childId: a.id }, { id: 'y', childId: b.id }] },
    });
    expect(await countBackupsContainingChild(db, a.id)).toBe(2);

    const result = await deleteChild(db, deviceId, a.id, { purgeFromBackups: true });
    expect(result).toMatchObject({ backupsDeleted: 1, backupsRewritten: 1 });
    expect(await db.get('backups', 'only-a')).toBeUndefined();
    const both = await db.get('backups', 'both');
    expect(both?.childIds).toEqual([b.id]);
    expect(JSON.stringify(both?.payload)).not.toContain(a.id);
  });

  it('leaves backups untouched when purge is not chosen', async () => {
    const { deviceId } = await ensureMeta(db);
    const a = await createChild(db, deviceId, SAMPLE_CHILD_A);
    await db.put('backups', { id: 'only-a', createdAt: 't', reason: 'test', childIds: [a.id], payload: {} });
    await deleteChild(db, deviceId, a.id, { purgeFromBackups: false });
    expect(await db.get('backups', 'only-a')).toBeDefined();
  });
});

describe('reset', () => {
  it('deletes all data', async () => {
    const { deviceId } = await ensureMeta(db);
    await createChild(db, deviceId, SAMPLE_CHILD_A);
    await deleteAllData(db, dbName);
    db = await openRcrDb(dbName);
    expect(await db.count('children')).toBe(0);
    expect(await db.get('meta', 'meta')).toBeUndefined();
  });
});
