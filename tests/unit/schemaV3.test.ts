/**
 * Schema version 3 (Checkpoint 2b, owner decision D1). FICTIONAL data only.
 * The migration is additive: every existing record is preserved byte-for-byte.
 */
import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it } from 'vitest';
import { openDB } from 'idb';
import { CHILD_SCOPED_STORES, DB_VERSION, openRcrDb, type RcrDB } from '../../src/data/db';
import { ensureMeta } from '../../src/data/repositories/metaRepo';
import { createChild, deleteChild } from '../../src/data/repositories/childrenRepo';
import { addObservation, loadChildMilestones, setStatus, createPersonalVersion } from '../../src/data/repositories/milestonesRepo';
import { currentProgress, type RecordState } from '../../src/domain/milestones';
import { recentProgressEvents } from '../../src/domain/milestoneHistory';
import { createGoal, accomplishGoal, loadChildPersonal } from '../../src/data/repositories/personalRepo';
import { createExercise, recordSession, saveTracker } from '../../src/data/repositories/exercisesRepo';
import { deleteAllData } from '../../src/data/storage';
import { SAMPLE_CHILD_A, SAMPLE_CHILD_B } from '../fixtures/children';

let n = 0;
const opened: RcrDB[] = [];
afterEach(() => opened.splice(0).forEach((d) => d.close()));
async function open(name: string, version?: number) {
  const d = await openRcrDb(name, version);
  opened.push(d);
  return d;
}

async function dumpAll(d: RcrDB): Promise<Record<string, unknown[]>> {
  const out: Record<string, unknown[]> = {};
  for (const s of [...d.objectStoreNames]) out[s] = await d.getAll(s as never);
  return out;
}

/** A version-2 database with realistic Checkpoint 2a data (two children, milestones, notes, a legacy personal entry). */
async function v2WithData(name: string) {
  const d = await openRcrDb(name, 2);
  const { deviceId } = await ensureMeta(d);
  const a = await createChild(d, deviceId, SAMPLE_CHILD_A);
  const b = await createChild(d, deviceId, SAMPLE_CHILD_B);
  const ctx = { deviceId, childId: a.id, dob: a.dob, today: '2026-06-01', ageBasis: { basis: 'chronological' as const, milestoneAgeMonths: 15 } };
  await setStatus(d, ctx, { kind: 'sourced', defId: 'cdc22-m02-se-01' }, 'achieved', '2025-04-10');
  await setStatus(d, ctx, { kind: 'sourced', defId: 'cdc22-m04-mp-01' }, 'emerging', '2025-06-01');
  await addObservation(d, ctx, { kind: 'sourced', defId: 'cdc22-m02-se-01' }, '2025-04-11', 'Fictional observation');
  await createPersonalVersion(d, ctx, { title: 'Fictional personal entry', description: '', derivedFromDefId: null, appCategory: 'cognitive', referenceAgeMonths: null });
  const before = await dumpAll(d);
  d.close();
  return { before, a, b, deviceId };
}

describe('schema version 3', () => {
  it('is the current version and creates the two new stores and the new session indexes', async () => {
    const d = await open(`v3-fresh-${++n}`);
    expect(DB_VERSION).toBe(3);
    expect(d.version).toBe(3);
    expect(d.objectStoreNames.contains('itemEvents')).toBe(true);
    expect(d.objectStoreNames.contains('trackerState')).toBe(true);
    const tx = d.transaction('completions');
    expect([...tx.store.indexNames].sort()).toEqual(['byChild', 'byChildAndDate', 'byItemAndSlot']);
    expect(tx.store.index('byItemAndSlot').unique).toBe(true);
    expect([...d.transaction('itemEvents').store.indexNames].sort()).toEqual(['byChild', 'byItem']);
  });

  it('upgrading a real v2 database keeps every existing record byte-identical', async () => {
    const name = `v3-up-${++n}`;
    const { before } = await v2WithData(name);
    const d = await open(name);
    expect(d.version).toBe(3);
    const after = await dumpAll(d);
    for (const store of Object.keys(before)) expect(after[store], store).toEqual(before[store]);
    expect(after['itemEvents']).toEqual([]);
    expect(after['trackerState']).toEqual([]);
  });

  it('existing milestone calculations and Recent milestones are unchanged after the upgrade and after adding goals and exercises', async () => {
    const name = `v3-calc-${++n}`;
    const { a, deviceId } = await v2WithData(name);
    const d = await open(name);
    const states = async () => {
      const data = await loadChildMilestones(d, a.id);
      const m = new Map<string, RecordState>();
      for (const r of data.records) if (r.milestoneDefId) m.set(r.milestoneDefId, { status: r.status, hidden: r.hidden });
      return { progress: currentProgress(15, m), recent: recentProgressEvents(data.events, 3).map((e) => e.id), personal: data.personal.length, events: data.events.length };
    };
    const first = await states();
    const pctx = { deviceId, childId: a.id, dob: a.dob, today: '2026-06-01' };
    const g = await createGoal(d, pctx, { title: 'Fictional goal', appCategory: null, description: '', startDate: '2026-05-01', targetDate: null, milestoneDefId: 'cdc22-m02-se-02' });
    await accomplishGoal(d, pctx, g.id, '2026-05-20');
    const ex = await createExercise(d, pctx, { title: 'Fictional exercise', appCategory: null, instructions: '', origin: 'parent', providerName: '', source: null, goalIds: [g.id], tracking: { method: 'simple' } }, { rule: { kind: 'daily' }, sessionsPerDay: 1, startDate: '2026-06-01' });
    await recordSession(d, pctx, ex.id, { date: '2026-06-01', slot: 'auto' });
    expect(await states()).toEqual(first);
    // Personal history went to itemEvents only; the linked milestone record was not created or changed.
    expect((await loadChildPersonal(d, a.id)).events.length).toBeGreaterThan(0);
    expect((await loadChildMilestones(d, a.id)).records.some((r) => r.milestoneDefId === 'cdc22-m02-se-02')).toBe(false);
  });

  it('a v1 database upgrades straight to v3', async () => {
    const name = `v3-from1-${++n}`;
    (await openRcrDb(name, 1)).close();
    const d = await open(name);
    expect(d.version).toBe(3);
    expect([...d.transaction('completions').store.indexNames].sort()).toEqual(['byChild', 'byChildAndDate', 'byItemAndSlot']);
  });

  it('a failed upgrade leaves the database at version 2 with its data (nothing is reset)', async () => {
    const name = `v3-fail-${++n}`;
    const { before } = await v2WithData(name);
    // Simulate a failure inside the version-change transaction of an upgrade.
    await expect(
      openDB(name, 3, {
        upgrade(db, _o, _n, tx) {
          tx.done.catch(() => undefined); // the aborted transaction's own rejection is expected
          db.createObjectStore('itemEvents', { keyPath: 'id' });
          throw new Error('simulated failure');
        },
      }),
    ).rejects.toThrow();
    const raw = await openDB(name);
    expect(raw.version).toBe(2);
    expect(raw.objectStoreNames.contains('itemEvents')).toBe(false);
    raw.close();
    const d = await open(name);
    const after = await dumpAll(d);
    for (const store of Object.keys(before)) expect(after[store], store).toEqual(before[store]);
  });

  it('an upgrade blocked by an open older connection reports it and continues once that copy closes', async () => {
    const name = `v3-blocked-${++n}`;
    (await openRcrDb(name, 2)).close(); // a real v2 database
    const old = await openDB(name, 2);
    // The older copy has no versionchange handler (like an old app tab), so it keeps the connection open.
    let blocked = 0;
    const pending = openRcrDb(name, 3, { onBlocked: () => blocked++ });
    await new Promise((r) => setTimeout(r, 50));
    expect(blocked).toBe(1);
    old.close();
    const d = await pending;
    opened.push(d);
    expect(d.version).toBe(3);
  });

  it('an open v3 copy closes itself when a newer version needs the database', async () => {
    const name = `v3-blocking-${++n}`;
    let superseded = 0;
    const d = await openRcrDb(name, 3, { onBlocking: () => superseded++ });
    const newer = await openDB(name, 4);
    expect(superseded).toBe(1);
    newer.close();
    d.close();
  });

  it('the new stores are child-scoped: profile deletion removes goals, history, sessions and trackers of that child only', async () => {
    const d = await open(`v3-del-${++n}`);
    expect(CHILD_SCOPED_STORES).toContain('itemEvents');
    expect(CHILD_SCOPED_STORES).toContain('trackerState');
    const { deviceId } = await ensureMeta(d);
    const a = await createChild(d, deviceId, SAMPLE_CHILD_A);
    const b = await createChild(d, deviceId, SAMPLE_CHILD_B);
    const today = '2026-06-01';
    for (const c of [a, b]) {
      const ctx = { deviceId, childId: c.id, dob: c.dob, today };
      await createGoal(d, ctx, { title: 'Fictional goal', appCategory: null, description: '', startDate: today, targetDate: null, milestoneDefId: null });
      const ex = await createExercise(d, ctx, { title: 'Fictional stopwatch', appCategory: null, instructions: '', origin: 'parent', providerName: '', source: null, goalIds: [], tracking: { method: 'stopwatch', targetSeconds: null } }, { rule: { kind: 'daily' }, sessionsPerDay: 2, startDate: today });
      await recordSession(d, ctx, ex.id, { date: today, slot: 'auto', durationSeconds: 60 });
      await saveTracker(d, { id: `${ex.id}|${today}#2`, childId: c.id, exerciseId: ex.id, slotKey: `${today}#2`, occurrenceDate: today, method: 'stopwatch', running: false, accumulatedMs: 5000, runningSinceEpochMs: null, count: 0, sessionId: 'fictional-session-id-' + c.id }, 0);
    }
    await deleteChild(d, deviceId, a.id, { purgeFromBackups: true });
    for (const store of ['customItems', 'itemEvents', 'completions', 'trackerState'] as const) {
      const rows = (await d.getAll(store)) as Array<{ childId: string }>;
      expect(rows.some((r) => r.childId === a.id), store).toBe(false);
      expect(rows.some((r) => r.childId === b.id), store).toBe(true);
    }
  });

  it('full reset removes the new stores too', async () => {
    const name = `v3-reset-${++n}`;
    const d = await openRcrDb(name);
    const { deviceId } = await ensureMeta(d);
    const a = await createChild(d, deviceId, SAMPLE_CHILD_A);
    await createGoal(d, { deviceId, childId: a.id, dob: a.dob, today: '2026-06-01' }, { title: 'Fictional goal', appCategory: null, description: '', startDate: '2026-06-01', targetDate: null, milestoneDefId: null });
    await deleteAllData(d, name);
    const fresh = await open(name);
    expect(await fresh.getAll('customItems')).toEqual([]);
    expect(await fresh.getAll('itemEvents')).toEqual([]);
  });
});
