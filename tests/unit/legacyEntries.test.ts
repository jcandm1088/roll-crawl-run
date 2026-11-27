/**
 * Legacy personal milestone entries: explicit conversion and permanent deletion (D9, D10). FICTIONAL data.
 */
import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { openRcrDb, type RcrDB } from '../../src/data/db';
import { ensureMeta } from '../../src/data/repositories/metaRepo';
import { createChild } from '../../src/data/repositories/childrenRepo';
import {
  addObservation, createPersonalVersion, editObservation, eraseEntryText, loadChildMilestones, removeObservation, setNote, setStatus, type WriteContext,
} from '../../src/data/repositories/milestonesRepo';
import { convertLegacyEntry, deleteLegacyEntry } from '../../src/data/repositories/legacyRepo';
import { editItemObservation, eraseItemEntry, loadChildPersonal, type PersonalContext } from '../../src/data/repositories/personalRepo';
import { itemNotesAndObservations, itemObservations } from '../../src/domain/itemHistory';
import { currentProgress, type RecordState } from '../../src/domain/milestones';
import { accomplishmentsOf, personalSummary } from '../../src/domain/personalProgress';
import { SAMPLE_CHILD_A } from '../fixtures/children';

let db: RcrDB;
let mctx: WriteContext;
let pctx: PersonalContext;
let n = 0;
const TODAY = '2026-06-15';

beforeEach(async () => {
  db = await openRcrDb(`legacy-${++n}`);
  const { deviceId } = await ensureMeta(db);
  const a = await createChild(db, deviceId, SAMPLE_CHILD_A);
  mctx = { deviceId, childId: a.id, dob: a.dob, today: TODAY, ageBasis: { basis: 'chronological', milestoneAgeMonths: 16 } };
  pctx = { deviceId, childId: a.id, dob: a.dob, today: TODAY };
});
afterEach(() => db.close());

async function legacy(title = 'Fictional personal entry', derivedFromDefId: string | null = 'cdc22-m15-se-05') {
  const item = await createPersonalVersion(db, mctx, { title, description: 'Fictional description', derivedFromDefId, appCategory: 'social-emotional', referenceAgeMonths: 15 });
  return { item, t: { kind: 'personal' as const, customId: item.id } };
}

const progress = async () => {
  const d = await loadChildMilestones(db, mctx.childId);
  const m = new Map<string, RecordState>();
  for (const r of d.records) if (r.milestoneDefId) m.set(r.milestoneDefId, { status: r.status, hidden: r.hidden });
  return currentProgress(16, m);
};

describe('conversion', () => {
  it('nothing happens without an explicit action', async () => {
    await legacy();
    expect((await loadChildPersonal(db, mctx.childId)).goals).toEqual([]);
    expect((await loadChildMilestones(db, mctx.childId)).personal).toHaveLength(1);
  });

  it('an emerging entry becomes an active goal with an unknown start date, keeping text, area, related milestone and full history', async () => {
    const { item, t } = await legacy();
    await setStatus(db, mctx, t, 'emerging', '2026-05-01');
    await setNote(db, mctx, t, 'Fictional undated note');
    await addObservation(db, mctx, t, '2026-05-02', 'Fictional observation A');
    await addObservation(db, mctx, t, '2026-05-03', 'Fictional observation B');
    await addObservation(db, mctx, t, '2026-05-04', 'Fictional observation C');
    const before = await loadChildMilestones(db, mctx.childId);
    const [a, b, c] = before.events.filter((e) => e.type === 'observation');
    await editObservation(db, mctx, t, a!.id, '2026-05-05', 'Fictional observation A, edited');
    await removeObservation(db, mctx, t, b!.id);
    await eraseEntryText(db, mctx, t, c!.id);
    const progressBefore = await progress();

    const r = await convertLegacyEntry(db, pctx, item.id);
    expect(r.kind).toBe('goal');
    const d = await loadChildPersonal(db, mctx.childId);
    const g = d.goals[0]!;
    expect(g).toMatchObject({ title: 'Fictional personal entry', description: 'Fictional description', appCategory: 'social-emotional', status: 'active', startDate: null, milestoneDefId: 'cdc22-m15-se-05', convertedFrom: { legacyCustomItemId: item.id } });
    const entries = itemNotesAndObservations(d.events, g.id);
    expect(entries).toEqual([
      { kind: 'undated-note', text: 'Fictional undated note', savedOn: expect.any(String) },
      expect.objectContaining({ kind: 'observation', text: 'Fictional observation A, edited', date: '2026-05-05', edited: true }),
    ]);
    const obs = itemObservations(d.events, g.id);
    expect(obs.find((o) => o.removed)!.text).toBe('Fictional observation B'); // removed, still in history
    expect(obs.find((o) => o.erased)!.text).toBeNull(); // erased stays erased
    expect(JSON.stringify(d.events)).not.toContain('Fictional observation C');
    // Every reference points inside the copied history; recording times are kept.
    const ids = new Set(d.events.map((e) => e.id));
    for (const e of d.events) if (e.refEventId) expect(ids.has(e.refEventId), e.type).toBe(true);
    expect(d.events.find((e) => e.type === 'legacy-status')).toMatchObject({ toStatus: 'emerging', eventDate: '2026-05-01' });
    // The legacy entry is a content-free tombstone; its milestone record and history are gone; Progress unchanged.
    const after = await loadChildMilestones(db, mctx.childId);
    expect(after.personal).toEqual([]);
    expect(after.records).toEqual([]);
    expect(after.events).toEqual([]);
    const raw = await db.get('customItems', item.id);
    expect(raw).toMatchObject({ convertedToItemId: g.id, kind: 'milestone' });
    expect(JSON.stringify(raw)).not.toContain('Fictional');
    expect(await progress()).toEqual(progressBefore);
  });

  it('converted observations can be edited and permanently erased afterwards', async () => {
    const { item, t } = await legacy();
    await addObservation(db, mctx, t, '2026-05-02', 'Fictional observation to erase');
    const { id } = await convertLegacyEntry(db, pctx, item.id);
    let d = await loadChildPersonal(db, mctx.childId);
    const o = d.events.find((e) => e.type === 'observation')!;
    await editItemObservation(db, pctx, id, o.id, '2026-05-03', 'Fictional observation, edited after');
    d = await loadChildPersonal(db, mctx.childId);
    const edit = d.events.find((e) => e.type === 'observation-edited')!;
    await eraseItemEntry(db, pctx, id, edit.id);
    d = await loadChildPersonal(db, mctx.childId);
    expect(JSON.stringify(d.events)).not.toMatch(/Fictional observation (to erase|, edited after)/);
    expect(itemNotesAndObservations(d.events, id)).toEqual([]);
  });

  it('an achieved entry becomes an achievement with its recorded date, counted once', async () => {
    const { item, t } = await legacy();
    await setStatus(db, mctx, t, 'achieved', '2026-04-20');
    const r = await convertLegacyEntry(db, pctx, item.id);
    expect(r.kind).toBe('achievement');
    const d = await loadChildPersonal(db, mctx.childId);
    expect(d.achievements[0]).toMatchObject({ achievedDate: '2026-04-20', title: 'Fictional personal entry' });
    expect(accomplishmentsOf(d.goals, d.achievements)).toHaveLength(1);
    expect(personalSummary(d, TODAY).accomplishments).toBe(1);
  });

  it('an achieved entry without a date requires a known date; without one nothing changes', async () => {
    const { item, t } = await legacy();
    await setStatus(db, mctx, t, 'achieved', '2026-04-20');
    // Simulate an older record with no achievement date.
    const rec = (await loadChildMilestones(db, mctx.childId)).records[0]!;
    await db.put('milestoneRecords', { ...rec, achievedDate: null } as never);
    const snapshot = { items: await db.getAll('customItems'), records: await db.getAll('milestoneRecords'), events: await db.getAll('milestoneEvents') };
    await expect(convertLegacyEntry(db, pctx, item.id)).rejects.toThrow(/date/);
    expect({ items: await db.getAll('customItems'), records: await db.getAll('milestoneRecords'), events: await db.getAll('milestoneEvents') }).toEqual(snapshot);
    expect(await db.getAll('itemEvents')).toEqual([]);
    await expect(convertLegacyEntry(db, pctx, item.id, { achievedDate: '2026-07-01' })).rejects.toThrow(/future/);
    const r = await convertLegacyEntry(db, pctx, item.id, { achievedDate: '2026-04-21' });
    expect((await loadChildPersonal(db, mctx.childId)).achievements[0]!.achievedDate).toBe('2026-04-21');
    expect(r.kind).toBe('achievement');
  });

  it('is idempotent: converting twice (or from two copies) creates one record', async () => {
    const { item } = await legacy();
    const [x, y] = await Promise.all([convertLegacyEntry(db, pctx, item.id), convertLegacyEntry(db, pctx, item.id)]);
    expect(x.id).toBe(y.id);
    expect((await loadChildPersonal(db, mctx.childId)).goals).toHaveLength(1);
    expect((await convertLegacyEntry(db, pctx, item.id)).id).toBe(x.id);
  });

  it('a known start date can be supplied; it is never invented', async () => {
    const { item } = await legacy('Fictional with start', null);
    await convertLegacyEntry(db, pctx, item.id, { startDate: '2026-03-01' });
    const g = (await loadChildPersonal(db, mctx.childId)).goals[0]!;
    expect(g.startDate).toBe('2026-03-01');
    expect(g.milestoneDefId).toBeNull();
  });
});

describe('permanent deletion', () => {
  it('removes the entry, its status, notes and history; leaves a content-free tombstone; touches nothing else', async () => {
    const { item, t } = await legacy('Fictional delete me');
    const { item: keep, t: tk } = await legacy('Fictional keep me');
    const same = 'Fictional identical note';
    await setNote(db, mctx, t, same);
    await setNote(db, mctx, tk, same);
    await setStatus(db, mctx, { kind: 'sourced', defId: 'cdc22-m12-mp-01' }, 'achieved', '2026-05-01');
    const progressBefore = await progress();
    await deleteLegacyEntry(db, pctx, item.id);
    const d = await loadChildMilestones(db, mctx.childId);
    expect(d.personal.map((p) => p.id)).toEqual([keep.id]);
    expect(d.records.find((r) => r.customItemId === keep.id)!.note).toBe(same);
    expect(JSON.stringify(d.events)).not.toContain('Fictional delete me');
    expect(JSON.stringify(await db.get('customItems', item.id))).not.toContain('Fictional');
    expect(await progress()).toEqual(progressBefore);
    await deleteLegacyEntry(db, pctx, item.id); // repeating is harmless
    await expect(convertLegacyEntry(db, pctx, item.id)).rejects.toThrow();
  });
});
