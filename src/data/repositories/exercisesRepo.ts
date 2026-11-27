/**
 * Exercises, schedules, sessions and device-local trackers (Checkpoint 2b).
 *
 * - Sessions live in `completions` with the logical key (customItemId, slotKey), enforced by a unique
 *   index, so one scheduled slot can never be filled twice — not even from two open copies of the app.
 * - A session is recorded only by an explicit parent action. Reaching a target never records anything.
 * - Reversal sets `reversedAt` (tombstoned state, plan R3 #3); recording the same slot again revives
 *   the same record, so its logical identity is stable. Moving a session to another date reverses the
 *   original and records a linked session (`correctsSessionId`).
 * - Deletion (R-015, the parent's “Delete session”) replaces the session, and the reversed earlier
 *   versions it was moved from, with content-free tombstones (`deletedAt`). The slot is free again.
 * - Tracker state (stopwatch/counter in progress) is device-local and revision-checked: a write based on
 *   an older revision is refused instead of silently overwriting newer state from another copy.
 * Nothing here changes a goal or a milestone.
 */
import type { Exercise, ExerciseOrigin, ExerciseSession, ExerciseSource, PersonalCategory, ScheduleRule, ScheduleVersion, SessionTombstone, TrackerState, Tracking } from '../../types';
import type { RcrDB } from '../db';
import { newEnvelope, newId, nowIso, touch } from '../envelope';
import { runAtomic, type RcrTx } from '../transactions';
import { compareDates } from '../../domain/dates';
import { MAX_SESSIONS_PER_DAY, openSlotOn, slotKeyFor, withScheduleChange, versionOn, currentOrNextVersion } from '../../domain/schedule';
import { ITEM_STORES, PersonalInputError, checkCategory, checkDate, cleanText, cleanTitle, getLiveItem, itemEvent, type ItemStores, type PersonalContext } from './personalRepo';

export class SlotTakenError extends PersonalInputError {}
export class TrackerConflictError extends Error {}

export const MAX_REPS = 9999;
export const MAX_TARGET_SECONDS = 24 * 3600;

export interface ScheduleInput {
  rule: ScheduleRule;
  sessionsPerDay: number;
  /** First day the schedule applies (today or later). */
  startDate: string;
}

export interface ExerciseInput {
  title: string;
  appCategory: PersonalCategory;
  instructions: string;
  origin: ExerciseOrigin;
  providerName: string;
  source: ExerciseSource | null;
  goalIds: string[];
  tracking: Tracking;
}

function checkTracking(t: Tracking): Tracking {
  if (t.method === 'simple') return { method: 'simple' };
  if (t.method === 'stopwatch') {
    const v = t.targetSeconds;
    if (v !== null && (!Number.isInteger(v) || v <= 0 || v > MAX_TARGET_SECONDS)) throw new PersonalInputError('Please enter a target time between 1 second and 24 hours, or leave it empty.');
    return { method: 'stopwatch', targetSeconds: v };
  }
  if (t.method === 'reps') {
    const v = t.targetReps;
    if (v !== null && (!Number.isInteger(v) || v <= 0 || v > MAX_REPS)) throw new PersonalInputError(`Please enter a target between 1 and ${MAX_REPS}, or leave it empty.`);
    return { method: 'reps', targetReps: v };
  }
  throw new PersonalInputError('Please choose how to track this exercise.');
}

function checkSchedule(ctx: PersonalContext, s: ScheduleInput): ScheduleVersion {
  checkDate(ctx, s.startDate, 'start date', true);
  if (compareDates(s.startDate, ctx.today) < 0) throw new PersonalInputError('A schedule can start today or later.');
  if (s.rule.kind === 'weekdays') {
    const days = [...new Set(s.rule.days)].filter((d) => Number.isInteger(d) && d >= 0 && d <= 6).sort();
    if (days.length === 0) throw new PersonalInputError('Please choose at least one day.');
    s = { ...s, rule: { kind: 'weekdays', days } };
  }
  const n = s.rule.kind === 'asNeeded' ? 1 : s.sessionsPerDay;
  if (!Number.isInteger(n) || n < 1 || n > MAX_SESSIONS_PER_DAY) throw new PersonalInputError(`Please choose between 1 and ${MAX_SESSIONS_PER_DAY} sessions a day.`);
  return { effectiveFrom: s.rule.kind === 'asNeeded' ? ctx.today : s.startDate, rule: s.rule, sessionsPerDay: n, paused: false };
}

function cleanExercise(input: ExerciseInput) {
  return {
    title: cleanTitle(input.title, 'a name'),
    appCategory: checkCategory(input.appCategory),
    instructions: cleanText(input.instructions),
    origin: input.origin,
    providerName: input.origin === 'provider' ? cleanText(input.providerName).slice(0, 120) : '',
    source: input.origin === 'recommended' ? input.source : null,
    goalIds: [...new Set(input.goalIds)],
    tracking: checkTracking(input.tracking),
  };
}

async function checkGoals(tx: RcrTx<ItemStores>, ctx: PersonalContext, goalIds: string[]) {
  for (const g of goalIds) await getLiveItem(tx, ctx, g, 'goal');
}

export async function createExercise(db: RcrDB, ctx: PersonalContext, input: ExerciseInput, schedule: ScheduleInput, id?: string, firstNote?: { date: string; text: string } | null): Promise<Exercise> {
  const v = cleanExercise(input);
  if (firstNote?.text.trim()) checkDate(ctx, firstNote.date, 'observation date');
  if (v.origin === 'recommended' && !v.source) throw new PersonalInputError('Missing activity source.');
  const version = checkSchedule(ctx, schedule);
  return runAtomic(db, ITEM_STORES, async (tx) => {
    if (id) {
      const existing = (await tx.objectStore('customItems').get(id)) as unknown as Exercise | undefined;
      if (existing) return existing;
    }
    await checkGoals(tx, ctx, v.goalIds);
    const ex: Exercise = {
      ...newEnvelope(ctx.deviceId),
      ...(id ? { id } : {}),
      childId: ctx.childId,
      kind: 'exercise',
      ...v,
      schedule: version.rule.kind === 'asNeeded' ? [] : [version],
      archivedAt: null,
    };
    await tx.objectStore('customItems').put(ex as never);
    await tx.objectStore('itemEvents').add(itemEvent(ctx, ex, 'created', { eventDate: ctx.today, text: ex.title }) as never);
    if (firstNote?.text.trim()) await tx.objectStore('itemEvents').add(itemEvent(ctx, ex, 'observation', { eventDate: firstNote.date, text: cleanText(firstNote.text) }) as never);
    return ex;
  });
}

/** True when a schedule form describes something different from the version in force (or pending). */
export function scheduleDiffers(current: ScheduleVersion | null, s: ScheduleInput, today: string): boolean {
  if (!current) return s.rule.kind !== 'asNeeded';
  if (s.rule.kind === 'asNeeded') return current.rule.kind !== 'asNeeded';
  const same = JSON.stringify(current.rule) === JSON.stringify(s.rule.kind === 'weekdays' ? { kind: 'weekdays', days: [...new Set(s.rule.days)].sort() } : s.rule);
  const start = compareDates(current.effectiveFrom, today) > 0 ? current.effectiveFrom : today;
  return !same || current.sessionsPerDay !== s.sessionsPerDay || start !== (compareDates(s.startDate, today) > 0 ? s.startDate : today);
}

/**
 * Edits details and tracking (future sessions only; recorded sessions keep their own method and values).
 * With `schedule`, a changed schedule is added as a new version from today (or its later start date),
 * in the same transaction. Sessions already recorded are never deleted or rewritten.
 */
export async function updateExercise(db: RcrDB, ctx: PersonalContext, id: string, input: ExerciseInput, schedule?: ScheduleInput): Promise<void> {
  const version = schedule ? checkSchedule(ctx, { ...schedule, startDate: compareDates(schedule.startDate, ctx.today) < 0 ? ctx.today : schedule.startDate }) : null;
  await runAtomic(db, ITEM_STORES, async (tx) => {
    const current = await getLiveItem(tx, ctx, id, 'exercise');
    const v = cleanExercise({ ...input, origin: current.origin, source: current.source });
    await checkGoals(tx, ctx, v.goalIds);
    const instructionsEdited = current.source ? current.source.instructionsEdited || v.instructions !== current.instructions : false;
    const before = currentOrNextVersion(current.schedule, ctx.today);
    const changeSchedule = version && schedule ? scheduleDiffers(before, schedule, ctx.today) : false;
    const nextSchedule = changeSchedule && version ? withScheduleChange(current.schedule, { ...version, paused: version.rule.kind === 'asNeeded' ? false : !!before?.paused }) : current.schedule;
    const next: Exercise = touch({ ...current, ...v, schedule: nextSchedule, source: current.source ? { ...current.source, instructionsEdited } : null }, ctx.deviceId);
    await tx.objectStore('customItems').put(next as never);
    await tx.objectStore('itemEvents').add(itemEvent(ctx, next, 'edited', { text: next.title }) as never);
    if (changeSchedule && version) await tx.objectStore('itemEvents').add(itemEvent(ctx, next, 'schedule-changed', { eventDate: version.effectiveFrom, text: JSON.stringify({ from: before, to: version }) }) as never);
  });
}

/** Changes the schedule from today (or a later start). Earlier days keep the schedule that applied then. */
export async function changeSchedule(db: RcrDB, ctx: PersonalContext, id: string, schedule: ScheduleInput): Promise<void> {
  const version = checkSchedule(ctx, schedule);
  await runAtomic(db, ITEM_STORES, async (tx) => {
    const current = await getLiveItem(tx, ctx, id, 'exercise');
    const before = currentOrNextVersion(current.schedule, ctx.today);
    const next = touch({ ...current, schedule: withScheduleChange(current.schedule, version) }, ctx.deviceId);
    await tx.objectStore('customItems').put(next as never);
    await tx.objectStore('itemEvents').add(itemEvent(ctx, next, 'schedule-changed', { eventDate: version.effectiveFrom, text: JSON.stringify({ from: before, to: version }) }) as never);
  });
}

/** Pause (no scheduled sessions from today) or resume (the earlier rule again, from today). */
export async function setPaused(db: RcrDB, ctx: PersonalContext, id: string, paused: boolean): Promise<void> {
  await runAtomic(db, ITEM_STORES, async (tx) => {
    const current = await getLiveItem(tx, ctx, id, 'exercise');
    const v = currentOrNextVersion(current.schedule, ctx.today);
    if (!v || v.rule.kind === 'asNeeded' || v.paused === paused) return;
    const change: ScheduleVersion = { ...v, effectiveFrom: compareDates(v.effectiveFrom, ctx.today) > 0 ? v.effectiveFrom : ctx.today, paused };
    const next = touch({ ...current, schedule: withScheduleChange(current.schedule, change) }, ctx.deviceId);
    await tx.objectStore('customItems').put(next as never);
    await tx.objectStore('itemEvents').add(itemEvent(ctx, next, 'schedule-changed', { eventDate: change.effectiveFrom, text: JSON.stringify({ from: v, to: change }), toStatus: paused ? 'paused' : 'resumed' }) as never);
  });
}

// ---------------------------------------------------------------------------
// Sessions
// ---------------------------------------------------------------------------

export interface SessionInput {
  date: string;
  /** 'auto': the first open scheduled slot of that date (error if none); 'extra': an additional session; or an explicit slot key. */
  slot: 'auto' | 'extra' | { key: string };
  durationSeconds?: number | null;
  reps?: number | null;
  note?: string;
  entry?: 'live' | 'manual';
  /** Pre-generated id: a repeated save returns the existing session instead of creating another. */
  sessionId?: string;
  /** Remove this device-local tracker in the same transaction. */
  trackerId?: string;
  correctsSessionId?: string;
}

function checkValues(ex: Exercise, input: SessionInput) {
  const d = input.durationSeconds ?? null;
  const r = input.reps ?? null;
  if (d !== null && (!Number.isInteger(d) || d < 0 || d > MAX_TARGET_SECONDS)) throw new PersonalInputError('Please enter a duration up to 24 hours.');
  if (r !== null && (!Number.isInteger(r) || r < 0 || r > MAX_REPS)) throw new PersonalInputError(`Please enter a count between 0 and ${MAX_REPS}.`);
  if (ex.tracking.method === 'stopwatch' && d === null) throw new PersonalInputError('Please enter the duration.');
  if (ex.tracking.method === 'reps' && r === null) throw new PersonalInputError('Please enter the count.');
}

async function sessionsOf(tx: RcrTx<ItemStores>, ctx: PersonalContext, exerciseId: string): Promise<ExerciseSession[]> {
  return ((await tx.objectStore('completions').index('byChild').getAll(IDBKeyRange.only(ctx.childId))) as unknown as ExerciseSession[]).filter((s) => s.customItemId === exerciseId && s.deletedAt === null);
}

/** Records one session (explicit parent action). Atomic with its history entry and tracker removal. */
export async function recordSession(db: RcrDB, ctx: PersonalContext, exerciseId: string, input: SessionInput): Promise<ExerciseSession> {
  checkDate(ctx, input.date, 'session date');
  const note = cleanText(input.note ?? '');
  return runAtomic(db, ITEM_STORES, async (tx) => {
    const ex = await getLiveItem(tx, ctx, exerciseId, 'exercise');
    checkValues(ex, input);
    const store = tx.objectStore('completions');
    let reuseId = !!input.sessionId;
    if (input.sessionId) {
      const existing = (await store.get(input.sessionId)) as unknown as ExerciseSession | undefined;
      if (existing && existing.deletedAt === null && existing.reversedAt === null) return existing; // saved already (double tap, retry or another copy)
      if (existing && existing.deletedAt !== null) reuseId = false; // a deleted session's id is never brought back
    }
    const mine = await sessionsOf(tx, ctx, exerciseId);
    let slotKey: string;
    if (input.slot === 'extra') slotKey = `extra:${newId()}`;
    else if (input.slot === 'auto') {
      const n = openSlotOn(ex, mine, input.date);
      if (n === null) throw new SlotTakenError('All scheduled sessions for that day are already recorded.');
      slotKey = slotKeyFor(input.date, n);
    } else slotKey = input.slot.key;
    if (!slotKey.startsWith('extra:') && !slotKey.startsWith(`${input.date}#`)) throw new PersonalInputError('That session doesn’t belong to this date.');
    const occupant = mine.find((s) => s.slotKey === slotKey);
    if (occupant && occupant.reversedAt === null) throw new SlotTakenError('That session has already been recorded.');
    const target = ex.tracking.method === 'stopwatch' ? ex.tracking.targetSeconds : ex.tracking.method === 'reps' ? ex.tracking.targetReps : null;
    const fields = {
      method: ex.tracking.method,
      durationSeconds: ex.tracking.method === 'stopwatch' ? input.durationSeconds ?? null : null,
      reps: ex.tracking.method === 'reps' ? input.reps ?? null : null,
      targetSnapshot: target,
      note,
      entry: input.entry ?? 'manual',
      reversedAt: null,
      ...(input.correctsSessionId ? { correctsSessionId: input.correctsSessionId } : {}),
    } as const;
    let session: ExerciseSession;
    if (occupant) {
      // The slot was recorded before and then reversed: revive the same record (stable logical key).
      session = touch({ ...occupant, ...fields }, ctx.deviceId);
    } else {
      session = { ...newEnvelope(ctx.deviceId), ...(reuseId && input.sessionId ? { id: input.sessionId } : {}), childId: ctx.childId, customItemId: exerciseId, occurrenceDate: input.date, slotKey, ...fields };
    }
    await store.put(session as never);
    await tx.objectStore('itemEvents').add(itemEvent(ctx, ex, 'session-recorded', { eventDate: input.date, sessionId: session.id }) as never);
    if (input.trackerId) await tx.objectStore('trackerState').delete(input.trackerId);
    return session;
  });
}

/** Removes a session (it no longer counts). The record keeps its identity so it can't be resurrected by an older copy. */
export async function reverseSession(db: RcrDB, ctx: PersonalContext, sessionId: string): Promise<void> {
  await runAtomic(db, ITEM_STORES, async (tx) => {
    const store = tx.objectStore('completions');
    const s = (await store.get(sessionId)) as unknown as ExerciseSession | undefined;
    if (!s || s.childId !== ctx.childId || s.deletedAt !== null) throw new PersonalInputError('Session not found.');
    if (s.reversedAt) return;
    const ex = await getLiveItem(tx, ctx, s.customItemId, 'exercise');
    await store.put(touch({ ...s, reversedAt: nowIso() }, ctx.deviceId) as never);
    await tx.objectStore('itemEvents').add(itemEvent(ctx, ex, 'session-reversed', { eventDate: s.occurrenceDate, sessionId }) as never);
  });
}

/** The content-free remainder of a deleted session (see SessionTombstone). */
export function sessionTombstone(s: ExerciseSession, now: string, deviceId: string): SessionTombstone {
  return {
    id: s.id,
    createdAt: s.createdAt,
    originDeviceId: s.originDeviceId,
    updatedAt: now,
    deletedAt: now,
    rev: s.rev + 1,
    lastModifiedBy: deviceId,
    childId: s.childId,
    customItemId: s.customItemId,
    occurrenceDate: s.occurrenceDate,
    slotKey: `deleted:${s.id}`,
    deletedSlotKey: s.slotKey,
    reversedAt: s.reversedAt ?? now,
    ...(s.correctsSessionId ? { correctsSessionId: s.correctsSessionId } : {}),
  };
}

/**
 * Deletes a session (R-015). It no longer appears anywhere or counts in any total, and its scheduled
 * slot can be recorded again. The note and values are not kept: the session and the reversed earlier
 * versions it was moved or corrected from become tombstones. A live session is never touched, so a
 * valid replacement can't be erased by deleting something else. Deleting twice does nothing.
 */
export async function deleteSession(db: RcrDB, ctx: PersonalContext, sessionId: string): Promise<void> {
  await runAtomic(db, ITEM_STORES, async (tx) => {
    const store = tx.objectStore('completions');
    const s = (await store.get(sessionId)) as unknown as ExerciseSession | undefined;
    if (!s || s.childId !== ctx.childId) throw new PersonalInputError('Session not found.');
    if (s.deletedAt !== null) return;
    const ex = await getLiveItem(tx, ctx, s.customItemId, 'exercise');
    const now = nowIso();
    const chain: ExerciseSession[] = [s];
    const seen = new Set([s.id]);
    for (let prev = s.correctsSessionId; prev && !seen.has(prev);) {
      seen.add(prev);
      const p = (await store.get(prev)) as unknown as ExerciseSession | undefined;
      if (!p || p.childId !== ctx.childId || p.customItemId !== s.customItemId || p.deletedAt !== null || p.reversedAt === null) break;
      chain.push(p);
      prev = p.correctsSessionId;
    }
    for (const x of chain) await store.put(sessionTombstone(x, now, ctx.deviceId) as never);
    await tx.objectStore('itemEvents').add(itemEvent(ctx, ex, 'session-deleted', { eventDate: s.occurrenceDate, sessionId: s.id }) as never);
  });
}

/** Undo of a reversal (the slot is free: nothing else can have taken it, the logical key is unique). */
export async function restoreSession(db: RcrDB, ctx: PersonalContext, sessionId: string): Promise<void> {
  await runAtomic(db, ITEM_STORES, async (tx) => {
    const store = tx.objectStore('completions');
    const s = (await store.get(sessionId)) as unknown as ExerciseSession | undefined;
    if (!s || s.childId !== ctx.childId || s.deletedAt !== null) throw new PersonalInputError('Session not found.');
    if (!s.reversedAt) return;
    const ex = await getLiveItem(tx, ctx, s.customItemId, 'exercise');
    await store.put(touch({ ...s, reversedAt: null }, ctx.deviceId) as never);
    await tx.objectStore('itemEvents').add(itemEvent(ctx, ex, 'session-recorded', { eventDate: s.occurrenceDate, sessionId, text: 'restored' }) as never);
  });
}

/** Corrects a session's duration, count or note in place. */
export async function editSession(db: RcrDB, ctx: PersonalContext, sessionId: string, patch: { durationSeconds?: number | null; reps?: number | null; note?: string }): Promise<void> {
  await runAtomic(db, ITEM_STORES, async (tx) => {
    const store = tx.objectStore('completions');
    const s = (await store.get(sessionId)) as unknown as ExerciseSession | undefined;
    if (!s || s.childId !== ctx.childId || s.deletedAt !== null || s.reversedAt) throw new PersonalInputError('Session not found.');
    const ex = await getLiveItem(tx, ctx, s.customItemId, 'exercise');
    const next = { ...s };
    if (s.method === 'stopwatch' && patch.durationSeconds !== undefined) next.durationSeconds = patch.durationSeconds;
    if (s.method === 'reps' && patch.reps !== undefined) next.reps = patch.reps;
    if (patch.note !== undefined) next.note = cleanText(patch.note);
    checkValues({ ...ex, tracking: s.method === 'stopwatch' ? { method: 'stopwatch', targetSeconds: null } : s.method === 'reps' ? { method: 'reps', targetReps: null } : { method: 'simple' } }, { date: s.occurrenceDate, slot: 'extra', durationSeconds: next.durationSeconds, reps: next.reps });
    if (next.durationSeconds === s.durationSeconds && next.reps === s.reps && next.note === s.note) return;
    await store.put(touch(next, ctx.deviceId) as never);
    await tx.objectStore('itemEvents').add(itemEvent(ctx, ex, 'session-edited', { eventDate: s.occurrenceDate, sessionId }) as never);
  });
}

/**
 * Moves a session to another date: the original is reversed and a linked session is recorded on the
 * new date (in an open scheduled slot of that date if there is one, otherwise as an additional session).
 */
export async function moveSession(db: RcrDB, ctx: PersonalContext, sessionId: string, newDate: string, patch: { durationSeconds?: number | null; reps?: number | null; note?: string } = {}): Promise<ExerciseSession> {
  checkDate(ctx, newDate, 'session date');
  return runAtomic(db, ITEM_STORES, async (tx) => {
    const store = tx.objectStore('completions');
    const s = (await store.get(sessionId)) as unknown as ExerciseSession | undefined;
    if (!s || s.childId !== ctx.childId || s.deletedAt !== null || s.reversedAt) throw new PersonalInputError('Session not found.');
    if (s.occurrenceDate === newDate) return s;
    const ex = await getLiveItem(tx, ctx, s.customItemId, 'exercise');
    await store.put(touch({ ...s, reversedAt: nowIso() }, ctx.deviceId) as never);
    const mine = (await sessionsOf(tx, ctx, ex.id)).map((x) => (x.id === s.id ? { ...x, reversedAt: 'now' } : x));
    const n = openSlotOn(ex, mine, newDate);
    const slotKey = n === null ? `extra:${newId()}` : slotKeyFor(newDate, n);
    const occupant = mine.find((x) => x.slotKey === slotKey);
    const fields = {
      method: s.method,
      durationSeconds: s.method === 'stopwatch' && patch.durationSeconds !== undefined ? patch.durationSeconds : s.durationSeconds,
      reps: s.method === 'reps' && patch.reps !== undefined ? patch.reps : s.reps,
      targetSnapshot: s.targetSnapshot,
      note: patch.note !== undefined ? cleanText(patch.note) : s.note,
      entry: s.entry,
      reversedAt: null,
      correctsSessionId: s.id,
    };
    checkValues({ ...ex, tracking: s.method === 'stopwatch' ? { method: 'stopwatch', targetSeconds: null } : s.method === 'reps' ? { method: 'reps', targetReps: null } : { method: 'simple' } }, { date: newDate, slot: 'extra', durationSeconds: fields.durationSeconds, reps: fields.reps });
    const moved: ExerciseSession = occupant
      ? touch({ ...occupant, ...fields }, ctx.deviceId)
      : { ...newEnvelope(ctx.deviceId), childId: ctx.childId, customItemId: ex.id, occurrenceDate: newDate, slotKey, ...fields };
    await store.put(moved as never);
    await tx.objectStore('itemEvents').add(itemEvent(ctx, ex, 'session-edited', { eventDate: newDate, fromDate: s.occurrenceDate, toDate: newDate, sessionId: moved.id }) as never);
    return moved;
  });
}

// ---------------------------------------------------------------------------
// Device-local tracker state (stopwatch / counter in progress)
// ---------------------------------------------------------------------------

export const trackerIdFor = (exerciseId: string, slotKey: string) => `${exerciseId}|${slotKey}`;

export async function listTrackers(db: RcrDB, childId: string): Promise<TrackerState[]> {
  return (await db.getAllFromIndex('trackerState', 'byChild', IDBKeyRange.only(childId))) as unknown as TrackerState[];
}

export async function getTracker(db: RcrDB, id: string): Promise<TrackerState | undefined> {
  return (await db.get('trackerState', id)) as unknown as TrackerState | undefined;
}

/**
 * Writes tracker state only if nobody else changed it since `expectedRev` (0 = must not exist yet).
 * A refused write throws TrackerConflictError; the caller reloads and shows the newer state.
 */
export async function saveTracker(db: RcrDB, next: Omit<TrackerState, 'rev' | 'updatedAt'>, expectedRev: number): Promise<TrackerState> {
  return runAtomic(db, ['trackerState', 'completions'], async (tx) => {
    const store = tx.objectStore('trackerState');
    const current = (await store.get(next.id)) as unknown as TrackerState | undefined;
    if ((current?.rev ?? 0) !== expectedRev) throw new TrackerConflictError('Changed in another window.');
    const done = (await tx.objectStore('completions').get(next.sessionId)) as unknown as ExerciseSession | undefined;
    if (done && done.reversedAt === null) throw new TrackerConflictError('Already saved.');
    const saved: TrackerState = { ...next, rev: expectedRev + 1, updatedAt: nowIso() };
    await store.put(saved as never);
    return saved;
  });
}

export async function discardTracker(db: RcrDB, id: string): Promise<void> {
  await db.delete('trackerState', id);
}

/** The scheduled version in force on a date (re-exported for screens). */
export { versionOn };
