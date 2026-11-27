/**
 * Journal storage (Checkpoint 4): the `journal` store that has existed since database version 1, used at
 * database version 3 with no migration. Create, read, update, delete; the answered toggle; child
 * isolation; profile deletion; full reset; failed writes. FICTIONAL data only.
 */
import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it } from 'vitest';
import { CHILD_SCOPED_STORES, DB_VERSION, openRcrDb, type RcrDB } from '../../src/data/db';
import { ensureMeta, getSettings, updateSettings } from '../../src/data/repositories/metaRepo';
import { createChild, deleteChild } from '../../src/data/repositories/childrenRepo';
import { createEntry, deleteEntry, listEntries, setAnswered, updateEntry } from '../../src/data/repositories/journalRepo';
import { createEvent, listEvents } from '../../src/data/repositories/eventsRepo';
import { createGoal, loadChildPersonal } from '../../src/data/repositories/personalRepo';
import { setStatus, loadChildMilestones } from '../../src/data/repositories/milestonesRepo';
import { deleteAllData } from '../../src/data/storage';
import { JournalInputError, type JournalInput } from '../../src/domain/journal';
import { SAMPLE_CHILD_A, SAMPLE_CHILD_B } from '../fixtures/children';

const TODAY = '2026-11-27';
let n = 0;
const opened: RcrDB[] = [];
afterEach(() => opened.splice(0).forEach((d) => d.close()));

async function setup() {
  const name = `journal-${++n}`;
  const db = await openRcrDb(name);
  opened.push(db);
  const { deviceId } = await ensureMeta(db);
  const a = await createChild(db, deviceId, SAMPLE_CHILD_A);
  const b = await createChild(db, deviceId, SAMPLE_CHILD_B);
  return { name, db, deviceId, a, b, ctxA: { deviceId, childId: a.id, today: TODAY }, ctxB: { deviceId, childId: b.id, today: TODAY } };
}
const input = (over: Partial<JournalInput> = {}): JournalInput => ({ type: 'reflection', date: TODAY, title: '', body: 'Fictional entry', tags: '', isProviderQuestion: false, answered: false, ...over });
const question = (over: Partial<JournalInput> = {}): JournalInput => input({ type: 'care', title: 'Fictional question', body: 'Fictional: is this expected?', isProviderQuestion: true, ...over });

describe('the journal uses the existing store at database version 3', () => {
  it('needs no new version, store or index', async () => {
    const { db } = await setup();
    expect(DB_VERSION).toBe(3);
    expect(db.version).toBe(3);
    expect([...db.transaction('journal').store.indexNames]).toEqual(['byChild']);
    expect(CHILD_SCOPED_STORES).toContain('journal');
    expect([...db.objectStoreNames].sort()).toEqual([
      'backups', 'children', 'completions', 'customItems', 'eventCompletions', 'events', 'idAliases', 'itemEvents', 'journal',
      'mergeBases', 'meta', 'milestoneEvents', 'milestoneRecords', 'photos', 'referenceAnnotations', 'settings', 'trackerState',
    ]);
  });
});

describe('create, view, edit, delete', () => {
  it('creates a Personal Reflection with only a date and text', async () => {
    const { db, ctxA, a, deviceId } = await setup();
    const e = await createEntry(db, ctxA, input());
    expect(e).toMatchObject({ recordType: 'journalEntry', childId: a.id, type: 'reflection', date: TODAY, title: '', body: 'Fictional entry', tags: [], isProviderQuestion: false, answered: false, rev: 1, deletedAt: null, originDeviceId: deviceId });
    expect(await listEntries(db, a.id)).toEqual([e]);
  });

  it('creates a Care Note with a title, tags and a provider question, backdated', async () => {
    const { db, ctxA, a } = await setup();
    const e = await createEntry(db, ctxA, question({ date: '2026-03-01', tags: 'sleep, Night waking' }));
    expect(e).toMatchObject({ type: 'care', date: '2026-03-01', title: 'Fictional question', tags: ['sleep', 'Night waking'], isProviderQuestion: true, answered: false });
    expect((await listEntries(db, a.id))[0]).toEqual(e);
  });

  it('stores a long entry whole', async () => {
    const { db, ctxA, a } = await setup();
    const long = Array.from({ length: 300 }, (_, i) => `Fictional paragraph ${i + 1}, with several words in it.`).join('\n\n');
    await createEntry(db, ctxA, input({ body: long }));
    expect((await listEntries(db, a.id))[0]!.body).toBe(long);
  });

  it('edits in place, keeping the id and creation time', async () => {
    const { db, ctxA, a } = await setup();
    const e = await createEntry(db, ctxA, input({ title: 'Fictional before' }));
    const edited = await updateEntry(db, ctxA, e.id, question({ title: 'Fictional after', date: '2026-11-01', tags: 'sleep' }));
    expect(edited).toMatchObject({ id: e.id, createdAt: e.createdAt, rev: 2, type: 'care', title: 'Fictional after', date: '2026-11-01', tags: ['sleep'], isProviderQuestion: true });
    expect(await listEntries(db, a.id)).toEqual([edited]);
  });

  it('changing a question into a Personal Reflection drops the question flag and the answered status', async () => {
    const { db, ctxA } = await setup();
    const e = await createEntry(db, ctxA, question({ answered: true }));
    expect(e.answered).toBe(true);
    const edited = await updateEntry(db, ctxA, e.id, { ...question({ answered: true }), type: 'reflection' });
    expect(edited).toMatchObject({ type: 'reflection', isProviderQuestion: false, answered: false, body: e.body });
  });

  it('deletes outright: no record, title, text, tag or tombstone remains', async () => {
    const { db, ctxA, a } = await setup();
    const keep = await createEntry(db, ctxA, input({ body: 'Fictional kept entry' }));
    const gone = await createEntry(db, ctxA, input({ title: 'Fictional private title', body: 'Fictional private writing', tags: 'fictional-private-tag' }));
    await deleteEntry(db, ctxA, gone.id);
    expect(await listEntries(db, a.id)).toEqual([keep]);
    expect(await db.get('journal', gone.id)).toBeUndefined();
    const everything: unknown[] = [];
    for (const s of db.objectStoreNames) everything.push(await db.getAll(s as never));
    expect(JSON.stringify(everything)).not.toMatch(/Fictional private|fictional-private-tag/);
    await expect(deleteEntry(db, ctxA, gone.id)).rejects.toThrow('That entry no longer exists.');
  });

  it('a retried save with the same form id never creates a duplicate', async () => {
    const { db, ctxA, a, ctxB } = await setup();
    const first = await createEntry(db, ctxA, input(), 'form-1');
    const again = await createEntry(db, ctxA, input({ body: 'Fictional second attempt' }), 'form-1');
    expect(again).toEqual(first);
    expect(await listEntries(db, a.id)).toHaveLength(1);
    await expect(createEntry(db, ctxB, input(), 'form-1')).rejects.toThrow(JournalInputError); // the id is another child's
  });
});

describe('provider questions', () => {
  it('marking a question answered changes only that field; the note is otherwise exactly as written', async () => {
    const { db, ctxA, a } = await setup();
    const q = await createEntry(db, ctxA, question({ tags: 'sleep', date: '2026-11-20' }));
    const answered = await setAnswered(db, ctxA, q.id, true);
    const { answered: _a, updatedAt: _u, rev: _r, lastModifiedBy: _l, ...rest } = answered;
    const { answered: _a0, updatedAt: _u0, rev: _r0, lastModifiedBy: _l0, ...restBefore } = q;
    expect(rest).toEqual(restBefore);
    expect(answered.answered).toBe(true);
    expect(answered.rev).toBe(2);
    expect(await listEntries(db, a.id)).toEqual([answered]); // still in the journal: not deleted, hidden or replaced
    const back = await setAnswered(db, ctxA, q.id, false);
    expect(back).toMatchObject({ answered: false, body: q.body, title: q.title, tags: q.tags, date: q.date, rev: 3 });
  });

  it('setting the status it already has writes nothing', async () => {
    const { db, ctxA } = await setup();
    const q = await createEntry(db, ctxA, question());
    expect(await setAnswered(db, ctxA, q.id, false)).toEqual(q);
  });

  it('only a Care Note flagged as a question can be marked answered', async () => {
    const { db, ctxA, a } = await setup();
    const reflection = await createEntry(db, ctxA, input());
    const plainNote = await createEntry(db, ctxA, input({ type: 'care' }));
    for (const e of [reflection, plainNote]) await expect(setAnswered(db, ctxA, e.id, true)).rejects.toThrow('That entry isn’t marked as a question for the provider.');
    expect((await listEntries(db, a.id)).every((e) => e.answered === false && e.rev === 1)).toBe(true);
  });

  it('the parent can edit the note to record the provider’s response, keeping the answered status', async () => {
    const { db, ctxA } = await setup();
    const q = await createEntry(db, ctxA, question());
    await setAnswered(db, ctxA, q.id, true);
    const edited = await updateEntry(db, ctxA, q.id, question({ answered: true, body: `${q.body}\n\nFictional response: yes, that is common.` }));
    expect(edited).toMatchObject({ answered: true, isProviderQuestion: true });
    expect(edited.body).toContain('Fictional response: yes, that is common.');
    expect(edited.body).toContain(q.body);
  });
});

describe('failed writes change nothing', () => {
  it('rejects invalid input before writing, and existing entries are untouched', async () => {
    const { db, ctxA, a } = await setup();
    const e = await createEntry(db, ctxA, input());
    await expect(createEntry(db, ctxA, input({ body: '   ' }))).rejects.toThrow(JournalInputError);
    await expect(createEntry(db, ctxA, input({ date: '2026-11-28' }))).rejects.toThrow('Please choose today or an earlier date.');
    await expect(updateEntry(db, ctxA, e.id, input({ body: '' }))).rejects.toThrow('Please write something before saving.');
    await expect(updateEntry(db, ctxA, e.id, input({ date: '2026-02-30' }))).rejects.toThrow('Please enter a valid date.');
    expect(await listEntries(db, a.id)).toEqual([e]);
  });

  it('a write that fails inside the transaction is rolled back completely', async () => {
    const { db, ctxA, a } = await setup();
    const e = await createEntry(db, ctxA, question());
    const raw = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function () { throw new DOMException('Simulated storage failure', 'QuotaExceededError'); };
    try {
      await expect(createEntry(db, ctxA, input({ body: 'Fictional unsaved' }))).rejects.toThrow();
      await expect(updateEntry(db, ctxA, e.id, input({ body: 'Fictional changed' }))).rejects.toThrow();
      await expect(setAnswered(db, ctxA, e.id, true)).rejects.toThrow();
    } finally {
      IDBObjectStore.prototype.put = raw;
    }
    expect(await listEntries(db, a.id)).toEqual([e]);
    const del = IDBObjectStore.prototype.delete;
    IDBObjectStore.prototype.delete = function () { throw new DOMException('Simulated storage failure', 'UnknownError'); };
    try {
      await expect(deleteEntry(db, ctxA, e.id)).rejects.toThrow();
    } finally {
      IDBObjectStore.prototype.delete = del;
    }
    expect(await listEntries(db, a.id)).toEqual([e]);
    // Afterwards everything works again.
    expect((await setAnswered(db, ctxA, e.id, true)).answered).toBe(true);
  });

  it('records it does not recognise are ignored and never altered', async () => {
    const { db, ctxA, a } = await setup();
    const stray = { id: 'stray-1', childId: a.id, body: 'Fictional record from somewhere else' };
    await db.put('journal', stray);
    const e = await createEntry(db, ctxA, input());
    expect(await listEntries(db, a.id)).toEqual([e]);
    await expect(updateEntry(db, ctxA, 'stray-1', input())).rejects.toThrow('That entry no longer exists.');
    await expect(deleteEntry(db, ctxA, 'stray-1')).rejects.toThrow('That entry no longer exists.');
    expect(await db.get('journal', 'stray-1')).toEqual(stray);
  });
});

describe('child isolation', () => {
  it('each child sees only their own entries', async () => {
    const { db, ctxA, ctxB, a, b } = await setup();
    const ea = await createEntry(db, ctxA, input({ body: 'Fictional A entry', tags: 'shared-tag' }));
    const eb = await createEntry(db, ctxB, question({ body: 'Fictional B question', tags: 'shared-tag' }));
    expect(await listEntries(db, a.id)).toEqual([ea]);
    expect(await listEntries(db, b.id)).toEqual([eb]);
    expect(await listEntries(db, 'no-such-child')).toEqual([]);
  });

  it('an editor opened for one child can never change, answer or delete another child’s entry', async () => {
    const { db, ctxA, ctxB, b } = await setup();
    const eb = await createEntry(db, ctxB, question({ body: 'Fictional B question' }));
    await expect(updateEntry(db, ctxA, eb.id, input({ body: 'Fictional overwrite' }))).rejects.toThrow('That entry belongs to another child’s journal, so nothing was changed.');
    await expect(setAnswered(db, ctxA, eb.id, true)).rejects.toThrow(/another child’s journal/);
    await expect(deleteEntry(db, ctxA, eb.id)).rejects.toThrow(/another child’s journal/);
    expect(await listEntries(db, b.id)).toEqual([eb]);
  });

  it('a save follows the editor’s child, not whichever child is active', async () => {
    const { db, ctxA, a, b } = await setup();
    await updateSettings(db, { activeChildId: b.id }); // the active child changed while A's editor was open
    const e = await createEntry(db, ctxA, input({ body: 'Fictional A entry' }));
    expect(e.childId).toBe(a.id);
    expect(await listEntries(db, b.id)).toEqual([]);
    expect((await getSettings(db)).activeChildId).toBe(b.id);
  });
});

describe('profile deletion and full reset', () => {
  it('deleting a profile erases that child’s entries only, and leaves other data alone', async () => {
    const { db, deviceId, ctxA, ctxB, a, b } = await setup();
    await createEntry(db, ctxA, input({ title: 'Fictional A title', body: 'Fictional A writing', tags: 'fictional-a-tag' }));
    await createEntry(db, ctxA, question({ body: 'Fictional A question' }));
    const eb = await createEntry(db, ctxB, input({ body: 'Fictional B entry' }));
    await createGoal(db, { deviceId, childId: b.id, dob: b.dob, today: TODAY }, { title: 'Fictional goal', appCategory: null, description: '', startDate: TODAY, targetDate: null, milestoneDefId: null });
    const evB = await createEvent(db, { deviceId, childId: b.id }, { kind: 'medical', title: 'Fictional checkup', date: '2026-12-01', time: '', location: '', notes: '' });
    await deleteChild(db, deviceId, a.id, { purgeFromBackups: true });
    expect(await listEntries(db, a.id)).toEqual([]);
    expect(await db.getAllFromIndex('journal', 'byChild', IDBKeyRange.only(a.id))).toEqual([]);
    expect(JSON.stringify(await db.getAll('journal'))).not.toMatch(/Fictional A|fictional-a-tag/);
    expect(await listEntries(db, b.id)).toEqual([eb]);
    expect(await listEvents(db, b.id)).toEqual([evB]);
    expect((await loadChildPersonal(db, b.id)).goals.map((g) => g.title)).toEqual(['Fictional goal']);
    await expect(createEntry(db, ctxA, input())).rejects.toThrow(/no longer exists/); // nothing can be written to a deleted profile
  });

  it('a full reset removes every entry with the rest of the database', async () => {
    const { name, db, ctxA, ctxB } = await setup();
    await createEntry(db, ctxA, input());
    await createEntry(db, ctxB, question());
    await deleteAllData(db, name);
    opened.splice(opened.indexOf(db), 1);
    const fresh = await openRcrDb(name);
    opened.push(fresh);
    expect(await fresh.getAll('journal')).toEqual([]);
    expect(await fresh.getAll('children')).toEqual([]);
  });

  it('journal writes leave milestone, goal, calendar and settings records untouched', async () => {
    const { db, deviceId, ctxA, a } = await setup();
    const mctx = { deviceId, childId: a.id, dob: a.dob, today: '2026-06-01', ageBasis: { basis: 'chronological' as const, milestoneAgeMonths: 15 } };
    await setStatus(db, mctx, { kind: 'sourced', defId: 'cdc22-m02-se-01' }, 'achieved', '2025-04-10');
    await createGoal(db, { deviceId, childId: a.id, dob: a.dob, today: TODAY }, { title: 'Fictional goal', appCategory: null, description: '', startDate: TODAY, targetDate: null, milestoneDefId: null });
    await createEvent(db, { deviceId, childId: a.id }, { kind: 'personal', title: 'Fictional visit', date: '2026-12-02', time: '', location: '', notes: '' });
    const snapshot = async () => {
      const out: Record<string, unknown> = {};
      for (const s of [...db.objectStoreNames].filter((x) => x !== 'journal')) out[s] = await db.getAll(s as never);
      return JSON.stringify(out);
    };
    const before = await snapshot();
    const e = await createEntry(db, ctxA, question());
    await updateEntry(db, ctxA, e.id, question({ title: 'Fictional edit' }));
    await setAnswered(db, ctxA, e.id, true);
    await deleteEntry(db, ctxA, e.id);
    expect(await snapshot()).toBe(before);
    expect((await loadChildMilestones(db, a.id)).records).toHaveLength(1);
  });
});
