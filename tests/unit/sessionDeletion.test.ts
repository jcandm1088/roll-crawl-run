/**
 * R-015 (Checkpoint 2b-R): deleting an exercise session. FICTIONAL data only.
 * A deleted session leaves no visible placeholder, stops counting everywhere, frees its scheduled slot,
 * keeps no note or measured value, can't be brought back by a stale copy, and never affects other
 * sessions, exercises or children. Database version 3 is unchanged.
 */
import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DB_VERSION, openRcrDb, type RcrDB } from '../../src/data/db';
import { ensureMeta } from '../../src/data/repositories/metaRepo';
import { createChild } from '../../src/data/repositories/childrenRepo';
import { loadChildPersonal, type PersonalContext } from '../../src/data/repositories/personalRepo';
import {
  createExercise, deleteSession, editSession, moveSession, recordSession, saveTracker, sessionTombstone, type ExerciseInput, type ScheduleInput,
} from '../../src/data/repositories/exercisesRepo';
import { routineFor } from '../../src/domain/schedule';
import { exercisesChart, personalSummary } from '../../src/domain/personalProgress';
import type { ExerciseSession, SessionTombstone } from '../../src/types';
import { SAMPLE_CHILD_A, SAMPLE_CHILD_B } from '../fixtures/children';

let db: RcrDB;
let ctx: PersonalContext;
let ctxB: PersonalContext;
let n = 0;
const MON = '2026-06-15';
const input = (over: Partial<ExerciseInput> = {}): ExerciseInput => ({ title: 'Fictional exercise', appCategory: null, instructions: '', origin: 'parent', providerName: '', source: null, goalIds: [], tracking: { method: 'simple' }, ...over });
const daily = (perDay = 1, startDate = MON): ScheduleInput => ({ rule: { kind: 'daily' }, sessionsPerDay: perDay, startDate });
/** An exercise scheduled daily from June 10 (created that day), so earlier days in these tests have slots. */
const EARLY = '2026-06-10';

beforeEach(async () => {
  db = await openRcrDb(`del-${++n}`);
  const { deviceId } = await ensureMeta(db);
  const a = await createChild(db, deviceId, SAMPLE_CHILD_A);
  const b = await createChild(db, deviceId, SAMPLE_CHILD_B);
  ctx = { deviceId, childId: a.id, dob: a.dob, today: MON };
  ctxB = { deviceId, childId: b.id, dob: b.dob, today: MON };
});
afterEach(() => db.close());

const load = (c = ctx) => loadChildPersonal(db, c.childId);
const raw = async (id: string) => (await db.get('completions', id)) as unknown as (ExerciseSession & Partial<SessionTombstone>) | undefined;

describe('R-015 deleting a session', () => {
  it('stays on database version 3', () => {
    expect(DB_VERSION).toBe(3);
  });

  it('removes the session from every list and total, and frees the scheduled slot', async () => {
    const ex = await createExercise(db, ctx, input(), daily(2));
    const s1 = await recordSession(db, ctx, ex.id, { date: MON, slot: 'auto' });
    await recordSession(db, ctx, ex.id, { date: MON, slot: 'auto' });
    let d = await load();
    expect(routineFor(d.exercises, d.sessions, MON).doneCount).toBe(2);
    await deleteSession(db, ctx, s1.id);
    d = await load();
    expect(d.sessions.map((s) => s.id)).not.toContain(s1.id); // not loaded at all: no placeholder possible
    const r = routineFor(d.exercises, d.sessions, MON);
    expect(r.doneCount).toBe(1); // Today's routine and the Home card use this same calculation
    expect(r.items[0]!.nextSlot).toBe(1);
    expect(personalSummary(d, MON).sessionsThisMonth).toBe(1);
    expect(exercisesChart(d.sessions, d.exercises, MON, ctx.dob, 6).buckets.at(-1)!.count).toBe(1);
    // The slot can be recorded again, as a NEW session (a deleted id is never revived).
    const again = await recordSession(db, ctx, ex.id, { date: MON, slot: 'auto' });
    expect(again.slotKey).toBe(`${MON}#1`);
    expect(again.id).not.toBe(s1.id);
    d = await load();
    expect(routineFor(d.exercises, d.sessions, MON).doneCount).toBe(2);
  });

  it('keeps no note or measured value; only a content-free tombstone with identity and lineage', async () => {
    const ex = await createExercise(db, ctx, input({ tracking: { method: 'stopwatch', targetSeconds: 60 } }), daily(1));
    const s = await recordSession(db, ctx, ex.id, { date: MON, slot: 'auto', durationSeconds: 125, note: 'Fictional private note', entry: 'live' });
    await deleteSession(db, ctx, s.id);
    const t = await raw(s.id);
    expect(t).toBeDefined();
    expect(t!.deletedAt).toBeTruthy();
    expect(t!.slotKey).toBe(`deleted:${s.id}`);
    expect(t!.deletedSlotKey).toBe(`${MON}#1`);
    expect(t!.customItemId).toBe(ex.id);
    expect(t!.rev).toBe(s.rev + 1);
    for (const k of ['note', 'durationSeconds', 'reps', 'targetSnapshot', 'method', 'entry']) expect(t).not.toHaveProperty(k);
    expect(JSON.stringify(t)).not.toContain('Fictional private note');
    // The history keeps a content-free marker only; no event ever carried the note or the duration.
    const events = (await load()).events.filter((e) => e.sessionId === s.id);
    expect(events.map((e) => e.type)).toEqual(['session-recorded', 'session-deleted']);
    expect(JSON.stringify(events)).not.toContain('Fictional private note');
    expect(JSON.stringify(events)).not.toContain('125');
  });

  it('a corrected-and-moved session: deleting the replacement also removes the earlier version’s note and values, never a live session', async () => {
    const ex = await createExercise(db, { ...ctx, today: EARLY }, input({ tracking: { method: 'reps', targetReps: null } }), daily(1, EARLY));
    const original = await recordSession(db, ctx, ex.id, { date: '2026-06-12', slot: 'auto', reps: 8, note: 'Fictional first note' });
    const other = await recordSession(db, ctx, ex.id, { date: '2026-06-13', slot: 'auto', reps: 3 });
    await editSession(db, ctx, original.id, { reps: 9 });
    const moved = await moveSession(db, ctx, original.id, MON, { reps: 10 });
    expect(moved.correctsSessionId).toBe(original.id);
    await deleteSession(db, ctx, moved.id);
    const a = await raw(original.id);
    const b = await raw(moved.id);
    expect(a!.deletedAt).toBeTruthy();
    expect(b!.deletedAt).toBeTruthy();
    expect(JSON.stringify([a, b])).not.toMatch(/Fictional first note|"reps"/);
    const d = await load();
    expect(d.sessions.map((s) => s.id)).toEqual([other.id]); // the unrelated session is untouched
    expect(d.sessions[0]!.reps).toBe(3);
    // Both freed slots can be recorded again.
    await recordSession(db, ctx, ex.id, { date: '2026-06-12', slot: 'auto', reps: 1 });
    await recordSession(db, ctx, ex.id, { date: MON, slot: 'auto', reps: 1 });
    expect((await load()).sessions).toHaveLength(3);
  });

  it('deleting an original that was moved back is safe: a revived (live) record is the one deleted, nothing else', async () => {
    const ex = await createExercise(db, { ...ctx, today: EARLY }, input(), daily(1, EARLY));
    const a = await recordSession(db, ctx, ex.id, { date: '2026-06-12', slot: 'auto' });
    const b = await moveSession(db, ctx, a.id, '2026-06-13');
    const back = await moveSession(db, ctx, b.id, '2026-06-12'); // revives A's record (same slot)
    expect(back.id).toBe(a.id);
    await deleteSession(db, ctx, back.id); // follows the lineage through the reversed B, and stops (no loop)
    expect((await load()).sessions).toHaveLength(0);
  });

  it('is idempotent and stays deleted: a second delete, a repeated save with the old id and a stale tracker can’t bring it back', async () => {
    const ex = await createExercise(db, ctx, input({ tracking: { method: 'reps', targetReps: null } }), daily(1));
    const s = await recordSession(db, ctx, ex.id, { date: MON, slot: 'auto', reps: 4, sessionId: 'fixed-session-id' });
    await deleteSession(db, ctx, s.id);
    await deleteSession(db, ctx, s.id);
    expect((await load()).sessions).toHaveLength(0);
    // An older copy retrying the same save gets a fresh session; the tombstone stays a tombstone.
    const retry = await recordSession(db, ctx, ex.id, { date: MON, slot: 'auto', reps: 4, sessionId: 'fixed-session-id' });
    expect(retry.id).not.toBe('fixed-session-id');
    expect((await raw('fixed-session-id'))!.deletedAt).toBeTruthy();
    // A stale tracker that still refers to the deleted id may continue (the session isn't live).
    await expect(saveTracker(db, { id: 't', childId: ctx.childId, exerciseId: ex.id, slotKey: 'extra:x', occurrenceDate: MON, method: 'reps', running: false, accumulatedMs: 0, runningSinceEpochMs: null, count: 1, sessionId: 'fixed-session-id' }, 0)).resolves.toBeTruthy();
  });

  it('a stale copy of the session is older than the tombstone (merge protection for Checkpoint 5)', async () => {
    const ex = await createExercise(db, ctx, input(), daily(1));
    const s = await recordSession(db, ctx, ex.id, { date: MON, slot: 'auto' });
    await deleteSession(db, ctx, s.id);
    const t = (await raw(s.id))!;
    expect(t.id).toBe(s.id); // same identity
    expect(t.rev).toBeGreaterThan(s.rev);
    expect(t.updatedAt >= s.updatedAt).toBe(true);
    expect(t.deletedSlotKey).toBe(s.slotKey); // recognisable by its logical key too
    const fresh = sessionTombstone(s, '2026-06-15T12:00:00.000Z', 'dev');
    expect(Object.keys(fresh).sort()).toEqual(['childId', 'createdAt', 'customItemId', 'deletedAt', 'deletedSlotKey', 'id', 'lastModifiedBy', 'occurrenceDate', 'originDeviceId', 'rev', 'reversedAt', 'slotKey', 'updatedAt']);
  });

  it('only the selected child’s session can be deleted; other children and exercises are unaffected', async () => {
    const exA = await createExercise(db, ctx, input(), daily(1));
    const exA2 = await createExercise(db, ctx, input({ title: 'Fictional other' }), daily(1));
    const exB = await createExercise(db, ctxB, input(), daily(1));
    const sA = await recordSession(db, ctx, exA.id, { date: MON, slot: 'auto' });
    const sA2 = await recordSession(db, ctx, exA2.id, { date: MON, slot: 'auto' });
    const sB = await recordSession(db, ctxB, exB.id, { date: MON, slot: 'auto' });
    await expect(deleteSession(db, ctx, sB.id)).rejects.toThrow(/not found/i);
    await deleteSession(db, ctx, sA.id);
    expect((await load()).sessions.map((s) => s.id)).toEqual([sA2.id]);
    expect((await load(ctxB)).sessions.map((s) => s.id)).toEqual([sB.id]);
  });
});
