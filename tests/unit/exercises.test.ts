/**
 * Exercises, schedules, sessions, Today's routine and device-local trackers (Checkpoint 2b).
 * FICTIONAL data only.
 */
import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { openRcrDb, type RcrDB } from '../../src/data/db';
import { ensureMeta } from '../../src/data/repositories/metaRepo';
import { createChild } from '../../src/data/repositories/childrenRepo';
import { createGoal, loadChildPersonal, type PersonalContext } from '../../src/data/repositories/personalRepo';
import {
  SlotTakenError, TrackerConflictError, changeSchedule, createExercise, discardTracker, getTracker, moveSession, recordSession, restoreSession, reverseSession,
  saveTracker, setPaused, updateExercise, type ExerciseInput, type ScheduleInput,
} from '../../src/data/repositories/exercisesRepo';
import { occurrencesBetween, routineFor, scheduledCountOn, versionOn, weekdayOf, withScheduleChange, describeRule } from '../../src/domain/schedule';
import { personalSummary } from '../../src/domain/personalProgress';
import type { Exercise, TrackerState } from '../../src/types';
import { SAMPLE_CHILD_A, SAMPLE_CHILD_B } from '../fixtures/children';

let db: RcrDB;
let ctx: PersonalContext;
let ctxB: PersonalContext;
let n = 0;
const MON = '2026-06-15'; // a Monday
const at = (today: string): PersonalContext => ({ ...ctx, today });
const input = (over: Partial<ExerciseInput> = {}): ExerciseInput => ({ title: 'Fictional exercise', appCategory: null, instructions: '', origin: 'parent', providerName: '', source: null, goalIds: [], tracking: { method: 'simple' }, ...over });
const daily = (perDay = 1, startDate = MON): ScheduleInput => ({ rule: { kind: 'daily' }, sessionsPerDay: perDay, startDate });

beforeEach(async () => {
  db = await openRcrDb(`ex-${++n}`);
  const { deviceId } = await ensureMeta(db);
  const a = await createChild(db, deviceId, SAMPLE_CHILD_A);
  const b = await createChild(db, deviceId, SAMPLE_CHILD_B);
  ctx = { deviceId, childId: a.id, dob: a.dob, today: MON };
  ctxB = { deviceId, childId: b.id, dob: b.dob, today: MON };
});
afterEach(() => db.close());

const load = () => loadChildPersonal(db, ctx.childId);
const routine = async (date = MON) => { const d = await load(); return routineFor(d.exercises, d.sessions, date); };

describe('schedule domain', () => {
  it('weekdays are computed without time-zone effects', () => {
    expect(weekdayOf('2026-06-15')).toBe(1);
    expect(weekdayOf('2024-02-29')).toBe(4);
    expect(weekdayOf('2026-03-08')).toBe(0); // a US daylight-saving change day
  });
  it('the version in force is the latest on or before the date; changes never rewrite earlier days', () => {
    const v1 = { effectiveFrom: '2026-06-01', rule: { kind: 'daily' as const }, sessionsPerDay: 2, paused: false };
    const s = withScheduleChange([v1], { effectiveFrom: '2026-06-15', rule: { kind: 'weekdays', days: [1, 3] }, sessionsPerDay: 1, paused: false });
    expect(versionOn(s, '2026-06-14')).toBe(v1);
    expect(versionOn(s, '2026-05-31')).toBeNull();
    const ex = { schedule: s, archivedAt: null } as unknown as Exercise;
    expect(scheduledCountOn(ex, '2026-06-14')).toBe(2); // Sunday, old rule
    expect(scheduledCountOn(ex, '2026-06-16')).toBe(0); // Tuesday, new rule
    expect(scheduledCountOn(ex, '2026-06-17')).toBe(1); // Wednesday
    // A second change on the same day replaces that day's version only.
    const s2 = withScheduleChange(s, { effectiveFrom: '2026-06-15', rule: { kind: 'daily' }, sessionsPerDay: 3, paused: false });
    expect(s2).toHaveLength(2);
    expect(occurrencesBetween({ schedule: s2, archivedAt: null }, '2026-06-14', '2026-06-15')).toHaveLength(5);
    expect(describeRule(versionOn(s, '2026-06-15'))).toBe('Mon Wed');
  });
  it('paused and archived exercises have nothing scheduled', () => {
    const v = { effectiveFrom: '2026-06-01', rule: { kind: 'daily' as const }, sessionsPerDay: 1, paused: true };
    expect(scheduledCountOn({ schedule: [v], archivedAt: null }, MON)).toBe(0);
    expect(scheduledCountOn({ schedule: [{ ...v, paused: false }], archivedAt: '2026-06-02T00:00:00Z' }, MON)).toBe(0);
  });
});

describe('exercise creation and schedules', () => {
  it('validates tracking targets, days and the 1–24 sessions limit (D16); start can’t be in the past', async () => {
    await expect(createExercise(db, ctx, input({ tracking: { method: 'stopwatch', targetSeconds: 0 } }), daily())).rejects.toThrow();
    await expect(createExercise(db, ctx, input({ tracking: { method: 'reps', targetReps: -1 } }), daily())).rejects.toThrow();
    await expect(createExercise(db, ctx, input(), { rule: { kind: 'weekdays', days: [] }, sessionsPerDay: 1, startDate: MON })).rejects.toThrow(/day/);
    await expect(createExercise(db, ctx, input(), daily(25))).rejects.toThrow(/24/);
    await expect(createExercise(db, ctx, input(), daily(1, '2026-06-14'))).rejects.toThrow(/today or later/);
    const ex = await createExercise(db, ctx, input({ tracking: { method: 'stopwatch', targetSeconds: null } }), daily(24));
    expect((await routine()).scheduledCount).toBe(24);
    expect(ex.tracking).toEqual({ method: 'stopwatch', targetSeconds: null });
  });

  it('a later start date schedules nothing before it', async () => {
    await createExercise(db, ctx, input(), daily(1, '2026-06-20'));
    expect((await routine()).scheduledCount).toBe(0);
    expect((await routine('2026-06-20')).scheduledCount).toBe(1);
  });

  it('as needed is never scheduled but can always be recorded', async () => {
    const ex = await createExercise(db, ctx, input(), { rule: { kind: 'asNeeded' }, sessionsPerDay: 1, startDate: MON });
    expect((await routine()).scheduledCount).toBe(0);
    await expect(recordSession(db, ctx, ex.id, { date: MON, slot: 'auto' })).rejects.toThrow(SlotTakenError);
    await recordSession(db, ctx, ex.id, { date: MON, slot: 'extra' });
    expect(personalSummary(await load(), MON).sessionsThisMonth).toBe(1);
  });

  it('provider exercises keep the provider name; recommended exercises keep provenance; goal links validated', async () => {
    const g = await createGoal(db, ctx, { title: 'Fictional goal', appCategory: null, description: '', startDate: MON, targetDate: null, milestoneDefId: null });
    const p = await createExercise(db, ctx, input({ origin: 'provider', providerName: 'Fictional therapist', goalIds: [g.id] }), daily());
    expect(p).toMatchObject({ origin: 'provider', providerName: 'Fictional therapist', goalIds: [g.id], source: null });
    await expect(createExercise(db, ctx, input({ goalIds: ['missing'] }), daily())).rejects.toThrow();
    const r = await createExercise(db, ctx, input({ origin: 'recommended', source: { activityId: 'cdc22-act-a004', sourceRecordId: 'cdc22-act-m2-07', contentVersion: 'v', instructionsEdited: false }, instructions: 'CDC words' }), daily());
    await updateExercise(db, ctx, r.id, input({ instructions: 'My own words' }));
    const after = (await load()).exercises.find((e) => e.id === r.id)!;
    expect(after.source).toMatchObject({ activityId: 'cdc22-act-a004', instructionsEdited: true });
    expect(after.origin).toBe('recommended');
  });
});

describe('sessions and Today’s routine', () => {
  it('fills slots in order, counts each once, never exceeds 100%, and additional sessions don’t inflate it', async () => {
    const ex = await createExercise(db, ctx, input(), daily(2));
    await recordSession(db, ctx, ex.id, { date: MON, slot: 'auto' });
    expect((await routine())).toMatchObject({ scheduledCount: 2, doneCount: 1 });
    await recordSession(db, ctx, ex.id, { date: MON, slot: 'auto' });
    await expect(recordSession(db, ctx, ex.id, { date: MON, slot: 'auto' })).rejects.toThrow(SlotTakenError);
    await recordSession(db, ctx, ex.id, { date: MON, slot: 'extra' });
    await recordSession(db, ctx, ex.id, { date: MON, slot: 'extra' });
    const r = await routine();
    expect(r).toMatchObject({ scheduledCount: 2, doneCount: 2 });
    expect(r.items[0]!.additional).toBe(2);
    expect(personalSummary(await load(), MON).sessionsThisMonth).toBe(4);
  });

  it('reversal frees the slot and updates the bar; recording again revives the same record; restore works', async () => {
    const ex = await createExercise(db, ctx, input(), daily(1));
    const s = await recordSession(db, ctx, ex.id, { date: MON, slot: 'auto' });
    await reverseSession(db, ctx, s.id);
    expect((await routine()).doneCount).toBe(0);
    const again = await recordSession(db, ctx, ex.id, { date: MON, slot: 'auto' });
    expect(again.id).toBe(s.id);
    expect((await routine()).doneCount).toBe(1);
    await reverseSession(db, ctx, s.id);
    await restoreSession(db, ctx, s.id);
    expect((await routine()).doneCount).toBe(1);
    expect((await load()).sessions).toHaveLength(1);
  });

  it('a repeated save with the same session id (double tap, retry, second copy) records one session', async () => {
    const ex = await createExercise(db, ctx, input(), daily(3));
    const a = await recordSession(db, ctx, ex.id, { date: MON, slot: 'auto', sessionId: 'fixed-id' });
    const b = await recordSession(db, ctx, ex.id, { date: MON, slot: 'auto', sessionId: 'fixed-id' });
    expect(b.id).toBe(a.id);
    const [x, y] = await Promise.allSettled([
      recordSession(db, ctx, ex.id, { date: MON, slot: { key: `${MON}#2` }, sessionId: 'one' }),
      recordSession(db, ctx, ex.id, { date: MON, slot: { key: `${MON}#2` }, sessionId: 'two' }),
    ]);
    expect([x.status, y.status].sort()).toEqual(['fulfilled', 'rejected']);
    expect((await routine()).doneCount).toBe(2);
  });

  it('schedule changes apply from today and never delete sessions already recorded today (D11)', async () => {
    const ex = await createExercise(db, at('2026-06-14'), input(), daily(3, '2026-06-14'));
    for (let i = 0; i < 3; i++) await recordSession(db, at(MON), ex.id, { date: MON, slot: 'auto' });
    await recordSession(db, at(MON), ex.id, { date: '2026-06-14', slot: 'auto' });
    await changeSchedule(db, ctx, ex.id, { rule: { kind: 'daily' }, sessionsPerDay: 1, startDate: MON });
    const r = await routine();
    expect(r).toMatchObject({ scheduledCount: 1, doneCount: 1 }); // never above 100%
    expect(r.items[0]!.additional).toBe(2); // the others are kept as additional sessions
    expect((await load()).sessions.filter((s) => !s.reversedAt)).toHaveLength(4);
    expect((await routine('2026-06-14'))).toMatchObject({ scheduledCount: 3, doneCount: 1 }); // yesterday unchanged
  });

  it('pause and resume take effect from today', async () => {
    const ex = await createExercise(db, at('2026-06-14'), input(), daily(1, '2026-06-14'));
    await setPaused(db, ctx, ex.id, true);
    expect((await routine()).scheduledCount).toBe(0);
    expect((await routine('2026-06-14')).scheduledCount).toBe(1);
    await setPaused(db, at('2026-06-17'), ex.id, false);
    expect((await routine('2026-06-16')).scheduledCount).toBe(0);
    expect((await routine('2026-06-17')).scheduledCount).toBe(1);
  });

  it('backdated sessions fill an open slot of that day if it was scheduled, otherwise are additional; future dates are refused', async () => {
    const ex = await createExercise(db, at('2026-06-10'), input(), daily(1, '2026-06-10'));
    await recordSession(db, ctx, ex.id, { date: '2026-06-11', slot: 'auto' });
    await expect(recordSession(db, ctx, ex.id, { date: '2026-06-09', slot: 'auto' })).rejects.toThrow(SlotTakenError); // not scheduled then
    await recordSession(db, ctx, ex.id, { date: '2026-06-09', slot: 'extra' });
    await expect(recordSession(db, ctx, ex.id, { date: '2026-06-16', slot: 'extra' })).rejects.toThrow(/future/);
    expect((await routine('2026-06-11')).doneCount).toBe(1);
    expect((await routine()).doneCount).toBe(0); // today unaffected
  });

  it('moving a session to another day reverses the original and links the corrected one', async () => {
    const ex = await createExercise(db, at('2026-06-10'), input({ tracking: { method: 'stopwatch', targetSeconds: null } }), daily(1, '2026-06-10'));
    const s = await recordSession(db, ctx, ex.id, { date: MON, slot: 'auto', durationSeconds: 90 });
    const moved = await moveSession(db, ctx, s.id, '2026-06-12', { durationSeconds: 95 });
    const d = await load();
    expect(d.sessions.find((x) => x.id === s.id)!.reversedAt).toBeTruthy();
    expect(moved).toMatchObject({ occurrenceDate: '2026-06-12', slotKey: '2026-06-12#1', durationSeconds: 95, correctsSessionId: s.id });
    expect((await routine()).doneCount).toBe(0);
    expect((await routine('2026-06-12')).doneCount).toBe(1);
  });

  it('stopwatch and counter sessions require their values; simple sessions store none', async () => {
    const sw = await createExercise(db, ctx, input({ tracking: { method: 'stopwatch', targetSeconds: 60 } }), daily(1));
    await expect(recordSession(db, ctx, sw.id, { date: MON, slot: 'auto' })).rejects.toThrow(/duration/);
    const s = await recordSession(db, ctx, sw.id, { date: MON, slot: 'auto', durationSeconds: 75 });
    expect(s).toMatchObject({ method: 'stopwatch', durationSeconds: 75, targetSnapshot: 60, reps: null });
    const reps = await createExercise(db, ctx, input({ tracking: { method: 'reps', targetReps: 10 } }), daily(1));
    await expect(recordSession(db, ctx, reps.id, { date: MON, slot: 'auto', reps: -1 })).rejects.toThrow();
    expect(await recordSession(db, ctx, reps.id, { date: MON, slot: 'auto', reps: 12 })).toMatchObject({ reps: 12, targetSnapshot: 10 });
  });

  it('a midnight transition starts a fresh day; history remains', async () => {
    const ex = await createExercise(db, ctx, input(), daily(1));
    await recordSession(db, ctx, ex.id, { date: MON, slot: 'auto' });
    expect((await routine(MON)).doneCount).toBe(1);
    expect((await routine('2026-06-16')).doneCount).toBe(0);
    expect((await load()).sessions).toHaveLength(1);
  });

  it('profile isolation: another child’s routine is unaffected', async () => {
    const ex = await createExercise(db, ctx, input(), daily(1));
    await recordSession(db, ctx, ex.id, { date: MON, slot: 'auto' });
    await expect(recordSession(db, ctxB, ex.id, { date: MON, slot: 'extra' })).rejects.toThrow();
    const dB = await loadChildPersonal(db, ctxB.childId);
    expect(routineFor(dB.exercises, dB.sessions, MON).scheduledCount).toBe(0);
  });
});

describe('device-local trackers', () => {
  const tracker = (exerciseId: string, over: Partial<TrackerState> = {}): Omit<TrackerState, 'rev' | 'updatedAt'> => ({
    id: `${exerciseId}|${MON}#1`, childId: ctx.childId, exerciseId, slotKey: `${MON}#1`, occurrenceDate: MON, method: 'stopwatch', running: true, accumulatedMs: 0, runningSinceEpochMs: 1000, count: 0, sessionId: 'tracker-session', ...over,
  });

  it('refuses a write based on an older revision (another open copy) instead of overwriting', async () => {
    const ex = await createExercise(db, ctx, input({ tracking: { method: 'stopwatch', targetSeconds: null } }), daily(1));
    const t1 = await saveTracker(db, tracker(ex.id), 0);
    await expect(saveTracker(db, tracker(ex.id), 0)).rejects.toThrow(TrackerConflictError); // second copy starting fresh
    const t2 = await saveTracker(db, tracker(ex.id, { running: false, accumulatedMs: 5000, runningSinceEpochMs: null }), t1.rev);
    await expect(saveTracker(db, tracker(ex.id, { accumulatedMs: 1 }), t1.rev)).rejects.toThrow(TrackerConflictError); // stale copy
    expect((await getTracker(db, t1.id))!.accumulatedMs).toBe(5000);
    expect(t2.rev).toBe(2);
  });

  it('saving removes the tracker atomically; a second save of the same tracker records nothing more', async () => {
    const ex = await createExercise(db, ctx, input({ tracking: { method: 'stopwatch', targetSeconds: null } }), daily(1));
    const t = await saveTracker(db, tracker(ex.id), 0);
    await recordSession(db, ctx, ex.id, { date: MON, slot: { key: t.slotKey }, durationSeconds: 30, sessionId: t.sessionId, trackerId: t.id, entry: 'live' });
    expect(await getTracker(db, t.id)).toBeUndefined();
    await recordSession(db, ctx, ex.id, { date: MON, slot: { key: t.slotKey }, durationSeconds: 30, sessionId: t.sessionId, trackerId: t.id, entry: 'live' });
    expect((await load()).sessions).toHaveLength(1);
    await expect(saveTracker(db, tracker(ex.id), 0)).rejects.toThrow(TrackerConflictError); // already saved in another copy
  });

  it('a failed save keeps the tracker (and its measured time) unchanged', async () => {
    const ex = await createExercise(db, ctx, input({ tracking: { method: 'stopwatch', targetSeconds: null } }), daily(1));
    const t = await saveTracker(db, tracker(ex.id, { running: false, accumulatedMs: 42_000, runningSinceEpochMs: null }), 0);
    await expect(recordSession(db, ctx, ex.id, { date: MON, slot: { key: t.slotKey }, durationSeconds: 999_999, sessionId: t.sessionId, trackerId: t.id })).rejects.toThrow();
    expect((await getTracker(db, t.id))!.accumulatedMs).toBe(42_000);
    await discardTracker(db, t.id);
    expect(await getTracker(db, t.id)).toBeUndefined();
  });
});
