/**
 * Personal goals, standalone achievements and the shared parts of personal items (Checkpoint 2b).
 *
 * Storage (database version 3):
 * - customItems: kind 'goal' | 'achievement' | 'exercise' (legacy kind 'milestone' is never touched here);
 * - itemEvents: append-only history and Notes & Observations for these items — never milestoneEvents,
 *   so nothing here can appear in milestone history, Home's Recent milestones or milestone Progress;
 * - completions and trackerState: exercise sessions (see exercisesRepo).
 *
 * Every change that touches more than one record runs in ONE atomic transaction. Nothing is inferred:
 * accomplishing a goal never changes a milestone, and completing an exercise never accomplishes a goal.
 */
import type { Achievement, Exercise, ExerciseSession, ItemEvent, ItemEventType, ItemTombstone, PersonalCategory, PersonalGoal, PersonalItem } from '../../types';
import type { RcrDB } from '../db';
import { newEnvelope, nowIso, touch } from '../envelope';
import { runAtomic, type RcrTx } from '../transactions';
import { monotonicRecordedAt } from '../history';
import { compareDates, isValidLocalDate, type LocalDate } from '../../domain/dates';
import { getMilestone } from '../../domain/milestones';

export class PersonalInputError extends Error {}

export interface PersonalContext {
  deviceId: string;
  childId: string;
  /** Recorded dates must fall between the date of birth and today (local). */
  dob: LocalDate;
  today: LocalDate;
}

export interface ChildPersonalData {
  goals: PersonalGoal[];
  achievements: Achievement[];
  exercises: Exercise[];
  events: ItemEvent[];
  sessions: ExerciseSession[];
}

export const TITLE_MAX = 120;
export const TEXT_MAX = 2000;

export type ItemStores = ['customItems', 'itemEvents', 'completions', 'trackerState'];
export const ITEM_STORES: ItemStores = ['customItems', 'itemEvents', 'completions', 'trackerState'];

export const itemKeyOf = (item: Pick<PersonalItem, 'kind' | 'id'>) => `${item.kind}:${item.id}`;

const byRecorded = (a: ItemEvent, b: ItemEvent) => a.recordedAt.localeCompare(b.recordedAt) || a.id.localeCompare(b.id);

export async function loadChildPersonal(db: RcrDB, childId: string): Promise<ChildPersonalData> {
  const tx = db.transaction(['customItems', 'itemEvents', 'completions'], 'readonly');
  const range = IDBKeyRange.only(childId);
  const [items, events, sessions] = await Promise.all([
    tx.objectStore('customItems').index('byChild').getAll(range),
    tx.objectStore('itemEvents').index('byChild').getAll(range),
    tx.objectStore('completions').index('byChild').getAll(range),
  ]);
  await tx.done;
  const live = (items as unknown as Array<PersonalItem | ItemTombstone>).filter((i) => i.deletedAt === null) as PersonalItem[];
  return {
    goals: live.filter((i): i is PersonalGoal => i.kind === 'goal'),
    achievements: live.filter((i): i is Achievement => i.kind === 'achievement'),
    exercises: live.filter((i): i is Exercise => i.kind === 'exercise'),
    events: (events as unknown as ItemEvent[]).sort(byRecorded),
    sessions: (sessions as unknown as ExerciseSession[]).filter((s) => s.deletedAt === null),
  };
}

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

export function cleanTitle(title: string, what = 'a name'): string {
  const t = title.trim();
  if (!t) throw new PersonalInputError(`Please give it ${what}.`);
  if (t.length > TITLE_MAX) throw new PersonalInputError(`Please keep the name to ${TITLE_MAX} characters or fewer.`);
  return t;
}

export function cleanText(text: string): string {
  const t = text.trim();
  if (t.length > TEXT_MAX) throw new PersonalInputError(`Please keep this to ${TEXT_MAX} characters or fewer.`);
  return t;
}

/** A real date, not before the date of birth, and (unless `allowFuture`) not after today. */
export function checkDate(ctx: PersonalContext, date: string, what: string, allowFuture = false): void {
  if (!isValidLocalDate(date)) throw new PersonalInputError(`Please enter a real ${what}.`);
  if (!allowFuture && compareDates(date, ctx.today) > 0) throw new PersonalInputError(`The ${what} can’t be in the future.`);
  if (compareDates(date, ctx.dob) < 0) throw new PersonalInputError(`The ${what} can’t be before your child was born.`);
}

const CATEGORIES = new Set(['gross-motor', 'fine-motor', 'cognitive', 'language-communication', 'social-emotional']);
export function checkCategory(c: PersonalCategory): PersonalCategory {
  if (c !== null && !CATEGORIES.has(c)) throw new PersonalInputError('Unknown area.');
  return c;
}

function checkMilestone(id: string | null): string | null {
  if (id !== null && !getMilestone(id)) throw new PersonalInputError('That milestone isn’t in the library.');
  return id;
}

// ---------------------------------------------------------------------------
// Low-level writes (inside a transaction)
// ---------------------------------------------------------------------------

export function itemEvent(ctx: PersonalContext, item: Pick<PersonalItem, 'kind' | 'id'>, type: ItemEventType, fields: Partial<ItemEvent> = {}): ItemEvent {
  return {
    ...newEnvelope(ctx.deviceId),
    childId: ctx.childId,
    itemId: item.id,
    itemKey: itemKeyOf(item),
    type,
    eventDate: null,
    recordedAt: monotonicRecordedAt(),
    deviceId: ctx.deviceId,
    ...fields,
  };
}

type AnyTx = RcrTx<ItemStores> | RcrTx<['customItems', 'itemEvents']> | RcrTx<['customItems', 'itemEvents', 'completions']>;

export async function getLiveItem<K extends PersonalItem['kind']>(tx: AnyTx, ctx: PersonalContext, id: string, kind: K): Promise<Extract<PersonalItem, { kind: K }>> {
  const item = (await (tx as RcrTx<ItemStores>).objectStore('customItems').get(id)) as unknown as PersonalItem | ItemTombstone | undefined;
  if (!item || item.childId !== ctx.childId || item.deletedAt !== null || item.kind !== kind) throw new PersonalInputError('This item no longer exists.');
  return item as Extract<PersonalItem, { kind: K }>;
}

async function putItem(tx: AnyTx, item: PersonalItem, ...events: ItemEvent[]) {
  const t = tx as RcrTx<ItemStores>;
  await t.objectStore('customItems').put(item as never);
  for (const e of events) await t.objectStore('itemEvents').add(e as never);
}

// ---------------------------------------------------------------------------
// Goals
// ---------------------------------------------------------------------------

export interface GoalInput {
  title: string;
  appCategory: PersonalCategory;
  description: string;
  startDate: string | null;
  targetDate: string | null;
  milestoneDefId: string | null;
  /** Exercises to associate (stored on the exercises). */
  exerciseIds?: string[];
  /** Optional first Notes & Observations entry. */
  firstNote?: { date: string; text: string } | null;
}

function validateGoal(ctx: PersonalContext, input: GoalInput, requireStart: boolean) {
  const title = cleanTitle(input.title, 'a name');
  if (input.startDate !== null) checkDate(ctx, input.startDate, 'start date', true);
  else if (requireStart) throw new PersonalInputError('Please choose a start date.');
  if (input.targetDate !== null) {
    checkDate(ctx, input.targetDate, 'target date', true);
    if (input.startDate && compareDates(input.targetDate, input.startDate) < 0) throw new PersonalInputError('The target date can’t be before the start date.');
  }
  return { title, appCategory: checkCategory(input.appCategory), description: cleanText(input.description), milestoneDefId: checkMilestone(input.milestoneDefId) };
}

async function setExerciseLinks(tx: AnyTx, ctx: PersonalContext, goalId: string, exerciseIds: string[]) {
  const store = (tx as RcrTx<ItemStores>).objectStore('customItems');
  const all = (await store.index('byChild').getAll(IDBKeyRange.only(ctx.childId))) as unknown as Array<PersonalItem | ItemTombstone>;
  const wanted = new Set(exerciseIds);
  for (const ex of all) {
    if (ex.kind !== 'exercise' || ex.deletedAt !== null) continue;
    const e = ex as Exercise;
    const has = e.goalIds.includes(goalId);
    if (wanted.has(e.id) && !has) await store.put(touch({ ...e, goalIds: [...e.goalIds, goalId] }, ctx.deviceId) as never);
    if (!wanted.has(e.id) && has) await store.put(touch({ ...e, goalIds: e.goalIds.filter((g) => g !== goalId) }, ctx.deviceId) as never);
  }
  for (const id of wanted) if (!all.some((x) => x.id === id && x.kind === 'exercise' && x.deletedAt === null)) throw new PersonalInputError('One of the chosen exercises no longer exists.');
}

/** `id` may be supplied (a per-form id) so that a retried save can never create two goals. */
export async function createGoal(db: RcrDB, ctx: PersonalContext, input: GoalInput, id?: string): Promise<PersonalGoal> {
  const v = validateGoal(ctx, input, true);
  if (input.firstNote) checkDate(ctx, input.firstNote.date, 'observation date');
  return runAtomic(db, ITEM_STORES, async (tx) => {
    if (id) {
      const existing = (await tx.objectStore('customItems').get(id)) as unknown as PersonalGoal | undefined;
      if (existing) return existing; // already saved by an earlier attempt
    }
    const goal: PersonalGoal = {
      ...newEnvelope(ctx.deviceId),
      ...(id ? { id } : {}),
      childId: ctx.childId,
      kind: 'goal',
      ...v,
      startDate: input.startDate,
      targetDate: input.targetDate,
      status: 'active',
      accomplishedDate: null,
      archivedAt: null,
    };
    const events = [itemEvent(ctx, goal, 'created', { eventDate: input.startDate, text: goal.title })];
    if (input.firstNote && input.firstNote.text.trim()) events.push(itemEvent(ctx, goal, 'observation', { eventDate: input.firstNote.date, text: cleanText(input.firstNote.text) }));
    await putItem(tx, goal, ...events);
    if (input.exerciseIds?.length) await setExerciseLinks(tx, ctx, goal.id, input.exerciseIds);
    return goal;
  });
}

export async function updateGoal(db: RcrDB, ctx: PersonalContext, id: string, input: GoalInput): Promise<void> {
  await runAtomic(db, ITEM_STORES, async (tx) => {
    const current = await getLiveItem(tx, ctx, id, 'goal');
    // A converted goal may have no start date; it stays unknown unless the parent enters one.
    const v = validateGoal(ctx, input, current.startDate !== null);
    const next: PersonalGoal = touch({ ...current, ...v, startDate: input.startDate, targetDate: input.targetDate }, ctx.deviceId);
    const changed = (['title', 'appCategory', 'description', 'startDate', 'targetDate', 'milestoneDefId'] as const).some((k) => current[k] !== next[k]);
    if (changed) await putItem(tx, next, itemEvent(ctx, next, 'edited', { fromDate: current.startDate, toDate: next.startDate, text: next.title }));
    if (input.exerciseIds) await setExerciseLinks(tx, ctx, id, input.exerciseIds);
  });
}

export async function accomplishGoal(db: RcrDB, ctx: PersonalContext, id: string, date: string): Promise<void> {
  checkDate(ctx, date, 'date accomplished');
  await runAtomic(db, ITEM_STORES, async (tx) => {
    const current = await getLiveItem(tx, ctx, id, 'goal');
    if (current.status === 'accomplished') return;
    if (current.startDate && compareDates(date, current.startDate) < 0) throw new PersonalInputError('The date accomplished can’t be before the start date.');
    const next = touch({ ...current, status: 'accomplished' as const, accomplishedDate: date }, ctx.deviceId);
    await putItem(tx, next, itemEvent(ctx, next, 'status', { eventDate: date, fromStatus: 'active', toStatus: 'accomplished', toDate: date }));
  });
}

export async function correctAccomplishedDate(db: RcrDB, ctx: PersonalContext, id: string, date: string): Promise<void> {
  checkDate(ctx, date, 'date accomplished');
  await runAtomic(db, ITEM_STORES, async (tx) => {
    const current = await getLiveItem(tx, ctx, id, 'goal');
    if (current.status !== 'accomplished') throw new PersonalInputError('Only an accomplished goal has this date.');
    if (current.accomplishedDate === date) return;
    if (current.startDate && compareDates(date, current.startDate) < 0) throw new PersonalInputError('The date accomplished can’t be before the start date.');
    const next = touch({ ...current, accomplishedDate: date }, ctx.deviceId);
    await putItem(tx, next, itemEvent(ctx, next, 'date-corrected', { eventDate: date, fromDate: current.accomplishedDate, toDate: date }));
  });
}

/** Reopens an accomplished goal. The earlier date stays in the history. */
export async function reopenGoal(db: RcrDB, ctx: PersonalContext, id: string): Promise<void> {
  await runAtomic(db, ITEM_STORES, async (tx) => {
    const current = await getLiveItem(tx, ctx, id, 'goal');
    if (current.status === 'active') return;
    const next = touch({ ...current, status: 'active' as const, accomplishedDate: null }, ctx.deviceId);
    await putItem(tx, next, itemEvent(ctx, next, 'status', { eventDate: ctx.today, fromStatus: 'accomplished', toStatus: 'active', fromDate: current.accomplishedDate }));
  });
}

// ---------------------------------------------------------------------------
// Standalone achievements (never a goal; no start date exists)
// ---------------------------------------------------------------------------

export interface AchievementInput {
  title: string;
  appCategory: PersonalCategory;
  description: string;
  achievedDate: string;
  firstNote?: { date: string; text: string } | null;
}

export async function createAchievement(db: RcrDB, ctx: PersonalContext, input: AchievementInput, id?: string): Promise<Achievement> {
  const title = cleanTitle(input.title, 'a name');
  checkDate(ctx, input.achievedDate, 'date');
  if (input.firstNote) checkDate(ctx, input.firstNote.date, 'observation date');
  return runAtomic(db, ITEM_STORES, async (tx) => {
    if (id) {
      const existing = (await tx.objectStore('customItems').get(id)) as unknown as Achievement | undefined;
      if (existing) return existing;
    }
    const a: Achievement = {
      ...newEnvelope(ctx.deviceId),
      ...(id ? { id } : {}),
      childId: ctx.childId,
      kind: 'achievement',
      title,
      appCategory: checkCategory(input.appCategory),
      description: cleanText(input.description),
      achievedDate: input.achievedDate,
      milestoneDefId: null,
      archivedAt: null,
    };
    const events = [itemEvent(ctx, a, 'created', { eventDate: input.achievedDate, text: title })];
    if (input.firstNote && input.firstNote.text.trim()) events.push(itemEvent(ctx, a, 'observation', { eventDate: input.firstNote.date, text: cleanText(input.firstNote.text) }));
    await putItem(tx, a, ...events);
    return a;
  });
}

export async function updateAchievement(db: RcrDB, ctx: PersonalContext, id: string, input: AchievementInput): Promise<void> {
  const title = cleanTitle(input.title, 'a name');
  checkDate(ctx, input.achievedDate, 'date');
  await runAtomic(db, ITEM_STORES, async (tx) => {
    const current = await getLiveItem(tx, ctx, id, 'achievement');
    const next: Achievement = touch({ ...current, title, appCategory: checkCategory(input.appCategory), description: cleanText(input.description), achievedDate: input.achievedDate }, ctx.deviceId);
    if (current.achievedDate !== next.achievedDate) await putItem(tx, next, itemEvent(ctx, next, 'date-corrected', { eventDate: next.achievedDate, fromDate: current.achievedDate, toDate: next.achievedDate }));
    else if (current.title !== next.title || current.appCategory !== next.appCategory || current.description !== next.description) await putItem(tx, next, itemEvent(ctx, next, 'edited', { text: title }));
  });
}

// ---------------------------------------------------------------------------
// Shared: archive, restore, permanent deletion
// ---------------------------------------------------------------------------

export async function setArchived(db: RcrDB, ctx: PersonalContext, id: string, kind: PersonalItem['kind'], archived: boolean): Promise<void> {
  await runAtomic(db, ITEM_STORES, async (tx) => {
    const current = await getLiveItem(tx, ctx, id, kind);
    if (!!current.archivedAt === archived) return;
    const next = touch({ ...current, archivedAt: archived ? nowIso() : null }, ctx.deviceId) as PersonalItem;
    await putItem(tx, next, itemEvent(ctx, next, archived ? 'archived' : 'restored', { eventDate: ctx.today }));
  });
}

/**
 * Permanent deletion (after a two-step confirmation in the UI). In ONE transaction: the item is replaced
 * by a content-free tombstone (so a future partner import can't bring it back); all of its history and
 * Notes & Observations, its sessions and in-progress trackers are deleted; links to it are removed.
 * Other records are never touched, even if they contain identical text.
 */
export async function deleteItemPermanently(db: RcrDB, ctx: PersonalContext, id: string, kind: PersonalItem['kind']): Promise<void> {
  await runAtomic(db, ITEM_STORES, async (tx) => {
    const current = await getLiveItem(tx, ctx, id, kind);
    const items = tx.objectStore('customItems');
    const tombstone: ItemTombstone = {
      id: current.id,
      childId: current.childId,
      kind: current.kind,
      createdAt: current.createdAt,
      originDeviceId: current.originDeviceId,
      updatedAt: nowIso(),
      deletedAt: nowIso(),
      rev: current.rev + 1,
      lastModifiedBy: ctx.deviceId,
    };
    await items.put(tombstone as never);
    let c = await tx.objectStore('itemEvents').index('byItem').openCursor(IDBKeyRange.only(id));
    while (c) {
      await c.delete();
      c = await c.continue();
    }
    if (kind === 'exercise') {
      let s = await tx.objectStore('completions').index('byChild').openCursor(IDBKeyRange.only(ctx.childId));
      while (s) {
        if ((s.value as unknown as ExerciseSession).customItemId === id) await s.delete();
        s = await s.continue();
      }
      let t = await tx.objectStore('trackerState').index('byChild').openCursor(IDBKeyRange.only(ctx.childId));
      while (t) {
        if ((t.value as unknown as { exerciseId: string }).exerciseId === id) await t.delete();
        t = await t.continue();
      }
    }
    if (kind === 'goal') await setExerciseLinks(tx, ctx, id, []);
  });
}

// ---------------------------------------------------------------------------
// Notes & Observations for personal items (same rules as milestones, R-007)
// ---------------------------------------------------------------------------

async function itemEventsOf(tx: AnyTx, itemId: string): Promise<ItemEvent[]> {
  return ((await (tx as RcrTx<ItemStores>).objectStore('itemEvents').index('byItem').getAll(IDBKeyRange.only(itemId))) as unknown as ItemEvent[]).sort(byRecorded);
}

async function liveAnyKind(tx: AnyTx, ctx: PersonalContext, id: string): Promise<PersonalItem> {
  const item = (await (tx as RcrTx<ItemStores>).objectStore('customItems').get(id)) as unknown as PersonalItem | ItemTombstone | undefined;
  if (!item || item.childId !== ctx.childId || item.deletedAt !== null || item.kind === 'milestone') throw new PersonalInputError('This item no longer exists.');
  return item as PersonalItem;
}

export async function addItemObservation(db: RcrDB, ctx: PersonalContext, itemId: string, date: string, text: string): Promise<void> {
  checkDate(ctx, date, 'observation date');
  const clean = cleanText(text);
  if (!clean) throw new PersonalInputError('Please write what you noticed.');
  await runAtomic(db, ITEM_STORES, async (tx) => {
    const item = await liveAnyKind(tx, ctx, itemId);
    await putItem(tx, touch(item, ctx.deviceId), itemEvent(ctx, item, 'observation', { eventDate: date, text: clean }));
  });
}

export async function editItemObservation(db: RcrDB, ctx: PersonalContext, itemId: string, observationId: string, date: string, text: string): Promise<void> {
  checkDate(ctx, date, 'observation date');
  const clean = cleanText(text);
  if (!clean) throw new PersonalInputError('Please write what you noticed.');
  await runAtomic(db, ITEM_STORES, async (tx) => {
    const item = await liveAnyKind(tx, ctx, itemId);
    const all = await itemEventsOf(tx, itemId);
    const obs = all.find((e) => e.id === observationId);
    if (!obs || obs.type !== 'observation' || obs.erasedAt || all.some((e) => e.type === 'observation-removed' && e.refEventId === observationId)) throw new PersonalInputError('Entry not found.');
    const latest = all.filter((e) => e.type === 'observation-edited' && e.refEventId === observationId).pop() ?? obs;
    if (latest.text === clean && latest.eventDate === date) return;
    await putItem(tx, touch(item, ctx.deviceId), itemEvent(ctx, item, 'observation-edited', { eventDate: date, text: clean, refEventId: observationId, fromDate: latest.eventDate }));
  });
}

export async function removeItemObservation(db: RcrDB, ctx: PersonalContext, itemId: string, observationId: string): Promise<void> {
  await runAtomic(db, ITEM_STORES, async (tx) => {
    const item = await liveAnyKind(tx, ctx, itemId);
    const all = await itemEventsOf(tx, itemId);
    const obs = all.find((e) => e.id === observationId);
    if (!obs || obs.type !== 'observation') throw new PersonalInputError('Entry not found.');
    await putItem(tx, touch(item, ctx.deviceId), itemEvent(ctx, item, 'observation-removed', { refEventId: observationId }));
  });
}

/** Edits or clears (text '') the undated note carried over from a legacy entry. Each change is kept in history. */
export async function setItemNote(db: RcrDB, ctx: PersonalContext, itemId: string, text: string): Promise<void> {
  const clean = cleanText(text);
  await runAtomic(db, ITEM_STORES, async (tx) => {
    const item = await liveAnyKind(tx, ctx, itemId);
    const notes = (await itemEventsOf(tx, itemId)).filter((e) => e.type === 'note');
    const current = notes[notes.length - 1];
    if ((current?.erasedAt ? '' : current?.text ?? '') === clean) return;
    await putItem(tx, touch(item, ctx.deviceId), itemEvent(ctx, item, 'note', { eventDate: ctx.today, text: clean }));
  });
}

/**
 * PERMANENT erase of personal text in one item's history. An observation is erased with every edit of
 * it; a note version is erased with the other versions OF THE SAME ITEM that have exactly the same text.
 * Records of other items (or milestones) are never touched, even if their text is identical.
 */
export async function eraseItemEntry(db: RcrDB, ctx: PersonalContext, itemId: string, entryId: string): Promise<void> {
  await runAtomic(db, ITEM_STORES, async (tx) => {
    const item = await liveAnyKind(tx, ctx, itemId);
    const mine = await itemEventsOf(tx, itemId);
    const entry = mine.find((e) => e.id === entryId);
    if (!entry || (entry.type !== 'observation' && entry.type !== 'observation-edited' && entry.type !== 'note')) throw new PersonalInputError('Entry not found.');
    let targets: ItemEvent[];
    let rootId = entryId;
    if (entry.type === 'note') targets = entry.text ? mine.filter((e) => e.type === 'note' && e.text === entry.text) : [entry];
    else {
      rootId = entry.type === 'observation-edited' ? entry.refEventId! : entry.id;
      targets = mine.filter((e) => e.id === rootId || (e.type === 'observation-edited' && e.refEventId === rootId));
    }
    const at = nowIso();
    const store = tx.objectStore('itemEvents');
    for (const e of targets) if (!e.erasedAt || e.text !== null) await store.put(touch({ ...e, text: null, erasedAt: e.erasedAt ?? at }, ctx.deviceId) as never);
    await putItem(tx, touch(item, ctx.deviceId), itemEvent(ctx, item, 'entry-erased', { refEventId: rootId }));
  });
}
