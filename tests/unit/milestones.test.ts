import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { openRcrDb, type RcrDB } from '../../src/data/db';
import { ensureMeta } from '../../src/data/repositories/metaRepo';
import { createChild, deleteChild } from '../../src/data/repositories/childrenRepo';
import {
  MilestoneInputError, addObservation, correctAchievedDate, createPersonalVersion, eraseEntryText, loadChildMilestones,
  removeObservation, setHidden, setNote, setStatus, updatePersonalVersion, type WriteContext,
} from '../../src/data/repositories/milestonesRepo';
import { MILESTONES, currentProgress, cumulativeThroughInterval, intervalProgress, isApplicable, type RecordState } from '../../src/domain/milestones';
import { observationsFor, recentProgressEvents, stateAsRecordedAt } from '../../src/domain/milestoneHistory';
import { viewingAge } from '../../src/domain/age';
import { intervalForAge } from '../../src/domain/intervals';
import { SAMPLE_CHILD_A, SAMPLE_CHILD_B } from '../fixtures/children';
import type { MilestoneRecord } from '../../src/types';

const at2m = ['cdc22-m02-se-01', 'cdc22-m02-se-02', 'cdc22-m02-se-03', 'cdc22-m02-se-04', 'cdc22-m02-lc-01', 'cdc22-m02-lc-02', 'cdc22-m02-cg-01', 'cdc22-m02-cg-02', 'cdc22-m02-mp-01', 'cdc22-m02-mp-02', 'cdc22-m02-mp-03'];
const recMap = (entries: Array<[string, Partial<RecordState>]>) => new Map(entries.map(([k, v]) => [k, { status: 'not-yet', hidden: false, ...v } as RecordState]));

describe('applicability (developmental reference age)', () => {
  it('a milestone applies once the milestone age (completed months) reaches its reference age', () => {
    const m4 = { referenceAgeMonths: 4 };
    expect(isApplicable(m4, 3)).toBe(false);
    expect(isApplicable(m4, 4)).toBe(true); // exact reference age
    expect(isApplicable(m4, 61)).toBe(true);
    expect(isApplicable(m4, null)).toBe(false); // before corrected due date
  });

  it('newborn: nothing applicable; current interval 0–3', () => {
    const v = viewingAge('2026-11-26', null, 'chronological', '2026-11-26');
    expect(v.months).toBe(0);
    expect(currentProgress(v.months, new Map()).overall).toMatchObject({ applicable: 0, state: 'none-applicable', percent: null });
    expect(intervalForAge(v.months).label).toBe('0–3 months');
  });

  it('exact boundary: at 2 months 0 days the 2-month milestones apply and stay in the current interval', () => {
    const v = viewingAge('2026-01-31', null, 'chronological', '2026-03-31'); // month-end DOB → 2 months on Mar 31
    expect(v.months).toBe(2);
    expect(currentProgress(v.months, new Map()).overall.applicable).toBe(11);
    expect(intervalForAge(v.months).label).toBe('0–3 months');
    const dayBefore = viewingAge('2026-01-31', null, 'chronological', '2026-03-30');
    expect(currentProgress(dayBefore.months, new Map()).overall.applicable).toBe(0);
  });

  it('three-month boundaries: at exactly 6 months, 4- and 6-month milestones are applicable and the 3–6 interval is current', () => {
    const v = viewingAge('2026-01-15', null, 'chronological', '2026-07-15');
    expect(v.months).toBe(6);
    expect(currentProgress(v.months, new Map()).overall.applicable).toBe(11 + 13 + 12);
    expect(intervalForAge(v.months).label).toBe('3–6 months');
    expect(intervalForAge(viewingAge('2026-01-15', null, 'chronological', '2026-08-15').months).label).toBe('6–9 months');
  });

  it('leap-day birthday reaches 1 year on Feb 28 of a non-leap year', () => {
    const v = viewingAge('2024-02-29', null, 'chronological', '2025-02-28');
    expect(v.months).toBe(12);
    expect(currentProgress(v.months, new Map()).overall.applicable).toBe(11 + 13 + 12 + 13 + 10);
  });

  it('fifth birthday: all 159 applicable; older children too (no invented milestones beyond 5)', () => {
    expect(currentProgress(viewingAge('2020-06-10', null, 'chronological', '2025-06-10').months, new Map()).overall.applicable).toBe(159);
    expect(currentProgress(viewingAge('2018-06-10', null, 'chronological', '2025-06-10').months, new Map()).overall.applicable).toBe(159);
    expect(intervalForAge(85).label).toBe('57–60 months');
  });

  it('corrected age: used only when chosen; before the due date nothing applies', () => {
    const dob = '2026-01-01';
    const due = '2026-02-26'; // born at 32 weeks
    expect(viewingAge(dob, due, 'corrected', '2026-02-10').months).toBeNull();
    expect(currentProgress(viewingAge(dob, due, 'corrected', '2026-02-10').months, new Map()).overall.state).toBe('none-applicable');
    // On May 1: 4 months chronological (2- and 4-month milestones), 2 months corrected (2-month only)
    expect(currentProgress(viewingAge(dob, due, 'chronological', '2026-05-01').months, new Map()).overall.applicable).toBe(24);
    expect(currentProgress(viewingAge(dob, due, 'corrected', '2026-05-01').months, new Map()).overall.applicable).toBe(11);
    // Corrected age reaches 2 months exactly on Apr 26; the day before, nothing applies yet
    expect(currentProgress(viewingAge(dob, due, 'corrected', '2026-04-26').months, new Map()).overall.applicable).toBe(11);
    expect(currentProgress(viewingAge(dob, due, 'corrected', '2026-04-25').months, new Map()).overall.applicable).toBe(0);
  });
});

describe('progress calculation rules', () => {
  const twoMonthOld = 2;
  it('achieved ÷ applicable; emerging gets no partial credit; counts are shown', () => {
    const p = currentProgress(twoMonthOld, recMap([[at2m[0]!, { status: 'achieved' }], [at2m[1]!, { status: 'emerging' }]])).overall;
    expect(p).toMatchObject({ applicable: 11, achieved: 1, emerging: 1, notYet: 9, hidden: 0, state: 'ok', percent: 9 });
  });

  it('future milestones are excluded, even if recorded early', () => {
    const early = MILESTONES.find((m) => m.referenceAgeMonths === 4)!.id;
    const p = currentProgress(twoMonthOld, recMap([[early, { status: 'achieved' }]])).overall;
    expect(p).toMatchObject({ applicable: 11, achieved: 0 });
  });

  it('hidden milestones are excluded from numerator and denominator', () => {
    const p = currentProgress(twoMonthOld, recMap([[at2m[0]!, { status: 'achieved', hidden: true }], [at2m[1]!, { status: 'achieved' }]])).overall;
    expect(p).toMatchObject({ applicable: 10, achieved: 1, hidden: 1 });
  });

  it('zero denominator gives a neutral state, never 0% or 100%', () => {
    expect(currentProgress(1, new Map()).overall).toMatchObject({ state: 'none-applicable', percent: null });
    const sixMonthFine = currentProgress(6, new Map()).categories.find((c) => c.category === 'fine-motor')!;
    expect(sixMonthFine.applicable).toBeGreaterThan(0); // 2- and 4-month fine motor apply
    const allHidden = currentProgress(twoMonthOld, recMap(at2m.filter((id) => id.includes('-mp-')).map((id) => [id, { status: 'achieved', hidden: true }])));
    const gross = allHidden.categories.find((c) => c.category === 'gross-motor')!;
    expect(gross).toMatchObject({ state: 'all-hidden', percent: null, applicable: 0, hidden: 2 });
  });

  it('interval progress vs cumulative progress are distinct', () => {
    const recs = recMap([[at2m[0]!, { status: 'achieved' }]]);
    expect(intervalProgress(1, recs).overall).toMatchObject({ applicable: 25, achieved: 0 }); // 3–6 months
    expect(cumulativeThroughInterval(1, recs).overall).toMatchObject({ applicable: 36, achieved: 1 }); // through 6 months
    expect(intervalProgress(6, recs).overall.state).toBe('none-applicable'); // empty interval 18–21
  });

  it('category progress is per category; each milestone counted once', () => {
    const p = currentProgress(60, new Map());
    expect(p.categories.map((c) => c.applicable)).toEqual([20, 24, 33, 40, 42]);
    expect(p.categories.reduce((n, c) => n + c.applicable, 0)).toBe(p.overall.applicable);
  });
});

describe('milestone storage and history', () => {
  let db: RcrDB;
  let n = 0;
  let ctx: WriteContext;
  let childB: string;
  beforeEach(async () => {
    db = await openRcrDb(`ms-${++n}`);
    const { deviceId } = await ensureMeta(db);
    const a = await createChild(db, deviceId, { ...SAMPLE_CHILD_A, dob: '2025-01-10' });
    childB = (await createChild(db, deviceId, SAMPLE_CHILD_B)).id;
    ctx = { deviceId, childId: a.id, dob: '2025-01-10', today: '2026-11-26', ageBasis: { basis: 'chronological', milestoneAgeMonths: 22 } };
  });
  afterEach(() => db.close());
  const def = { kind: 'sourced' as const, defId: 'cdc22-m04-mp-02' };

  it('status changes and reversals keep full history; current record reflects latest', async () => {
    await setStatus(db, ctx, def, 'emerging', '2025-04-20');
    await setStatus(db, ctx, def, 'achieved', '2025-05-02');
    await setStatus(db, ctx, def, 'emerging', '2025-05-10'); // reversal
    const d = await loadChildMilestones(db, ctx.childId);
    expect(d.records).toHaveLength(1);
    expect(d.records[0]).toMatchObject({ status: 'emerging', firstObservedDate: '2025-04-20', achievedDate: null });
    expect(d.events.map((e) => [e.type, e.fromStatus, e.toStatus])).toEqual([
      ['status', 'not-yet', 'emerging'],
      ['status', 'emerging', 'achieved'],
      ['status', 'achieved', 'emerging'],
    ]);
    for (const e of d.events) {
      expect(e.ageBasis).toEqual({ basis: 'chronological', milestoneAgeMonths: 22 });
      expect(e.deviceId).toBe(ctx.deviceId);
      expect(e.recordKey).toBe('def:cdc22-m04-mp-02');
      expect(e.id).toMatch(/^[0-9a-f-]{36}$/);
    }
  });

  it('achievement-date corrections keep the previous and corrected dates', async () => {
    await setStatus(db, ctx, def, 'achieved', '2025-05-02');
    await correctAchievedDate(db, ctx, def, '2025-04-28');
    const d = await loadChildMilestones(db, ctx.childId);
    expect(d.records[0]!.achievedDate).toBe('2025-04-28');
    expect(d.events.at(-1)).toMatchObject({ type: 'achieved-date-corrected', fromDate: '2025-05-02', toDate: '2025-04-28' });
    await expect(correctAchievedDate(db, ctx, { kind: 'sourced', defId: 'cdc22-m02-se-01' }, '2025-04-28')).rejects.toThrow(MilestoneInputError);
  });

  it('rejects dates in the future or before birth', async () => {
    await expect(setStatus(db, ctx, def, 'achieved', '2026-11-27')).rejects.toThrow(/future/);
    await expect(setStatus(db, ctx, def, 'achieved', '2025-01-09')).rejects.toThrow(/before your child was born/);
    await expect(addObservation(db, ctx, def, '2026-02-30', 'x')).rejects.toThrow(/real/);
  });

  it('observations do not change status; removal is a marker; permanent erase removes the text', async () => {
    await addObservation(db, ctx, def, '2025-04-01', 'Fictional note: held rattle briefly');
    let d = await loadChildMilestones(db, ctx.childId);
    expect(d.records[0]!.status).toBe('not-yet');
    const obsId = d.events[0]!.id;
    await removeObservation(db, ctx, def, obsId);
    d = await loadChildMilestones(db, ctx.childId);
    let obs = observationsFor(d.events, d.records[0]!.id);
    expect(obs[0]).toMatchObject({ removed: true, erased: false, text: 'Fictional note: held rattle briefly' }); // still in local history
    await eraseEntryText(db, ctx, def, obsId);
    d = await loadChildMilestones(db, ctx.childId);
    obs = observationsFor(d.events, d.records[0]!.id);
    expect(obs[0]).toMatchObject({ removed: true, erased: true, text: null });
    expect(JSON.stringify(d.events)).not.toContain('held rattle'); // gone from storage
    expect(d.events.at(-1)!.type).toBe('entry-erased');
  });

  it('notes are versioned in history; erasing the current note clears it', async () => {
    await setNote(db, ctx, def, 'First fictional note');
    await setNote(db, ctx, def, 'Second fictional note');
    let d = await loadChildMilestones(db, ctx.childId);
    expect(d.records[0]!.note).toBe('Second fictional note');
    const notes = d.events.filter((e) => e.type === 'note');
    expect(notes.map((e) => e.text)).toEqual(['First fictional note', 'Second fictional note']);
    await eraseEntryText(db, ctx, def, notes[1]!.id);
    d = await loadChildMilestones(db, ctx.childId);
    expect(d.records[0]!.note).toBe('');
  });

  it('hide and restore keep status and history', async () => {
    await setStatus(db, ctx, def, 'achieved', '2025-05-02');
    await setHidden(db, ctx, def, true);
    await setHidden(db, ctx, def, false);
    const d = await loadChildMilestones(db, ctx.childId);
    expect(d.records[0]).toMatchObject({ status: 'achieved', achievedDate: '2025-05-02', hidden: false });
    expect(d.events.map((e) => [e.type, e.hiddenAtTime])).toEqual([['status', false], ['hidden', true], ['restored', false]]);
  });

  it('history can be reconstructed as recorded at a past moment, independent of later corrections', async () => {
    await setStatus(db, ctx, def, 'achieved', '2025-05-02');
    const first = (await loadChildMilestones(db, ctx.childId)).events[0]!.recordedAt;
    await new Promise((r) => setTimeout(r, 5));
    await correctAchievedDate(db, ctx, def, '2025-04-28');
    await setHidden(db, ctx, def, true);
    const d = await loadChildMilestones(db, ctx.childId);
    expect(stateAsRecordedAt(d.events, first).get('def:cdc22-m04-mp-02')).toEqual({ status: 'achieved', hidden: false, achievedDate: '2025-05-02' });
    expect(stateAsRecordedAt(d.events, '9999-12-31T00:00:00.000Z').get('def:cdc22-m04-mp-02')).toEqual({ status: 'achieved', hidden: true, achievedDate: '2025-04-28' });
  });

  it('personal versions are separate records and never modify the sourced milestone', async () => {
    await setStatus(db, ctx, def, 'emerging', '2025-04-20');
    const pv = await createPersonalVersion(db, ctx, { title: 'Holds the blue rattle', description: 'Our version', derivedFromDefId: def.defId, appCategory: 'fine-motor', referenceAgeMonths: 4 });
    const pt = { kind: 'personal' as const, customId: pv.id };
    await setStatus(db, ctx, pt, 'achieved', '2025-05-01');
    await updatePersonalVersion(db, ctx, pv.id, { title: 'Holds rattle', description: '' });
    const d = await loadChildMilestones(db, ctx.childId);
    expect(d.personal).toHaveLength(1);
    expect(d.personal[0]).toMatchObject({ title: 'Holds rattle', derivedFromDefId: def.defId });
    const sourced = d.records.find((r) => r.milestoneDefId === def.defId)!;
    const personal = d.records.find((r) => r.customItemId === pv.id)!;
    expect(sourced.status).toBe('emerging'); // untouched
    expect(personal.status).toBe('achieved');
    expect(MILESTONES.find((m) => m.id === def.defId)!.text).toBe('Holds a toy when you put it in his hand');
    // Personal versions never count in sourced progress
    const map = new Map(d.records.filter((r) => r.milestoneDefId).map((r) => [r.milestoneDefId!, { status: r.status, hidden: r.hidden }]));
    expect(currentProgress(22, map).overall.achieved).toBe(0);
  });

  it('records are isolated per child', async () => {
    await setStatus(db, ctx, def, 'achieved', '2025-05-02');
    expect((await loadChildMilestones(db, childB)).records).toHaveLength(0);
    await setStatus(db, { ...ctx, childId: childB, dob: '2023-08-30' }, def, 'emerging', '2024-01-01');
    expect((await loadChildMilestones(db, ctx.childId)).records[0]!.status).toBe('achieved');
    expect((await loadChildMilestones(db, childB)).records[0]!.status).toBe('emerging');
  });

  it('a storage failure mid-operation leaves nothing half-written', async () => {
    const before = { records: await db.count('milestoneRecords'), events: await db.count('milestoneEvents'), items: await db.count('customItems') };
    // Inject a failure INSIDE the transaction: the record write is queued first, then the history
    // entry fails to store (it carries an unstorable value), so the whole transaction must roll back.
    const failing: WriteContext = { ...ctx, ageBasis: { basis: 'chronological', milestoneAgeMonths: (() => 1) as unknown as number } };
    await expect(setStatus(db, failing, def, 'achieved', '2025-05-02')).rejects.toThrow();
    await expect(addObservation(db, failing, def, '2025-04-01', 'Fictional')).rejects.toThrow();
    await expect(createPersonalVersion(db, failing, { title: 'Mine', description: '', derivedFromDefId: null, appCategory: 'cognitive', referenceAgeMonths: null })).rejects.toThrow();
    expect(await db.count('milestoneRecords')).toBe(before.records);
    expect(await db.count('milestoneEvents')).toBe(before.events);
    expect(await db.count('customItems')).toBe(before.items); // custom item rolled back with its record and event
  });

  it('deleting a profile removes all milestone records, history and personal versions', async () => {
    await setStatus(db, ctx, def, 'achieved', '2025-05-02');
    await addObservation(db, ctx, def, '2025-04-01', 'Fictional');
    await createPersonalVersion(db, ctx, { title: 'Mine', description: '', derivedFromDefId: null, appCategory: 'cognitive', referenceAgeMonths: null });
    await deleteChild(db, ctx.deviceId, ctx.childId, { purgeFromBackups: true });
    for (const s of ['milestoneRecords', 'milestoneEvents', 'customItems'] as const) {
      const rows = await db.getAll(s);
      expect(rows.filter((r) => r['childId'] === ctx.childId)).toEqual([]);
    }
  });

  it('recent progress lists latest achieved/emerging changes', async () => {
    await setStatus(db, ctx, def, 'achieved', '2025-05-02');
    await setStatus(db, ctx, { kind: 'sourced', defId: 'cdc22-m02-se-01' }, 'emerging', '2025-03-01');
    const d = await loadChildMilestones(db, ctx.childId);
    expect(recentProgressEvents(d.events).map((e) => e.recordKey)).toEqual(['def:cdc22-m04-mp-02', 'def:cdc22-m02-se-01']);
  });

  it('never infers achievements: achieving a later milestone does not change earlier ones', async () => {
    await setStatus(db, ctx, { kind: 'sourced', defId: 'cdc22-m12-mp-01' }, 'achieved', '2026-01-01');
    const recs: MilestoneRecord[] = (await loadChildMilestones(db, ctx.childId)).records;
    expect(recs).toHaveLength(1);
  });
});
