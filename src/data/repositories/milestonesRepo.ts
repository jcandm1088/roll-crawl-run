/**
 * Milestone records, history, and personal versions for one child.
 * Uses the existing stores (milestoneRecords, milestoneEvents, customItems) —
 * no schema change. Every change that touches more than one record runs in a
 * single atomic transaction (all or nothing).
 */
import type { AgeBasisSnapshot, MilestoneEvent, MilestoneEventType, MilestoneRecord, MilestoneStatusValue, PersonalMilestone } from '../../types';
import type { RcrDB } from '../db';
import { newEnvelope, newId, nowIso, touch } from '../envelope';
import { runAtomic, type RcrTx } from '../transactions';
import { compareDates, isValidLocalDate, type LocalDate } from '../../domain/dates';
import { getMilestone } from '../../domain/milestones';

export type MilestoneTarget = { kind: 'sourced'; defId: string } | { kind: 'personal'; customId: string };

export interface WriteContext {
  deviceId: string;
  childId: string;
  /** Child's date of birth and today's local date: recorded dates must fall between them. */
  dob: LocalDate;
  today: LocalDate;
  ageBasis: AgeBasisSnapshot;
}

export interface ChildMilestoneData {
  records: MilestoneRecord[];
  events: MilestoneEvent[];
  personal: PersonalMilestone[];
}

type Stores = ['milestoneRecords', 'milestoneEvents', 'customItems'];
const STORES: Stores = ['milestoneRecords', 'milestoneEvents', 'customItems'];

export const recordKeyOf = (t: MilestoneTarget) => (t.kind === 'sourced' ? `def:${t.defId}` : `custom:${t.customId}`);

export class MilestoneInputError extends Error {}

/**
 * Recording timestamps that always increase on this device, so history order is
 * exact even when several entries are recorded within the same millisecond.
 */
let lastRecordedMs = 0;
export function monotonicRecordedAt(): string {
  lastRecordedMs = Math.max(Date.now(), lastRecordedMs + 1);
  return new Date(lastRecordedMs).toISOString();
}

function checkDate(ctx: WriteContext, date: string, what: string): void {
  if (!isValidLocalDate(date)) throw new MilestoneInputError(`Please enter a real ${what}.`);
  if (compareDates(date, ctx.today) > 0) throw new MilestoneInputError(`The ${what} can’t be in the future.`);
  if (compareDates(date, ctx.dob) < 0) throw new MilestoneInputError(`The ${what} can’t be before your child was born.`);
}

export async function loadChildMilestones(db: RcrDB, childId: string): Promise<ChildMilestoneData> {
  const tx = db.transaction(STORES, 'readonly');
  const range = IDBKeyRange.only(childId);
  const [records, events, custom] = await Promise.all([
    tx.objectStore('milestoneRecords').index('byChild').getAll(range),
    tx.objectStore('milestoneEvents').index('byChild').getAll(range),
    tx.objectStore('customItems').index('byChild').getAll(range),
  ]);
  await tx.done;
  return {
    records: (records as unknown as MilestoneRecord[]).filter((r) => r.deletedAt === null),
    events: (events as unknown as MilestoneEvent[]).sort((a, b) => a.recordedAt.localeCompare(b.recordedAt) || a.id.localeCompare(b.id)),
    personal: (custom as unknown as PersonalMilestone[]).filter((c) => c.kind === 'milestone' && c.deletedAt === null),
  };
}

async function findRecord(tx: RcrTx<Stores>, childId: string, t: MilestoneTarget): Promise<MilestoneRecord | undefined> {
  const store = tx.objectStore('milestoneRecords');
  const r = t.kind === 'sourced'
    ? await store.index('byChildAndDefinition').get([childId, t.defId])
    : await store.index('byChildAndCustomItem').get([childId, t.customId]);
  return r as unknown as MilestoneRecord | undefined;
}

async function getOrCreateRecord(tx: RcrTx<Stores>, ctx: WriteContext, t: MilestoneTarget): Promise<MilestoneRecord> {
  const existing = await findRecord(tx, ctx.childId, t);
  if (existing) return existing;
  if (t.kind === 'sourced' && !getMilestone(t.defId)) throw new MilestoneInputError('Unknown milestone.');
  if (t.kind === 'personal') {
    const item = (await tx.objectStore('customItems').get(t.customId)) as unknown as PersonalMilestone | undefined;
    if (!item || item.childId !== ctx.childId || item.deletedAt !== null) throw new MilestoneInputError('This personal version no longer exists.');
  }
  return {
    ...newEnvelope(ctx.deviceId),
    childId: ctx.childId,
    ...(t.kind === 'sourced' ? { milestoneDefId: t.defId } : { customItemId: t.customId }),
    status: 'not-yet',
    firstObservedDate: null,
    achievedDate: null,
    note: '',
    hidden: false,
  };
}

function event(ctx: WriteContext, rec: MilestoneRecord, t: MilestoneTarget, type: MilestoneEventType, fields: Partial<MilestoneEvent>): MilestoneEvent {
  return {
    ...newEnvelope(ctx.deviceId),
    childId: ctx.childId,
    recordId: rec.id,
    recordKey: recordKeyOf(t),
    type,
    eventDate: null,
    recordedAt: monotonicRecordedAt(),
    deviceId: ctx.deviceId,
    ageBasis: ctx.ageBasis,
    hiddenAtTime: rec.hidden,
    statusAfter: rec.status,
    ...fields,
  };
}

async function write(tx: RcrTx<Stores>, rec: MilestoneRecord, ...events: MilestoneEvent[]) {
  await tx.objectStore('milestoneRecords').put(rec as never);
  for (const e of events) await tx.objectStore('milestoneEvents').add(e as never);
}

/**
 * Changes a milestone's status. Nothing is inferred: achieving one milestone never
 * changes another, and age never marks anything achieved.
 */
export async function setStatus(db: RcrDB, ctx: WriteContext, t: MilestoneTarget, status: MilestoneStatusValue, date: LocalDate): Promise<void> {
  checkDate(ctx, date, status === 'achieved' ? 'achievement date' : 'date');
  await runAtomic(db, STORES, async (tx) => {
    const current = await getOrCreateRecord(tx, ctx, t);
    if (current.status === status) return;
    const next: MilestoneRecord = touch(
      {
        ...current,
        status,
        firstObservedDate: status !== 'not-yet' && !current.firstObservedDate ? date : current.firstObservedDate,
        achievedDate: status === 'achieved' ? date : null,
      },
      ctx.deviceId,
    );
    await write(tx, next, event(ctx, next, t, 'status', { eventDate: date, fromStatus: current.status, toStatus: status, fromDate: current.achievedDate, toDate: next.achievedDate }));
  });
}

/** Corrects the achievement date of an achieved milestone. Both dates stay in history. */
export async function correctAchievedDate(db: RcrDB, ctx: WriteContext, t: MilestoneTarget, date: LocalDate): Promise<void> {
  checkDate(ctx, date, 'achievement date');
  await runAtomic(db, STORES, async (tx) => {
    const current = await findRecord(tx, ctx.childId, t);
    if (!current || current.status !== 'achieved') throw new MilestoneInputError('Only an achieved milestone has an achievement date.');
    if (current.achievedDate === date) return;
    const next = touch({ ...current, achievedDate: date }, ctx.deviceId);
    await write(tx, next, event(ctx, next, t, 'achieved-date-corrected', { eventDate: date, fromDate: current.achievedDate, toDate: date }));
  });
}

/** A dated observation. It never changes the milestone's status. */
export async function addObservation(db: RcrDB, ctx: WriteContext, t: MilestoneTarget, date: LocalDate, text: string): Promise<void> {
  checkDate(ctx, date, 'observation date');
  const clean = text.trim();
  if (!clean) throw new MilestoneInputError('Please write what you noticed.');
  await runAtomic(db, STORES, async (tx) => {
    const current = await getOrCreateRecord(tx, ctx, t);
    const next = touch(current, ctx.deviceId);
    await write(tx, next, event(ctx, next, t, 'observation', { eventDate: date, text: clean }));
  });
}

/**
 * Removes an observation from view with a removal marker. Its text stays in this
 * device's history (shown as removed) until it is permanently erased, the profile
 * is deleted, or the app is reset.
 */
export async function removeObservation(db: RcrDB, ctx: WriteContext, t: MilestoneTarget, observationId: string): Promise<void> {
  await runAtomic(db, STORES, async (tx) => {
    const current = await findRecord(tx, ctx.childId, t);
    const obs = (await tx.objectStore('milestoneEvents').get(observationId)) as unknown as MilestoneEvent | undefined;
    if (!current || !obs || obs.recordId !== current.id || obs.type !== 'observation') throw new MilestoneInputError('Observation not found.');
    const next = touch(current, ctx.deviceId);
    await write(tx, next, event(ctx, next, t, 'observation-removed', { refEventId: observationId }));
  });
}

/**
 * Notes & Observations (R-007): changes the wording and/or date of an observation. Append-only: the
 * original entry is kept and an `observation-edited` entry records the new text and date, so the earlier
 * wording stays in this device's history until it is permanently erased. Never changes the status.
 */
export async function editObservation(db: RcrDB, ctx: WriteContext, t: MilestoneTarget, observationId: string, date: LocalDate, text: string): Promise<void> {
  checkDate(ctx, date, 'observation date');
  const clean = text.trim();
  if (!clean) throw new MilestoneInputError('Please write what you noticed.');
  await runAtomic(db, STORES, async (tx) => {
    const current = await findRecord(tx, ctx.childId, t);
    const evStore = tx.objectStore('milestoneEvents');
    const obs = (await evStore.get(observationId)) as unknown as MilestoneEvent | undefined;
    if (!current || !obs || obs.recordId !== current.id || obs.type !== 'observation' || obs.erasedAt) throw new MilestoneInputError('Entry not found.');
    const all = (await evStore.index('byChild').getAll(IDBKeyRange.only(ctx.childId))) as unknown as MilestoneEvent[];
    if (all.some((e) => e.type === 'observation-removed' && e.refEventId === observationId)) throw new MilestoneInputError('Entry not found.');
    const latest = all
      .filter((e) => e.type === 'observation-edited' && e.refEventId === observationId)
      .sort((a, b) => a.recordedAt.localeCompare(b.recordedAt))
      .pop() ?? obs;
    if (latest.text === clean && latest.eventDate === date) return;
    const next = touch(current, ctx.deviceId);
    await write(tx, next, event(ctx, next, t, 'observation-edited', { eventDate: date, text: clean, refEventId: observationId, fromDate: latest.eventDate }));
  });
}

/**
 * PERMANENT erase of personal text in history (an observation, one of its edits, or a note).
 * This is the one deliberate exception to append-only history: the text is overwritten with null
 * so it no longer exists in the app's storage. A marker records that an erase happened.
 *
 * So that erased text can't be recovered from elsewhere in the history:
 * - an observation is erased together with every edit of it (erasing an edit erases the whole entry);
 * - a note version is erased together with any other saved version that has exactly the same text.
 */
export async function eraseEntryText(db: RcrDB, ctx: WriteContext, t: MilestoneTarget, entryId: string): Promise<void> {
  await runAtomic(db, STORES, async (tx) => {
    const current = await findRecord(tx, ctx.childId, t);
    const evStore = tx.objectStore('milestoneEvents');
    const entry = (await evStore.get(entryId)) as unknown as MilestoneEvent | undefined;
    if (!current || !entry || entry.recordId !== current.id || (entry.type !== 'observation' && entry.type !== 'observation-edited' && entry.type !== 'note')) throw new MilestoneInputError('Entry not found.');
    const mine = ((await evStore.index('byChild').getAll(IDBKeyRange.only(ctx.childId))) as unknown as MilestoneEvent[]).filter((e) => e.recordId === current.id);
    let targets: MilestoneEvent[];
    let rootId = entryId;
    if (entry.type === 'note') {
      targets = entry.text ? mine.filter((e) => e.type === 'note' && e.text === entry.text) : [entry];
    } else {
      rootId = entry.type === 'observation-edited' ? entry.refEventId! : entry.id;
      targets = mine.filter((e) => e.id === rootId || (e.type === 'observation-edited' && e.refEventId === rootId));
    }
    const at = nowIso();
    for (const e of targets) if (!e.erasedAt || e.text !== null) await evStore.put(touch({ ...e, text: null, erasedAt: e.erasedAt ?? at }, ctx.deviceId) as never);
    // If the erased text is the current note, clear the current note too.
    const isCurrentNote = entry.type === 'note' && current.note !== '' && current.note === entry.text;
    const next = touch({ ...current, note: isCurrentNote ? '' : current.note }, ctx.deviceId);
    await write(tx, next, event(ctx, next, t, 'entry-erased', { refEventId: rootId }));
  });
}

/**
 * Saves the milestone's undated note. Each change is kept in history.
 * Since R-007, new entries are always dated observations (Notes & Observations); this remains so a
 * parent can edit or clear a note saved by an earlier version of the app, which has no observation date.
 */
export async function setNote(db: RcrDB, ctx: WriteContext, t: MilestoneTarget, note: string): Promise<void> {
  const clean = note.trim();
  await runAtomic(db, STORES, async (tx) => {
    const current = await getOrCreateRecord(tx, ctx, t);
    if (current.note === clean) return;
    const next = touch({ ...current, note: clean }, ctx.deviceId);
    await write(tx, next, event(ctx, next, t, 'note', { eventDate: ctx.today, text: clean }));
  });
}

/** Hides or restores a milestone. Status, dates and history are kept unchanged. */
export async function setHidden(db: RcrDB, ctx: WriteContext, t: MilestoneTarget, hidden: boolean): Promise<void> {
  await runAtomic(db, STORES, async (tx) => {
    const current = await getOrCreateRecord(tx, ctx, t);
    if (current.hidden === hidden) return;
    const next = touch({ ...current, hidden }, ctx.deviceId);
    await write(tx, next, event(ctx, next, t, hidden ? 'hidden' : 'restored', { eventDate: ctx.today }));
  });
}

/**
 * Creates a personal version: a separate custom record. The sourced milestone is never modified.
 * Since R-005 no screen calls this: parents can no longer create personal versions (personal goals and
 * activities belong in Goals & Exercises, Checkpoint 2b). It is kept, unchanged, as the reference for
 * the shape of existing records, which the app still reads, updates and preserves.
 */
export async function createPersonalVersion(
  db: RcrDB,
  ctx: WriteContext,
  input: { title: string; description: string; derivedFromDefId: string | null; appCategory: string; referenceAgeMonths: number | null },
): Promise<PersonalMilestone> {
  const title = input.title.trim();
  if (!title) throw new MilestoneInputError('Please give your version a title.');
  return runAtomic(db, STORES, async (tx) => {
    const item: PersonalMilestone = {
      ...newEnvelope(ctx.deviceId),
      childId: ctx.childId,
      kind: 'milestone',
      title,
      description: input.description.trim(),
      appCategory: input.appCategory,
      derivedFromDefId: input.derivedFromDefId,
      referenceAgeMonths: input.referenceAgeMonths,
    };
    await tx.objectStore('customItems').add(item as never);
    const t: MilestoneTarget = { kind: 'personal', customId: item.id };
    const rec = await getOrCreateRecord(tx, ctx, t);
    await write(tx, rec, event(ctx, rec, t, 'personal-version-created', { eventDate: ctx.today, text: title }));
    return item;
  });
}

export async function updatePersonalVersion(db: RcrDB, ctx: WriteContext, customId: string, patch: { title: string; description: string }): Promise<void> {
  const title = patch.title.trim();
  if (!title) throw new MilestoneInputError('Please give your version a title.');
  await runAtomic(db, STORES, async (tx) => {
    const store = tx.objectStore('customItems');
    const item = (await store.get(customId)) as unknown as PersonalMilestone | undefined;
    if (!item || item.childId !== ctx.childId || item.deletedAt !== null) throw new MilestoneInputError('This personal version no longer exists.');
    if (item.title === title && item.description === patch.description.trim()) return;
    await store.put(touch({ ...item, title, description: patch.description.trim() }, ctx.deviceId) as never);
    const t: MilestoneTarget = { kind: 'personal', customId };
    const rec = touch(await getOrCreateRecord(tx, ctx, t), ctx.deviceId);
    await write(tx, rec, event(ctx, rec, t, 'personal-version-edited', { eventDate: ctx.today, text: title }));
  });
}

export const newMilestoneId = newId;
