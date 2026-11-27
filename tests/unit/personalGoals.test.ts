/**
 * Personal goals, standalone achievements, Notes & Observations and permanent deletion (Checkpoint 2b).
 * FICTIONAL data only.
 */
import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { openRcrDb, type RcrDB } from '../../src/data/db';
import { ensureMeta } from '../../src/data/repositories/metaRepo';
import { createChild } from '../../src/data/repositories/childrenRepo';
import {
  PersonalInputError, accomplishGoal, addItemObservation, correctAccomplishedDate, createAchievement, createGoal, deleteItemPermanently, editItemObservation,
  eraseItemEntry, loadChildPersonal, removeItemObservation, reopenGoal, setArchived, updateAchievement, updateGoal, type PersonalContext,
} from '../../src/data/repositories/personalRepo';
import { createExercise } from '../../src/data/repositories/exercisesRepo';
import { addObservation, loadChildMilestones } from '../../src/data/repositories/milestonesRepo';
import { itemNotesAndObservations } from '../../src/domain/itemHistory';
import { accomplishmentsOf, activeGoalsOf, personalSummary } from '../../src/domain/personalProgress';
import { SAMPLE_CHILD_A, SAMPLE_CHILD_B } from '../fixtures/children';

let db: RcrDB;
let ctx: PersonalContext;
let ctxB: PersonalContext;
let n = 0;
const TODAY = '2026-06-15';
const goalInput = (over: Partial<Parameters<typeof createGoal>[2]> = {}) => ({ title: 'Fictional goal', appCategory: null, description: '', startDate: '2026-06-01', targetDate: null, milestoneDefId: null, ...over });

beforeEach(async () => {
  db = await openRcrDb(`goals-${++n}`);
  const { deviceId } = await ensureMeta(db);
  const a = await createChild(db, deviceId, SAMPLE_CHILD_A);
  const b = await createChild(db, deviceId, SAMPLE_CHILD_B);
  ctx = { deviceId, childId: a.id, dob: a.dob, today: TODAY };
  ctxB = { deviceId, childId: b.id, dob: b.dob, today: TODAY };
});
afterEach(() => db.close());

describe('goals', () => {
  it('requires a name; start date defaults are the caller’s; target can’t precede start; future targets are fine', async () => {
    await expect(createGoal(db, ctx, goalInput({ title: '  ' }))).rejects.toThrow(PersonalInputError);
    await expect(createGoal(db, ctx, goalInput({ targetDate: '2026-05-01' }))).rejects.toThrow(/target date/);
    await expect(createGoal(db, ctx, goalInput({ startDate: '2020-01-01' }))).rejects.toThrow(/born/);
    const g = await createGoal(db, ctx, goalInput({ targetDate: '2026-12-31' }));
    expect(g).toMatchObject({ kind: 'goal', status: 'active', accomplishedDate: null, startDate: '2026-06-01', targetDate: '2026-12-31', appCategory: null });
  });

  it('a retried save with the same form id never creates a second goal', async () => {
    const a = await createGoal(db, ctx, goalInput(), 'form-id-1');
    const b = await createGoal(db, ctx, goalInput(), 'form-id-1');
    expect(b.id).toBe(a.id);
    expect((await loadChildPersonal(db, ctx.childId)).goals).toHaveLength(1);
  });

  it('accomplish, correct the date, reopen and accomplish again: counted once, history kept', async () => {
    const g = await createGoal(db, ctx, goalInput());
    await expect(accomplishGoal(db, ctx, g.id, '2026-05-01')).rejects.toThrow(/start date/);
    await expect(accomplishGoal(db, ctx, g.id, '2026-07-01')).rejects.toThrow(/future/);
    await accomplishGoal(db, ctx, g.id, '2026-06-10');
    await correctAccomplishedDate(db, ctx, g.id, '2026-06-08');
    let d = await loadChildPersonal(db, ctx.childId);
    expect(accomplishmentsOf(d.goals, d.achievements)).toEqual([expect.objectContaining({ id: g.id, date: '2026-06-08', kind: 'goal' })]);
    await reopenGoal(db, ctx, g.id);
    d = await loadChildPersonal(db, ctx.childId);
    expect(d.goals[0]).toMatchObject({ status: 'active', accomplishedDate: null });
    expect(accomplishmentsOf(d.goals, d.achievements)).toEqual([]);
    expect(activeGoalsOf(d.goals)).toHaveLength(1);
    await accomplishGoal(db, ctx, g.id, '2026-06-14');
    d = await loadChildPersonal(db, ctx.childId);
    expect(accomplishmentsOf(d.goals, d.achievements)).toHaveLength(1);
    const types = d.events.filter((e) => e.itemId === g.id).map((e) => e.type);
    expect(types).toEqual(['created', 'status', 'date-corrected', 'status', 'status']);
  });

  it('linking a milestone or an exercise changes nothing else; accomplishing never marks the milestone', async () => {
    const ex = await createExercise(db, ctx, { title: 'Fictional exercise', appCategory: null, instructions: '', origin: 'parent', providerName: '', source: null, goalIds: [], tracking: { method: 'simple' } }, { rule: { kind: 'asNeeded' }, sessionsPerDay: 1, startDate: TODAY });
    const g = await createGoal(db, ctx, goalInput({ milestoneDefId: 'cdc22-m12-mp-01', exerciseIds: [ex.id] }));
    expect((await loadChildPersonal(db, ctx.childId)).exercises[0]!.goalIds).toEqual([g.id]);
    await accomplishGoal(db, ctx, g.id, '2026-06-10');
    const ms = await loadChildMilestones(db, ctx.childId);
    expect(ms.records).toEqual([]);
    expect(ms.events).toEqual([]);
    await updateGoal(db, ctx, g.id, goalInput({ milestoneDefId: null, exerciseIds: [] }));
    expect((await loadChildPersonal(db, ctx.childId)).exercises[0]!.goalIds).toEqual([]);
    await expect(createGoal(db, ctx, goalInput({ milestoneDefId: 'not-a-milestone' }))).rejects.toThrow();
  });

  it('archived active goals are not active; archived accomplishments still count (D14)', async () => {
    const g1 = await createGoal(db, ctx, goalInput({ title: 'Fictional active' }));
    const g2 = await createGoal(db, ctx, goalInput({ title: 'Fictional done' }));
    await accomplishGoal(db, ctx, g2.id, '2026-06-02');
    await setArchived(db, ctx, g1.id, 'goal', true);
    await setArchived(db, ctx, g2.id, 'goal', true);
    const d = await loadChildPersonal(db, ctx.childId);
    expect(personalSummary(d, TODAY)).toEqual({ accomplishments: 1, activeGoals: 0, sessionsThisMonth: 0 });
  });
});

describe('standalone achievements', () => {
  it('have a date and no start date, are never goals, and are counted once alongside goals', async () => {
    await expect(createAchievement(db, ctx, { title: 'Fictional', appCategory: null, description: '', achievedDate: '2026-07-01' })).rejects.toThrow(/future/);
    const a = await createAchievement(db, ctx, { title: 'Fictional first steps', appCategory: 'gross-motor', description: '', achievedDate: '2026-06-03' });
    expect(a).not.toHaveProperty('startDate');
    const g = await createGoal(db, ctx, goalInput());
    await accomplishGoal(db, ctx, g.id, '2026-06-05');
    const d = await loadChildPersonal(db, ctx.childId);
    expect(d.goals).toHaveLength(1);
    expect(d.achievements).toHaveLength(1);
    expect(accomplishmentsOf(d.goals, d.achievements).map((x) => x.kind)).toEqual(['goal', 'achievement']);
    await updateAchievement(db, ctx, a.id, { title: 'Fictional first steps', appCategory: 'gross-motor', description: 'x', achievedDate: '2026-06-04' });
    const e = (await loadChildPersonal(db, ctx.childId)).events.filter((x) => x.itemId === a.id);
    expect(e.map((x) => x.type)).toEqual(['created', 'date-corrected']);
  });
});

describe('Notes & Observations and permanent erasure', () => {
  it('add, edit, remove; erase removes every version of that entry only — never identical text elsewhere', async () => {
    const g1 = await createGoal(db, ctx, goalInput({ title: 'Fictional one' }));
    const g2 = await createGoal(db, ctx, goalInput({ title: 'Fictional two' }));
    const same = 'Fictional identical text';
    await addItemObservation(db, ctx, g1.id, '2026-06-10', same);
    await addItemObservation(db, ctx, g2.id, '2026-06-10', same);
    await addItemObservation(db, ctxB, (await createGoal(db, ctxB, goalInput())).id, '2026-06-10', same);
    await addObservation(db, { ...ctx, ageBasis: { basis: 'chronological', milestoneAgeMonths: 15 } }, { kind: 'sourced', defId: 'cdc22-m12-mp-01' }, '2026-06-10', same);
    let d = await loadChildPersonal(db, ctx.childId);
    const obs = d.events.find((e) => e.itemId === g1.id && e.type === 'observation')!;
    await editItemObservation(db, ctx, g1.id, obs.id, '2026-06-11', 'Fictional edited text');
    d = await loadChildPersonal(db, ctx.childId);
    expect(itemNotesAndObservations(d.events, g1.id)).toEqual([expect.objectContaining({ kind: 'observation', text: 'Fictional edited text', date: '2026-06-11', edited: true })]);
    const edit = d.events.find((e) => e.type === 'observation-edited')!;
    await eraseItemEntry(db, ctx, g1.id, edit.id); // erasing an edit erases the whole entry
    d = await loadChildPersonal(db, ctx.childId);
    const g1Events = d.events.filter((e) => e.itemId === g1.id);
    expect(JSON.stringify(g1Events)).not.toContain('Fictional identical text');
    expect(JSON.stringify(g1Events)).not.toContain('Fictional edited text');
    expect(g1Events.some((e) => e.type === 'entry-erased')).toBe(true);
    // Unrelated records with identical text are untouched: the other goal, the other child, the milestone.
    expect(d.events.find((e) => e.itemId === g2.id && e.type === 'observation')!.text).toBe(same);
    expect((await loadChildPersonal(db, ctxB.childId)).events.find((e) => e.type === 'observation')!.text).toBe(same);
    expect((await loadChildMilestones(db, ctx.childId)).events.find((e) => e.type === 'observation')!.text).toBe(same);
    // Remove keeps the text in history (marked removed) until erased.
    const o2 = d.events.find((e) => e.itemId === g2.id && e.type === 'observation')!;
    await removeItemObservation(db, ctx, g2.id, o2.id);
    d = await loadChildPersonal(db, ctx.childId);
    expect(itemNotesAndObservations(d.events, g2.id)).toEqual([]);
    expect(d.events.find((e) => e.id === o2.id)!.text).toBe(same);
  });

  it('a failed save changes nothing (atomic): invalid date for an observation', async () => {
    const g = await createGoal(db, ctx, goalInput());
    const before = await loadChildPersonal(db, ctx.childId);
    await expect(addItemObservation(db, ctx, g.id, '2026-02-30', 'Fictional')).rejects.toThrow();
    expect(await loadChildPersonal(db, ctx.childId)).toEqual(before);
  });
});

describe('permanent deletion', () => {
  it('leaves only a content-free tombstone, removes history and links, and touches nothing else', async () => {
    const ex = await createExercise(db, ctx, { title: 'Fictional exercise', appCategory: null, instructions: '', origin: 'parent', providerName: '', source: null, goalIds: [], tracking: { method: 'simple' } }, { rule: { kind: 'asNeeded' }, sessionsPerDay: 1, startDate: TODAY });
    const g = await createGoal(db, ctx, goalInput({ title: 'Fictional secret title', description: 'Fictional secret description', exerciseIds: [ex.id] }));
    const keep = await createGoal(db, ctx, goalInput({ title: 'Fictional keep' }));
    await addItemObservation(db, ctx, g.id, '2026-06-10', 'Fictional secret note');
    await deleteItemPermanently(db, ctx, g.id, 'goal');
    const raw = await db.get('customItems', g.id);
    expect(raw).toMatchObject({ id: g.id, kind: 'goal' });
    expect(raw!['deletedAt']).toBeTruthy();
    expect(JSON.stringify(raw)).not.toContain('secret');
    expect(JSON.stringify(await db.getAll('itemEvents'))).not.toContain('secret');
    const d = await loadChildPersonal(db, ctx.childId);
    expect(d.goals.map((x) => x.id)).toEqual([keep.id]);
    expect(d.exercises[0]!.goalIds).toEqual([]);
    await expect(deleteItemPermanently(db, ctx, g.id, 'goal')).rejects.toThrow();
  });

  it('another child’s records can’t be changed or deleted from this child’s context', async () => {
    const gB = await createGoal(db, ctxB, goalInput());
    await expect(accomplishGoal(db, ctx, gB.id, '2026-06-10')).rejects.toThrow();
    await expect(deleteItemPermanently(db, ctx, gB.id, 'goal')).rejects.toThrow();
    expect((await loadChildPersonal(db, ctxB.childId)).goals).toHaveLength(1);
    expect((await loadChildPersonal(db, ctx.childId)).goals).toHaveLength(0);
  });
});
